"""
Tool implementations for the ReAct agent.
Loads real data from hackathon JSON files (customers, orders, products, knowledge-base).
Each tool is a plain async function that returns a dict result.
"""

import json
import asyncio
import logging
import os
import random
import re
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger("tools")

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# ─── Load data from JSON files ───────────────────────────────────────────────

def _load_json(filename: str) -> list:
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_knowledge_base(filename: str = "knowledge-base.md") -> list[dict]:
    """Parse knowledge-base.md into searchable sections."""
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    sections = []
    current_title = ""
    current_content = ""
    current_tags = []

    for line in content.split("\n"):
        if line.startswith("## ") or line.startswith("### "):
            if current_title and current_content.strip():
                sections.append({
                    "id": f"KB-{len(sections)+1:03d}",
                    "title": current_title.strip(),
                    "content": current_content.strip(),
                    "tags": current_tags,
                })
            current_title = line.lstrip("#").strip()
            current_content = ""
            # Auto-generate tags from title
            current_tags = [w.lower() for w in re.findall(r'\w+', current_title)
                           if len(w) > 3 and w.lower() not in ("with", "from", "that", "this", "have")]
        else:
            current_content += line + "\n"

    if current_title and current_content.strip():
        sections.append({
            "id": f"KB-{len(sections)+1:03d}",
            "title": current_title.strip(),
            "content": current_content.strip(),
            "tags": current_tags,
        })

    return sections


# ─── Build indexed data stores ───────────────────────────────────────────────

_raw_customers = _load_json("customers.json")
_raw_orders = _load_json("orders.json")
_raw_products = _load_json("products.json")
_raw_tickets = _load_json("tickets.json")
KNOWLEDGE_BASE = _load_knowledge_base()

# Index by email (lowercase)
CUSTOMERS: dict[str, dict] = {c["email"].lower(): c for c in _raw_customers}
# Also index by customer_id
CUSTOMERS_BY_ID: dict[str, dict] = {c["customer_id"]: c for c in _raw_customers}

# Index by order_id (uppercase)
ORDERS: dict[str, dict] = {o["order_id"].upper(): o for o in _raw_orders}

# Index by product_id (uppercase)
PRODUCTS: dict[str, dict] = {p["product_id"].upper(): p for p in _raw_products}

# Track issued refunds in memory (in production this would be DB)
_issued_refunds: dict[str, float] = {}

# Pre-mark already-refunded orders
for _oid, _order in ORDERS.items():
    if _order.get("refund_status") == "refunded":
        _issued_refunds[_oid] = _order.get("amount", 0)

logger.info(
    f"Loaded data: {len(CUSTOMERS)} customers, {len(ORDERS)} orders, "
    f"{len(PRODUCTS)} products, {len(KNOWLEDGE_BASE)} KB sections"
)


# ─── Tool functions ──────────────────────────────────────────────────────────

async def get_customer(email: str) -> dict:
    """Fetch customer profile by email."""
    await asyncio.sleep(0.05)
    customer = CUSTOMERS.get(email.lower())
    if not customer:
        return {"error": f"Customer with email '{email}' not found in system."}
    return {"success": True, "customer": customer}


async def get_order(order_id: str) -> dict:
    """Fetch order details by order ID."""
    await asyncio.sleep(0.05)
    order = ORDERS.get(order_id.upper())
    if not order:
        return {"error": f"Order '{order_id}' not found."}

    # Enrich with product info
    product = PRODUCTS.get(order.get("product_id", "").upper())
    result = {**order}
    if product:
        result["product_name"] = product["name"]
        result["product_category"] = product.get("category")
        result["warranty_months"] = product.get("warranty_months", 0)
        result["product_return_window_days"] = product.get("return_window_days", 30)
        result["returnable"] = product.get("returnable", True)
    return {"success": True, "order": result}


