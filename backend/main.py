"""
FastAPI backend for the Autonomous Support Resolution Agent.
Endpoints:
  GET  /tickets          - list all tickets
  GET  /tickets/{id}     - ticket detail with reasoning + tool calls
  POST /run-agent        - submit a ticket and run the ReAct agent
  GET  /logs             - audit log entries
  GET  /stats            - dashboard summary stats
"""

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, init_db
from models import (
    Ticket, ReasoningStep, ToolCall,
    TicketStatus, TicketPriority, TicketCategory,
    generate_ticket_id,
)
from react_agent import run_react_agent
from audit_logger import log_ticket_run, read_audit_log

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("main")


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialised")
    yield


app = FastAPI(title="Autonomous Support Agent API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class RunAgentRequest(BaseModel):
    subject: str
    description: str
    user_email: str
    order_id: Optional[str] = None
    priority: Optional[str] = "medium"
    category: Optional[str] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _ticket_to_dict(t: Ticket) -> dict:
    return {
        "id": t.id,
        "ticket_id": t.ticket_id,
        "subject": t.subject,
        "description": t.description,
        "user_email": t.user_email,
        "status": t.status.value,
        "priority": t.priority.value,
        "category": t.category.value if t.category else None,
        "assigned_team": t.assigned_team,
        "final_action": t.final_action,
        "confidence_score": t.confidence_score,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
    }


def _reasoning_to_list(steps) -> list:
    return [{"step_number": s.step_number, "thought": s.thought}
            for s in sorted(steps, key=lambda x: x.step_number)]


def _toolcalls_to_list(calls) -> list:
    result = []
    for c in sorted(calls, key=lambda x: x.id):
        try:
            res = json.loads(c.result) if c.result else {}
        except Exception:
            res = {"raw": c.result}
        result.append({
            "id": c.id,
            "tool_name": c.tool_name,
            "arguments": c.arguments or {},
            "result": res,
            "status": c.status,
            "attempt": c.attempt,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return result


# ─── Background agent runner ──────────────────────────────────────────────────

async def _run_agent_background(ticket_id: str, ticket_payload: dict):
    db = SessionLocal()
    try:
        db_ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
        if not db_ticket:
            return

        db_ticket.status = TicketStatus.IN_PROGRESS
        db.commit()

        result = await run_react_agent(ticket_payload)

        for step in result["reasoning_steps"]:
            db.add(ReasoningStep(
                ticket_id=db_ticket.id,
                step_number=step["step_number"],
                thought=step["thought"],
            ))

        for tc in result["tool_calls"]:
            db.add(ToolCall(
                ticket_id=db_ticket.id,
                tool_name=tc["tool_name"],
                arguments=tc.get("arguments", {}),
                result=tc.get("result", ""),
                status=tc.get("status", "success"),
                attempt=tc.get("attempt", 1),
            ))

        final_action = result.get("final_action", "resolved")
        confidence   = result.get("confidence_score", 0.7)
        errors       = result.get("errors", [])

        if errors and not result["tool_calls"]:
            db_ticket.status = TicketStatus.FAILED
        elif final_action == "escalate":
            db_ticket.status = TicketStatus.ESCALATED
        else:
            db_ticket.status = TicketStatus.RESOLVED
            db_ticket.resolved_at = datetime.now()

        db_ticket.final_action     = final_action
        db_ticket.confidence_score = confidence
        db.commit()

        await log_ticket_run(
            ticket_id=ticket_id,
            subject=ticket_payload.get("subject", ""),
            user_email=ticket_payload.get("user_email", ""),
            reasoning_steps=result["reasoning_steps"],
            tool_calls=result["tool_calls"],
            final_action=final_action,
            confidence_score=confidence,
            errors=errors,
            status=db_ticket.status.value,
        )

    except Exception as e:
        logger.error(f"Agent run failed for {ticket_id}: {e}", exc_info=True)
        db_ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
        if db_ticket:
            db_ticket.status = TicketStatus.FAILED
            db.commit()
    finally:
        db.close()


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Autonomous Support Agent API v2.0", "docs": "/docs"}


@app.get("/tickets")
async def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
):
    db = SessionLocal()
    try:
        q = db.query(Ticket)
        if status:
            try:
                q = q.filter(Ticket.status == TicketStatus(status))
            except ValueError:
                pass
        if priority:
            try:
                q = q.filter(Ticket.priority == TicketPriority(priority))
            except ValueError:
                pass
        tickets = q.order_by(Ticket.created_at.desc()).limit(limit).all()
        return [_ticket_to_dict(t) for t in tickets]
    finally:
        db.close()


@app.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    db = SessionLocal()
    try:
        t = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Ticket not found")
        data = _ticket_to_dict(t)
        data["reasoning_steps"] = _reasoning_to_list(t.reasoning_steps)
        data["tool_calls"]      = _toolcalls_to_list(t.tool_calls)
        return data
    finally:
        db.close()


@app.post("/run-agent", status_code=202)
async def run_agent(req: RunAgentRequest, background_tasks: BackgroundTasks):
    db = SessionLocal()
    try:
        cat = None
        if req.category:
            try:
                cat = TicketCategory(req.category.lower())
            except ValueError:
                pass

        pri = TicketPriority.MEDIUM
        try:
            pri = TicketPriority(req.priority.lower())
        except (ValueError, AttributeError):
            pass

        ticket_id = generate_ticket_id()
        db_ticket = Ticket(
            ticket_id=ticket_id,
            subject=req.subject,
            description=req.description,
            user_email=req.user_email,
            status=TicketStatus.PENDING,
            priority=pri,
            category=cat,
        )
        db.add(db_ticket)
        db.commit()
        db.refresh(db_ticket)

        payload = {
            "ticket_id": ticket_id,
            "subject": req.subject,
            "description": req.description,
            "user_email": req.user_email,
            "order_id": req.order_id or "ORD-001",
        }

        background_tasks.add_task(_run_agent_background, ticket_id, payload)

        return {
            "ticket_id": ticket_id,
            "status": "pending",
            "message": "Ticket created. Agent is processing in background.",
        }
    finally:
        db.close()


@app.get("/logs")
async def get_logs(limit: int = 100):
    entries = read_audit_log(limit=limit)
    return {"logs": entries, "total": len(entries)}


@app.get("/stats")
async def get_stats():
    db = SessionLocal()
    try:
        total       = db.query(Ticket).count()
        resolved    = db.query(Ticket).filter(Ticket.status == TicketStatus.RESOLVED).count()
        escalated   = db.query(Ticket).filter(Ticket.status == TicketStatus.ESCALATED).count()
        failed      = db.query(Ticket).filter(Ticket.status == TicketStatus.FAILED).count()
        pending     = db.query(Ticket).filter(Ticket.status == TicketStatus.PENDING).count()
        in_progress = db.query(Ticket).filter(Ticket.status == TicketStatus.IN_PROGRESS).count()

        return {
            "total": total,
            "resolved": resolved,
            "escalated": escalated,
            "failed": failed,
            "pending": pending,
            "in_progress": in_progress,
            "resolution_rate": round(resolved / total * 100, 1) if total else 0,
        }
    finally:
        db.close()


# ─── Dev entrypoint ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
