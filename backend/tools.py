"""
Tool implementations for the ReAct agent.
Each tool is a plain async function that returns a dict result.
"""

import random
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger("tools")

# ─── Mock data stores ────────────────────────────────────────────────────────

CUSTOMERS = {
    "alice@example.com": {
        "id": "C001", "name": "Alice Johnson", "email": "alice@example.com",
        "tier": "premium", "account_age_days": 730, "total_orders": 45,
    },
    "bob@example.com": {
        "id": "C002", "name": "Bob Smith", "email": "bob@example.com",
        "tier": "standard", "account_age_days": 180, "total_orders": 12,
    },
    "carol@example.com": {
        "id": "C003", "name": "Carol White", "email": "carol@example.com",
        "tier": "premium", "account_age_days": 1095, "total_orders": 88,
    },
}

ORDERS = {
    "ORD-001": {
        "order_id": "ORD-001", "customer_email": "alice@example.com",
        "product_id": "PROD-A1", "amount": 149.99, "status": "delivered",
        "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
        "delivered_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
    "ORD-002": {
        "order_id": "ORD-002", "customer_email": "bob@example.com",
        "product_id": "PROD-B2", "amount": 59.99, "status": "shipped",
        "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
        "delivered_at": None,
    },
    "ORD-003": {
        "order_id": "ORD-003", "customer_email": "carol@example.com",
        "product_id": "PROD-C3", "amount": 299.99, "status": "delivered",
        "created_at": (datetime.now() - timedelta(days=30)).isoformat(),
        "delivered_at": (datetime.now() - timedelta(days=27)).isoformat(),
    },
}

PRODUCTS = {
    "PROD-A1": {
        "product_id": "PROD-A1", "name": "Wireless Headphones Pro",
        "category": "Electronics", "price": 149.99,
        "return_window_days": 30, "warranty_months": 12,
    },
    "PROD-B2": {
        "product_id": "PROD-B2", "name": "Ergonomic Mouse",
        "category": "Peripherals", "price": 59.99,
        "return_window_days": 30, "warranty_months": 6,
    },
    "PROD-C3": {
        "product_id": "PROD-C3", "name": "4K Monitor 27\"",
        "category": "Displays", "price": 299.99,
        "return_window_days": 14, "warranty_months": 24,
    },
}

KNOWLEDGE_BASE = [
    {
        "id": "KB-001", "title": "How to reset your password",
        "content": "Go to login page → click 'Forgot Password' → enter email → check inbox for reset link.",
        "tags": ["password", "account", "login"],
    },
    {
        "id": "KB-002", "title": "Return & Refund Policy",
        "content": "Items can be returned within 30 days of delivery (14 days for displays). Refunds processed in 3-5 business days.",
        "tags": ["refund", "return", "policy"],
    },
    {
        "id": "KB-003", "title": "Shipping delays",
        "content": "Standard shipping takes 3-7 days. Express 1-2 days. Delays may occur during peak seasons.",
        "tags": ["shipping", "delivery", "delay"],
    },
    {
        "id": "KB-004", "title": "Product warranty claims",
        "content": "Contact support with order ID and description of defect. Warranty covers manufacturing defects only.",
        "tags": ["warranty", "defect", "repair"],
    },
    {
        "id": "KB-005", "title": "Account billing issues",
        "content": "For double charges or incorrect billing, provide order ID. Corrections processed within 24 hours.",
        "tags": ["billing", "charge", "payment"],
    },
]

# Track issued refunds in memory (in production this would be DB)
_issued_refunds: dict[str, float] = {}


# ─── Tool functions ───────────────────────────────────────────────────────────

async def get_customer(email: str) -> dict:
    """Fetch customer profile by email."""
    await asyncio.sleep(0.05)  # simulate I/O
    customer = CUSTOMERS.get(email.lower())
    if not customer:
        return {"error": f"Customer with email '{email}' not found."}
    return {"success": True, "customer": customer}


async def get_order(order_id: str) -> dict:
    """Fetch order details by order ID."""
    await asyncio.sleep(0.05)
    order = ORDERS.get(order_id.upper())
    if not order:
        return {"error": f"Order '{order_id}' not found."}
    return {"success": True, "order": order}


async def get_product(product_id: str) -> dict:
    """Fetch product details by product ID."""
    await asyncio.sleep(0.05)
    product = PRODUCTS.get(product_id.upper())
    if not product:
        return {"error": f"Product '{product_id}' not found."}
    return {"success": True, "product": product}


async def search_knowledge_base(query: str) -> dict:
    """Search the knowledge base for relevant articles."""
    await asyncio.sleep(0.05)
    query_lower = query.lower()
    results = []
    for article in KNOWLEDGE_BASE:
        score = 0
        if any(word in article["title"].lower() for word in query_lower.split()):
            score += 2
        if any(tag in query_lower for tag in article["tags"]):
            score += 3
        if any(word in article["content"].lower() for word in query_lower.split()):
            score += 1
        if score > 0:
            results.append({**article, "relevance_score": score})
    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return {"success": True, "results": results[:3], "total_found": len(results)}


async def check_refund_eligibility(order_id: str) -> dict:
    """
    Check if an order is eligible for a refund.
    Simulates random failures ~20% of the time to test retry logic.
    """
    await asyncio.sleep(0.1)

    # Simulate transient failure
    if random.random() < 0.2:
        raise RuntimeError(f"Refund service temporarily unavailable for order {order_id}")

    order = ORDERS.get(order_id.upper())
    if not order:
        return {"eligible": False, "reason": f"Order '{order_id}' not found."}

    if order_id in _issued_refunds:
        return {"eligible": False, "reason": "Refund already issued for this order.", "already_refunded": True}

    product = PRODUCTS.get(order["product_id"])
    return_window = product["return_window_days"] if product else 30

    if order["status"] not in ("delivered", "shipped"):
        return {"eligible": False, "reason": f"Order status is '{order['status']}' — not eligible."}

    if order["delivered_at"]:
        delivered = datetime.fromisoformat(order["delivered_at"])
        days_since = (datetime.now() - delivered).days
        if days_since > return_window:
            return {
                "eligible": False,
                "reason": f"Return window of {return_window} days has passed ({days_since} days since delivery).",
            }

    return {
        "eligible": True,
        "order_id": order_id,
        "amount": order["amount"],
        "reason": "Order is within return window and eligible for full refund.",
    }


async def issue_refund(order_id: str, amount: float) -> dict:
    """Issue a refund for an order."""
    await asyncio.sleep(0.15)

    order = ORDERS.get(order_id.upper())
    if not order:
        return {"success": False, "error": f"Order '{order_id}' not found."}

    if order_id in _issued_refunds:
        return {"success": False, "error": "Refund already issued for this order."}

    _issued_refunds[order_id] = amount
    ref_id = f"REF-{order_id}-{datetime.now().strftime('%H%M%S')}"

    return {
        "success": True,
        "refund_id": ref_id,
        "order_id": order_id,
        "amount_refunded": amount,
        "message": f"Refund of ${amount:.2f} successfully issued. Reference: {ref_id}. Funds arrive in 3-5 business days.",
    }


async def send_reply(ticket_id: str, message: str) -> dict:
    """Send a reply message to the customer for a given ticket."""
    await asyncio.sleep(0.05)
    # In production this would send an email / push notification
    logger.info(f"[REPLY] Ticket {ticket_id}: {message}")
    return {
        "success": True,
        "ticket_id": ticket_id,
        "message_sent": message,
        "timestamp": datetime.now().isoformat(),
        "channel": "email",
    }


async def escalate(ticket_id: str, summary: str, priority: str = "medium") -> dict:
    """Escalate a ticket to a human agent."""
    await asyncio.sleep(0.05)
    valid_priorities = ("low", "medium", "high", "critical")
    if priority not in valid_priorities:
        priority = "medium"

    team_map = {
        "low": "General Support",
        "medium": "Tier-2 Support",
        "high": "Senior Support",
        "critical": "Escalation Team",
    }

    logger.info(f"[ESCALATE] Ticket {ticket_id} → {team_map[priority]}: {summary}")
    return {
        "success": True,
        "ticket_id": ticket_id,
        "assigned_team": team_map[priority],
        "priority": priority,
        "summary": summary,
        "escalation_id": f"ESC-{ticket_id}-{datetime.now().strftime('%H%M%S')}",
        "message": f"Ticket escalated to {team_map[priority]} with {priority} priority.",
    }


# ─── Tool registry ────────────────────────────────────────────────────────────

TOOL_REGISTRY: dict[str, callable] = {
    "get_customer": get_customer,
    "get_order": get_order,
    "get_product": get_product,
    "search_knowledge_base": search_knowledge_base,
    "check_refund_eligibility": check_refund_eligibility,
    "issue_refund": issue_refund,
    "send_reply": send_reply,
    "escalate": escalate,
}