async def get_orders_by_email(email: str) -> dict:
    """Look up all orders for a customer by their email address."""
    await asyncio.sleep(0.05)
    customer = CUSTOMERS.get(email.lower())
    if not customer:
        return {"error": f"No customer found with email '{email}'."}

    customer_id = customer["customer_id"]
    matching = [o for o in ORDERS.values() if o["customer_id"] == customer_id]
    if not matching:
        return {"error": f"No orders found for customer '{customer_id}'."}

    return {
        "success": True,
        "customer_id": customer_id,
        "customer_name": customer["name"],
        "orders": matching,
        "total_orders": len(matching),
    }


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
    query_words = set(query_lower.split())
    results = []

    for article in KNOWLEDGE_BASE:
        score = 0
        title_lower = article["title"].lower()
        content_lower = article["content"].lower()

        # Title word matches
        for word in query_words:
            if word in title_lower:
                score += 3
        # Tag matches
        for tag in article["tags"]:
            if tag in query_lower:
                score += 2
        # Content word matches
        for word in query_words:
            if len(word) > 3 and word in content_lower:
                score += 1

        if score > 0:
            results.append({**article, "relevance_score": score})

    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return {"success": True, "results": results[:5], "total_found": len(results)}


async def check_refund_eligibility(order_id: str) -> dict:
    """
    Check if an order is eligible for a refund.
    Considers: return window, refund status, product returnability, customer tier.
    Simulates random failures ~15% of the time to test retry logic.
    """
    await asyncio.sleep(0.1)

    # Simulate transient failure
    if random.random() < 0.15:
        raise RuntimeError(f"Refund service temporarily unavailable for order {order_id}")

    oid = order_id.upper()
    order = ORDERS.get(oid)
    if not order:
        return {"eligible": False, "reason": f"Order '{order_id}' not found."}

    # Already refunded?
    if order.get("refund_status") == "refunded" or oid in _issued_refunds:
        return {
            "eligible": False,
            "reason": "Refund already processed for this order.",
            "already_refunded": True,
            "refund_status": "refunded",
        }

    # Order must be delivered
    if order["status"] not in ("delivered",):
        if order["status"] == "processing":
            return {"eligible": False, "reason": f"Order is still in '{order['status']}' status. Use cancel_order instead.", "suggest_cancel": True}
        if order["status"] == "shipped":
            return {"eligible": False, "reason": "Order is shipped but not yet delivered. Customer must wait for delivery."}
        return {"eligible": False, "reason": f"Order status is '{order['status']}' — not eligible for refund."}

    product = PRODUCTS.get(order.get("product_id", "").upper(), {})

    # Check if product is returnable
    if not product.get("returnable", True):
        return {"eligible": False, "reason": f"Product '{product.get('name', '')}' is non-returnable."}

    # Check return window
    return_deadline = order.get("return_deadline")
    if return_deadline:
        deadline = datetime.strptime(return_deadline, "%Y-%m-%d")
        today = datetime.now()

        if today > deadline:
            # Check for VIP exception
            customer_id = order.get("customer_id")
            customer = CUSTOMERS_BY_ID.get(customer_id, {})
            tier = customer.get("tier", "standard")
            notes = customer.get("notes", "")

            if tier == "vip" and ("pre-approved" in notes.lower() or "exception" in notes.lower()):
                return {
                    "eligible": True,
                    "order_id": oid,
                    "amount": order["amount"],
                    "reason": "Return window expired, but VIP customer has pre-approved extended return exception.",
                    "vip_exception": True,
                    "customer_tier": "vip",
                }
            elif tier == "premium":
                days_past = (today - deadline).days
                if days_past <= 3:
                    return {
                        "eligible": True,
                        "order_id": oid,
                        "amount": order["amount"],
                        "reason": f"Return window expired {days_past} day(s) ago, but premium customer is within borderline grace period. Requires supervisor note.",
                        "premium_borderline": True,
                        "customer_tier": "premium",
                    }
                return {
                    "eligible": False,
                    "reason": f"Return window expired on {return_deadline} ({days_past} days ago). Premium tier grace period (3 days) also exceeded.",
                    "customer_tier": "premium",
                }
            else:
                days_past = (today - deadline).days
                return {
                    "eligible": False,
                    "reason": f"Return window expired on {return_deadline} ({days_past} days ago). Standard tier — no exceptions.",
                    "customer_tier": tier,
                }

    # Check warranty (if product has warranty and issue sounds like defect)
    warranty_months = product.get("warranty_months", 0)
    delivery_date = order.get("delivery_date")
    warranty_active = False
    if warranty_months and delivery_date:
        delivered = datetime.strptime(delivery_date, "%Y-%m-%d")
        warranty_end = delivered + timedelta(days=warranty_months * 30)
        warranty_active = datetime.now() <= warranty_end

    return {
        "eligible": True,
        "order_id": oid,
        "amount": order["amount"],
        "reason": "Order is within return window and eligible for refund.",
        "return_deadline": return_deadline,
        "warranty_active": warranty_active,
        "warranty_months": warranty_months,
    }


