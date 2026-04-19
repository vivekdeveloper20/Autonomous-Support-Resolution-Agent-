"""
Seed the database with demo tickets so the dashboard isn't empty on first run.
Run: python seed_demo.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, SessionLocal
from models import Ticket, TicketStatus, TicketPriority, TicketCategory, generate_ticket_id
from react_agent import run_react_agent
from audit_logger import log_ticket_run
from datetime import datetime

DEMO_TICKETS = [
    {
        "subject": "Refund request for damaged headphones",
        "description": "I received my Wireless Headphones Pro (ORD-001) and one ear cup is cracked. I want a full refund.",
        "user_email": "alice@example.com",
        "order_id": "ORD-001",
        "priority": "high",
        "category": "billing",
    },
    {
        "subject": "Where is my order?",
        "description": "My ergonomic mouse order ORD-002 was supposed to arrive yesterday. Can you check the status?",
        "user_email": "bob@example.com",
        "order_id": "ORD-002",
        "priority": "medium",
        "category": "general",
    },
    {
        "subject": "Password reset not working",
        "description": "I cannot log into my account. The password reset email never arrives.",
        "user_email": "carol@example.com",
        "order_id": None,
        "priority": "medium",
        "category": "access",
    },
]


async def seed():
    init_db()
    db = SessionLocal()

    for demo in DEMO_TICKETS:
        ticket_id = generate_ticket_id()
        cat = None
        try:
            from models import TicketCategory
            cat = TicketCategory(demo["category"])
        except Exception:
            pass

        pri = TicketPriority.MEDIUM
        try:
            pri = TicketPriority(demo["priority"])
        except Exception:
            pass

        t = Ticket(
            ticket_id=ticket_id,
            subject=demo["subject"],
            description=demo["description"],
            user_email=demo["user_email"],
            status=TicketStatus.PENDING,
            priority=pri,
            category=cat,
        )
        db.add(t)
        db.commit()
        db.refresh(t)

        print(f"Created {ticket_id} — running agent…")
        payload = {
            "ticket_id": ticket_id,
            "subject": demo["subject"],
            "description": demo["description"],
            "user_email": demo["user_email"],
            "order_id": demo.get("order_id") or "ORD-001",
        }

        from models import ReasoningStep, ToolCall
        result = await run_react_agent(payload)

        for step in result["reasoning_steps"]:
            db.add(ReasoningStep(ticket_id=t.id, step_number=step["step_number"], thought=step["thought"]))

        for tc in result["tool_calls"]:
            import json
            db.add(ToolCall(
                ticket_id=t.id,
                tool_name=tc["tool_name"],
                arguments=tc.get("arguments", {}),
                result=tc.get("result", ""),
                status=tc.get("status", "success"),
                attempt=tc.get("attempt", 1),
            ))

        final_action = result.get("final_action", "resolved")
        confidence   = result.get("confidence_score", 0.7)

        if final_action == "escalate":
            t.status = TicketStatus.ESCALATED
        else:
            t.status = TicketStatus.RESOLVED
            t.resolved_at = datetime.now()

        t.final_action    = final_action
        t.confidence_score = confidence
        db.commit()

        await log_ticket_run(
            ticket_id=ticket_id,
            subject=demo["subject"],
            user_email=demo["user_email"],
            reasoning_steps=result["reasoning_steps"],
            tool_calls=result["tool_calls"],
            final_action=final_action,
            confidence_score=confidence,
            errors=result.get("errors", []),
            status=t.status.value,
        )
        print(f"  ✓ {ticket_id} → {t.status.value} (confidence {round(confidence*100)}%)")

    db.close()
    print("\nDemo data seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
