"""
ReAct (Reason + Act) agent loop for autonomous ticket resolution.
Think → Act → Observe → Repeat  (minimum 3 tool calls per ticket)
"""

import asyncio
import json
import logging
import os
import random
from datetime import datetime
from typing import Any, Optional

from tools import TOOL_REGISTRY

logger = logging.getLogger("react_agent")

MAX_ITERATIONS = 10
MAX_RETRIES = 3


# ─── Gemini LLM call ─────────────────────────────────────────────────────────

async def _call_llm(messages: list[dict]) -> str:
    """Call Gemini via google-genai SDK."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY", ""))
        model = genai.GenerativeModel("gemini-1.5-flash")
        # Flatten messages to a single prompt for simplicity
        prompt = "\n\n".join(
            f"[{m['role'].upper()}]\n{m['content']}" for m in messages
        )
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.warning(f"LLM call failed: {e}. Using fallback reasoning.")
        return _fallback_reasoning(messages)


def _fallback_reasoning(messages: list[dict]) -> str:
    """Deterministic fallback when LLM is unavailable."""
    last = messages[-1]["content"] if messages else ""
    ticket_data = {}
    for m in messages:
        if "ticket_data" in m.get("content", ""):
            try:
                start = m["content"].find("{")
                end = m["content"].rfind("}") + 1
                ticket_data = json.loads(m["content"][start:end])
            except Exception:
                pass

    email = ticket_data.get("user_email", "unknown@example.com")
    desc = ticket_data.get("description", "").lower()
    order_id = ticket_data.get("order_id", "ORD-001")

    if any(w in desc for w in ["refund", "return", "money back", "charge"]):
        return json.dumps({
            "thought": "Customer is requesting a refund. I need to verify their identity, check the order, and process the refund if eligible.",
            "action": "get_customer",
            "action_input": {"email": email},
        })
    elif any(w in desc for w in ["broken", "defect", "not working", "damaged"]):
        return json.dumps({
            "thought": "Customer reports a defective product. I should look up their order and check warranty/refund options.",
            "action": "get_order",
            "action_input": {"order_id": order_id},
        })
    else:
        return json.dumps({
            "thought": "General support query. Let me search the knowledge base for relevant information.",
            "action": "search_knowledge_base",
            "action_input": {"query": desc[:100]},
        })


# ─── System prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an Autonomous Support Resolution Agent. You resolve customer support tickets using a ReAct loop.

TOOLS AVAILABLE:
- get_customer(email) → customer profile
- get_order(order_id) → order details
- get_product(product_id) → product info
- search_knowledge_base(query) → relevant KB articles
- check_refund_eligibility(order_id) → eligibility check (may fail transiently)
- issue_refund(order_id, amount) → process refund
- send_reply(ticket_id, message) → reply to customer
- escalate(ticket_id, summary, priority) → escalate to human

RULES:
1. You MUST call at least 3 tools before reaching a final answer.
2. Always gather context first (customer + order/product) before acting.
3. For refund requests: check eligibility → issue if eligible → send reply.
4. For general queries: search KB → send reply.
5. Only escalate if you cannot resolve autonomously.
6. After all actions, output FINAL_ANSWER with confidence 0.0-1.0.

OUTPUT FORMAT (strict JSON, one object per response):
For a reasoning step:
{"thought": "...", "action": "tool_name", "action_input": {...}}

For the final answer:
{"thought": "...", "final_answer": "summary of what was done", "confidence": 0.85, "action_taken": "refund|reply|escalate|resolved"}

IMPORTANT: Output ONLY valid JSON. No markdown, no extra text.
"""


# ─── ReAct loop ───────────────────────────────────────────────────────────────