async def issue_refund(order_id: str, amount: float) -> dict:
    """Issue a refund for an order."""
    await asyncio.sleep(0.15)

    oid = order_id.upper()
    order = ORDERS.get(oid)
    if not order:
        return {"success": False, "error": f"Order '{order_id}' not found."}

    if oid in _issued_refunds:
        return {"success": False, "error": "Refund already issued for this order."}

    # Flag high-value refunds for escalation
    if amount > 200:
        return {
            "success": False,
            "error": f"Refund amount ${amount:.2f} exceeds $200 threshold. Must be escalated for approval.",
            "requires_escalation": True,
        }

    _issued_refunds[oid] = amount
    order["refund_status"] = "refunded"
    ref_id = f"REF-{oid}-{datetime.now().strftime('%H%M%S')}"

    return {
        "success": True,
        "refund_id": ref_id,
        "order_id": oid,
        "amount_refunded": amount,
        "message": f"Refund of ${amount:.2f} successfully issued. Reference: {ref_id}. Funds will appear in 5-7 business days.",
    }


async def cancel_order(order_id: str) -> dict:
    """Cancel an order that is still in 'processing' status."""
    await asyncio.sleep(0.1)

    oid = order_id.upper()
    order = ORDERS.get(oid)
    if not order:
        return {"success": False, "error": f"Order '{order_id}' not found."}

    if order["status"] == "processing":
        order["status"] = "cancelled"
        return {
            "success": True,
            "order_id": oid,
            "message": f"Order {oid} has been cancelled successfully. Confirmation email will be sent within 1 hour.",
            "previous_status": "processing",
        }
    elif order["status"] == "shipped":
        return {
            "success": False,
            "error": f"Order {oid} has already been shipped and cannot be cancelled. Customer must wait for delivery and initiate a return.",
        }
    elif order["status"] == "delivered":
        return {
            "success": False,
            "error": f"Order {oid} has been delivered. Cancellation is not possible. Please use the return/refund process instead.",
        }
    else:
        return {
            "success": False,
            "error": f"Order {oid} is in '{order['status']}' status and cannot be cancelled.",
        }


async def send_reply(ticket_id: str, message: str) -> dict:
    """Send a reply message to the customer for a given ticket."""
    await asyncio.sleep(0.05)
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
    valid_priorities = ("low", "medium", "high", "critical", "urgent")
    if priority not in valid_priorities:
        priority = "medium"

    team_map = {
        "low": "General Support",
        "medium": "Tier-2 Support",
        "high": "Senior Support",
        "critical": "Escalation Team",
        "urgent": "Escalation Team",
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


# ─── Tool registry ───────────────────────────────────────────────────────────

TOOL_REGISTRY: dict[str, callable] = {
    "get_customer": get_customer,
    "get_order": get_order,
    "get_orders_by_email": get_orders_by_email,
    "get_product": get_product,
    "search_knowledge_base": search_knowledge_base,
    "check_refund_eligibility": check_refund_eligibility,
    "issue_refund": issue_refund,
    "cancel_order": cancel_order,
    "send_reply": send_reply,
    "escalate": escalate,
}