async def run_react_agent(ticket: dict, on_step=None) -> dict:
    """
    Run the ReAct loop for a ticket.

    Args:
        ticket: dict with keys: ticket_id, subject, description, user_email, order_id (optional)
        on_step: async callback(step_type, data) for streaming updates

    Returns:
        dict with reasoning_steps, tool_calls, final_action, confidence_score, error
    """
    reasoning_steps = []
    tool_calls = []
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Resolve this support ticket:\n"
                f"ticket_data: {json.dumps(ticket)}\n\n"
                f"Subject: {ticket.get('subject', '')}\n"
                f"Description: {ticket.get('description', '')}\n"
                f"Customer email: {ticket.get('user_email', '')}\n"
                f"Order ID (if mentioned): {ticket.get('order_id', 'unknown')}"
            ),
        },
    ]

    final_action = "unknown"
    confidence = 0.5
    error_log = []
    tool_call_count = 0

    for iteration in range(MAX_ITERATIONS):
        # ── Think ──
        raw = await _call_llm(messages)

        # Parse JSON from LLM output
        step_data = _parse_json(raw)
        if not step_data:
            logger.warning(f"Iteration {iteration}: could not parse LLM output: {raw[:200]}")
            error_log.append({"iteration": iteration, "error": "JSON parse failed", "raw": raw[:200]})
            break

        thought = step_data.get("thought", "")
        step_num = len(reasoning_steps) + 1
        reasoning_steps.append({"step_number": step_num, "thought": thought})

        if on_step:
            await on_step("thought", {"step": step_num, "thought": thought})

        # ── Final answer? ──
        if "final_answer" in step_data:
            final_action = step_data.get("action_taken", "resolved")
            confidence = float(step_data.get("confidence", 0.7))

            # Enforce minimum 3 tool calls
            if tool_call_count < 3:
                messages.append({
                    "role": "assistant",
                    "content": raw,
                })
                messages.append({
                    "role": "user",
                    "content": (
                        f"You have only made {tool_call_count} tool calls. "
                        "You MUST make at least 3 tool calls before concluding. "
                        "Continue reasoning and use more tools."
                    ),
                })
                continue
            break

        # ── Act ──
        action = step_data.get("action")
        action_input = step_data.get("action_input", {})

        if not action or action not in TOOL_REGISTRY:
            error_log.append({"iteration": iteration, "error": f"Unknown action: {action}"})
            messages.append({"role": "assistant", "content": raw})
            messages.append({"role": "user", "content": f"Tool '{action}' does not exist. Choose from: {list(TOOL_REGISTRY.keys())}"})
            continue

        # ── Execute with retry ──
        tool_result, tool_status, attempt_used = await _execute_with_retry(
            action, action_input, ticket["ticket_id"]
        )
        tool_call_count += 1

        tc = {
            "tool_name": action,
            "arguments": action_input,
            "result": json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result,
            "status": tool_status,
            "attempt": attempt_used,
        }
        tool_calls.append(tc)

        if on_step:
            await on_step("tool_call", tc)

        # ── Observe ──
        observation = json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
        messages.append({"role": "assistant", "content": raw})
        messages.append({"role": "user", "content": f"Observation from {action}: {observation}"})

    return {
        "reasoning_steps": reasoning_steps,
        "tool_calls": tool_calls,
        "final_action": final_action,
        "confidence_score": confidence,
        "errors": error_log,
        "tool_call_count": tool_call_count,
    }


async def _execute_with_retry(tool_name: str, args: dict, ticket_id: str) -> tuple[Any, str, int]:
    """Execute a tool with retry on transient failures."""
    fn = TOOL_REGISTRY[tool_name]
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            result = await fn(**args)
            status = "success" if not (isinstance(result, dict) and "error" in result) else "error"
            return result, status, attempt
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Tool {tool_name} attempt {attempt} failed: {e}")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(0.5 * attempt)  # exponential backoff

    return {"error": f"Tool failed after {MAX_RETRIES} attempts: {last_error}"}, "retried", MAX_RETRIES


def _parse_json(text: str) -> Optional[dict]:
    """Extract and parse the first JSON object from text."""
    text = text.strip()
    # Strip markdown code fences
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    # Find first { ... }
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError:
                    return None
    return None
