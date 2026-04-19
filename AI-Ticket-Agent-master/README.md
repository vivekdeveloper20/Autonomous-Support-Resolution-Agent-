# 🤖 AI Ticket Agent — Autonomous IT Support System

> A production-grade, multi-agent IT support system powered by **Google ADK (Gemini)** with an autonomous **ReAct agent**, a **FastAPI backend**, and a modern **React + Tailwind dashboard**. The system can analyze problems, search a knowledge base, issue refunds, reply to customers, and escalate to human teams — all without manual intervention.

---

## 📌 Table of Contents

1. [What This Project Does](#-what-this-project-does)
2. [System Architecture](#-system-architecture)
3. [Complete Project Flow Chart](#-complete-project-flow-chart)
4. [How the ReAct Agent Works](#-how-the-react-agent-works)
5. [Project Structure](#-project-structure)
6. [Prerequisites](#-prerequisites)
7. [Step-by-Step Setup](#-step-by-step-setup)
   - [Step 1 — Clone the Repository](#step-1--clone-the-repository)
   - [Step 2 — Set Up the Original ADK System](#step-2--set-up-the-original-adk-system)
   - [Step 3 — Set Up the Upgraded Backend](#step-3--set-up-the-upgraded-backend)
   - [Step 4 — Set Up the React Dashboard](#step-4--set-up-the-react-dashboard)
   - [Step 5 — Seed Demo Data (Optional)](#step-5--seed-demo-data-optional)
   - [Step 6 — Run Everything](#step-6--run-everything)
8. [Environment Variables](#-environment-variables)
9. [API Reference](#-api-reference)
10. [Dashboard Pages](#-dashboard-pages)
11. [Agent Tools](#-agent-tools)
12. [Team Routing](#-team-routing)
13. [Ticket Lifecycle](#-ticket-lifecycle)
14. [Notifications](#-notifications)
15. [Troubleshooting](#-troubleshooting)
16. [Contributing](#-contributing)
17. [License](#-license)

---

## 🎯 What This Project Does

When a customer submits a support ticket, the system:

1. **Understands the problem** using Gemini LLM
2. **Looks up the customer and their order** from the database
3. **Searches the knowledge base** for relevant solutions
4. **Takes autonomous action** — issues a refund, sends a reply, or escalates to a human team
5. **Logs every reasoning step and tool call** to an audit log
6. **Displays everything** in a real-time React dashboard

No human needs to touch a ticket unless the agent decides escalation is truly necessary.

---

## 🏗️ System Architecture

The project has two layers that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1 — ADK System                     │
│  (Original Google ADK multi-agent system with Slack + Email)│
│                                                             │
│   Root Agent ──► Self-Service Agent                         │
│              └──► Escalation Agent ──► Slack Channels       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 LAYER 2 — Upgraded System                   │
│  (FastAPI + ReAct Agent + React Dashboard)                  │
│                                                             │
│   React UI ──► FastAPI ──► ReAct Agent Loop                 │
│                        └──► SQLite DB                       │
│                        └──► Audit Log (JSON)                │
└─────────────────────────────────────────────────────────────┘
```

### Agent Roles

| Agent | Role | What It Does |
|-------|------|--------------|
| 🎯 **Root Agent** | Orchestrator | Collects user email, analyzes the problem, decides which sub-agent to call |
| 🛠️ **Self-Service Agent** | Resolver | Searches KB, provides step-by-step solutions, sends email, tracks attempts |
| ⚠️ **Escalation Agent** | Escalator | Routes to the right human team via Slack with priority and SLA info |
| 🤖 **ReAct Agent** | Autonomous AI | Runs a Think → Act → Observe loop, calls tools, resolves tickets end-to-end |

---

## 🗺️ Complete Project Flow Chart

This diagram shows the **end-to-end flow** of a ticket — from the moment a user submits it to the final resolution or escalation.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        USER SUBMITS A SUPPORT TICKET                        ║
║              (via React Dashboard  /  POST /run-agent API)                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │   FastAPI Backend        │
                        │   Creates ticket in DB   │
                        │   Status: PENDING        │
                        └────────────┬────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   Background Task        │
                        │   Status: IN_PROGRESS    │
                        │   ReAct Agent starts     │
                        └────────────┬────────────┘
                                     │
                                     ▼
╔══════════════════════════════════════════════════════════════════════════════╗
║                         ReAct AGENT LOOP BEGINS                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                     │
              ┌──────────────────────▼──────────────────────┐
              │                  THINK                       │
              │   Gemini LLM reads the ticket description    │
              │   and decides what information it needs      │
              │   (or uses fallback reasoning if no API key) │
              └──────────────────────┬──────────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │                   ACT                        │
              │   Calls one of 8 available tools:            │
              │                                              │
              │   • get_customer(email)                      │
              │   • get_order(order_id)                      │
              │   • get_product(product_id)                  │
              │   • search_knowledge_base(query)             │
              │   • check_refund_eligibility(order_id)       │
              │   • issue_refund(order_id, amount)           │
              │   • send_reply(ticket_id, message)           │
              │   • escalate(ticket_id, summary, priority)   │
              └──────────────────────┬──────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Tool succeeds?     │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │ NO (transient error)             │ YES
                    ▼                                  ▼
         ┌──────────────────────┐       ┌─────────────────────────┐
         │  RETRY (up to 3×)    │       │       OBSERVE            │
         │  Exponential backoff │       │  Agent reads the result  │
         │  0.5s → 1s → 1.5s   │       │  and feeds it back to    │
         │  Status: "retried"   │       │  the LLM as context      │
         └──────────┬───────────┘       └────────────┬────────────┘
                    │                                 │
                    └──────────────┬──────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │  Min 3 tool calls    │
                        │  completed?          │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ NO                           │ YES
                    ▼                              ▼
         ┌──────────────────────┐    ┌─────────────────────────┐
         │  Loop back to THINK  │    │  LLM produces           │
         │  (next iteration)    │    │  FINAL ANSWER           │
         └──────────────────────┘    │  with confidence score  │
                                     └────────────┬────────────┘
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          │                       │                       │
                          ▼                       ▼                       ▼
              ┌───────────────────┐  ┌────────────────────┐  ┌───────────────────┐
              │   REFUND issued   │  │   REPLY sent to    │  │   ESCALATED to    │
              │                   │  │   customer         │  │   human team      │
              │ issue_refund()    │  │                    │  │                   │
              │ send_reply()      │  │ send_reply()       │  │ escalate()        │
              └────────┬──────────┘  └─────────┬──────────┘  └────────┬──────────┘
                       │                       │                       │
                       ▼                       ▼                       ▼
              Status: RESOLVED        Status: RESOLVED        Status: ESCALATED
                                                                       │
                                                                       ▼
                                                          ┌────────────────────────┐
                                                          │  ADK Escalation Agent  │
                                                          │  determines team &     │
                                                          │  priority              │
                                                          └────────────┬───────────┘
                                                                       │
                                                          ┌────────────▼───────────┐
                                                          │  Slack notification    │
                                                          │  sent to team channel  │
                                                          │  + Email to customer   │
                                                          └────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║                         AFTER EVERY RUN                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐   ║
║  │  SQLite Database │    │  audit_log.json  │    │  React Dashboard     │   ║
║  │                  │    │                  │    │                      │   ║
║  │ • Ticket record  │    │ • Reasoning text │    │ • Status badge       │   ║
║  │ • ReasoningSteps │    │ • Tool call list │    │ • Thought bubbles    │   ║
║  │ • ToolCall rows  │    │ • Errors         │    │ • Tool call viewer   │   ║
║  │ • Final action   │    │ • Confidence     │    │ • Confidence bar     │   ║
║  │ • Confidence     │    │ • Final decision │    │ • Live log panel     │   ║
║  └──────────────────┘    └──────────────────┘    └──────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Flow Summary in Plain Words

| Step | What Happens |
|------|-------------|
| 1 | User submits ticket via dashboard or API |
| 2 | FastAPI creates a DB record (status: `pending`) |
| 3 | Background task starts the ReAct agent (status: `in_progress`) |
| 4 | Agent **thinks** — LLM decides what tool to call |
| 5 | Agent **acts** — tool is called with real arguments |
| 6 | If tool fails → **retry** up to 3 times with backoff |
| 7 | Agent **observes** — result is fed back to the LLM |
| 8 | Steps 4–7 repeat until at least 3 tool calls are done |
| 9 | LLM produces a final answer with a confidence score |
| 10 | Ticket is marked `resolved`, `escalated`, or `failed` |
| 11 | Everything is saved to DB + `audit_log.json` |
| 12 | Dashboard shows reasoning steps, tool calls, and outcome in real time |

---

## 🧠 How the ReAct Agent Works

The ReAct (Reason + Act) agent is the core of the upgraded system. It works like a human support agent thinking through a problem step by step.

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  THINK   │────►│   ACT    │────►│   OBSERVE    │────►│   REPEAT     │
│          │     │          │     │              │     │  (or finish) │
│ LLM reads│     │ Calls a  │     │ Reads tool   │     │              │
│ the ticket     │ tool with│     │ result, feeds│     │ Min 3 cycles │
│ and decides    │ real args│     │ back to LLM  │     │ before done  │
└──────────┘     └──────────┘     └──────────────┘     └──────────────┘
```

**Example flow for a refund request:**

```
Think  → "Customer wants a refund. Let me look up their profile first."
Act    → get_customer(email="alice@example.com")
Observe→ { name: "Alice Johnson", tier: "premium", ... }

Think  → "Now I need to check the order details."
Act    → get_order(order_id="ORD-001")
Observe→ { status: "delivered", amount: 149.99, ... }

Think  → "Order is delivered. Let me check if it's eligible for a refund."
Act    → check_refund_eligibility(order_id="ORD-001")
Observe→ { eligible: true, amount: 149.99 }

Think  → "Eligible. Issuing the refund now."
Act    → issue_refund(order_id="ORD-001", amount=149.99)
Observe→ { success: true, refund_id: "REF-ORD-001-143022" }

Think  → "Refund done. Sending confirmation to customer."
Act    → send_reply(ticket_id="TKT-...", message="Your refund of $149.99 has been processed...")

Final Answer → action: "refund", confidence: 0.95
```

**Key guarantees:**
- Minimum **3 tool calls** per ticket before concluding
- Up to **3 retry attempts** with exponential backoff on transient failures (e.g. the refund service has a simulated 20% failure rate to test this)
- Every step is saved to the database and the audit log

---

## 📁 Project Structure

```
AI-Ticket-Agent/
│
├── 📂 ai_ticket_agent/               ← Original ADK multi-agent system
│   ├── agent.py                      # Root agent (Gemini-powered orchestrator)
│   ├── prompt.py                     # All LLM instruction prompts
│   ├── models.py                     # SQLAlchemy DB models
│   ├── database.py                   # DB connection & session management
│   ├── 📂 tools/
│   │   ├── email_collector.py        # Extracts/requests user email
│   │   ├── problem_analyzer.py       # Provides problem analysis context
│   │   ├── knowledge_base.py         # Searches mock IT knowledge base
│   │   ├── resolution_tracker.py     # Tracks resolution attempts & feedback
│   │   ├── ticket_manager.py         # CRUD operations on tickets
│   │   ├── team_router.py            # Team expertise mapping
│   │   ├── slack_handlers.py         # Sends rich Slack messages
│   │   ├── email_sender.py           # Sends HTML emails
│   │   └── notification_sender.py    # Generic notification handler
│   └── 📂 sub_agents/
│       ├── self_service/agent.py     # Self-service resolution agent
│       └── escalation/agent.py       # Human escalation agent
│
├── 📂 backend/                       ← Upgraded FastAPI + ReAct system
│   ├── main.py                       # FastAPI app with all 5 endpoints
│   ├── react_agent.py                # ReAct loop engine (Think→Act→Observe)
│   ├── tools.py                      # 8 autonomous tools with mock data
│   ├── audit_logger.py               # Writes to logs/audit_log.json
│   ├── models.py                     # Ticket, ReasoningStep, ToolCall models
│   ├── database.py                   # SQLite/Postgres session management
│   ├── seed_demo.py                  # Seeds 3 demo tickets with agent runs
│   ├── .env.example                  # Environment variable template
│   └── requirements.txt              # Python dependencies
│
├── 📂 frontend/                      ← React + Tailwind dark-mode dashboard
│   └── 📂 src/
│       ├── api.js                    # Axios API client
│       ├── App.jsx                   # Router setup
│       ├── 📂 pages/
│       │   ├── DashboardPage.jsx     # Stats overview + recent tickets
│       │   ├── TicketsPage.jsx       # Full ticket list + new ticket modal
│       │   ├── TicketDetailPage.jsx  # Reasoning steps + tool calls viewer
│       │   └── LogsPage.jsx          # Live terminal-style audit log
│       └── 📂 components/
│           ├── Layout.jsx            # Sidebar navigation shell
│           ├── TicketCard.jsx        # Ticket summary card with confidence bar
│           ├── ReasoningView.jsx     # Step-by-step thought bubbles
│           ├── ToolCallView.jsx      # Expandable tool call rows
│           ├── LogPanel.jsx          # Terminal-style log panel
│           ├── StatusBadge.jsx       # Colored status pill
│           └── StatCard.jsx          # Metric card with gradient
│
├── dashboard.py                      # Original Streamlit dashboard
├── init_database.py                  # DB init script
├── run.py                            # CLI runner for ADK system
└── README.md                         # This file
```

---

## ✅ Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend and ADK system |
| Node.js | 18+ | React frontend |
| npm | 9+ | Frontend package manager |
| Git | any | Clone the repo |
| Poetry | latest | ADK system dependency manager |

Optional (for full features):
- **Google Cloud account** — for Gemini API (the backend has a fallback if not set)
- **Slack workspace** — for team escalation notifications
- **Gmail account** — for email notifications

---

## 🚀 Step-by-Step Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/omkar-79/AI-Ticket-Agent.git
cd AI-Ticket-Agent
```

---

### Step 2 — Set Up the Original ADK System

This is the original Google ADK-based multi-agent system with Slack and email support.

**2a. Install Python dependencies using Poetry:**

```bash
cd AI-Ticket-Agent-master
poetry install
```

> If you don't have Poetry: `pip install poetry` then run the above.

**2b. Create your environment file:**

```bash
cp env.example .env
```

**2c. Open `.env` and fill in your credentials:**

```env
# ── Google Cloud (required for Gemini LLM) ──────────────────────────────────
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account.json
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# ── Slack (required for team escalation notifications) ───────────────────────
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C1234567890

# ── Email / SMTP (optional — for sending solution emails to users) ────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

> **How to get a Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords → generate one for "Mail".

**2d. Set up Slack** (skip if you don't need Slack notifications):

- Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App
- Add OAuth scope: `chat:write`
- Install app to your workspace
- Create channels: `#it-software-support`, `#it-network-support`, `#it-security-support`, etc.
- Invite the bot to each channel: `/invite @your-bot-name`
- Copy the Bot Token into your `.env`

See `SLACK_SETUP.md` for the full detailed guide.

**2e. Initialize the database:**

```bash
python run.py init-db
```

This creates a `tickets.db` SQLite file with all required tables.

**2f. Verify everything is configured correctly:**

```bash
python run.py status
```

You should see green checkmarks for all configured items.

---

### Step 3 — Set Up the Upgraded Backend

This is the new FastAPI backend with the autonomous ReAct agent.

**3a. Navigate to the backend folder:**

```bash
cd backend
```

**3b. Create a virtual environment (recommended):**

```bash
# Create the environment
python -m venv .venv

# Activate it
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate
```

**3c. Install dependencies:**

```bash
pip install -r requirements.txt
```

**3d. Create your environment file:**

```bash
cp .env.example .env
```

**3e. Open `backend/.env` and configure:**

```env
# Gemini API key — get it from https://aistudio.google.com/app/apikey
# This is OPTIONAL. If not set, the agent uses built-in fallback reasoning.
GOOGLE_API_KEY=your_gemini_api_key_here

# Database — SQLite by default, change to PostgreSQL for production
DATABASE_URL=sqlite:///./support_agent.db
```

**3f. Start the backend server:**

```bash
python main.py
```

You should see:
```
INFO:     Database initialised
INFO:     Uvicorn running on http://0.0.0.0:8000
```

- API is live at: **http://localhost:8000**
- Interactive API docs (Swagger): **http://localhost:8000/docs**

---

### Step 4 — Set Up the React Dashboard

**4a. Open a new terminal and navigate to the frontend folder:**

```bash
cd frontend
```

**4b. Install Node.js dependencies:**

```bash
npm install
```

**4c. Start the development server:**

```bash
npm run dev
```

You should see:
```
  VITE v8.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. The dashboard will connect to the backend automatically via the proxy configured in `vite.config.js`.

---

### Step 5 — Seed Demo Data (Optional)

If you want to see the dashboard populated with real example tickets right away, run the seeder. It creates 3 demo tickets and runs the ReAct agent on each one.

```bash
# Make sure you're in the backend folder with the venv active
cd backend
python seed_demo.py
```

Output will look like:
```
Created TKT-20260419-A1B2C3 — running agent…
  ✓ TKT-20260419-A1B2C3 → resolved (confidence 92%)
Created TKT-20260419-D4E5F6 — running agent…
  ✓ TKT-20260419-D4E5F6 → resolved (confidence 78%)
Created TKT-20260419-G7H8I9 — running agent…
  ✓ TKT-20260419-G7H8I9 → escalated (confidence 65%)

Demo data seeded successfully.
```

---

### Step 6 — Run Everything

Here's a summary of all the commands to have the full system running:

**Terminal 1 — Backend API:**
```bash
cd backend
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Mac/Linux
python main.py
```

**Terminal 2 — React Dashboard:**
```bash
cd frontend
npm run dev
```

**Terminal 3 — Original ADK System (optional):**
```bash
cd AI-Ticket-Agent-master
python run.py web           # ADK web UI at http://localhost:8080
# or
python run.py cli           # Interactive CLI
# or
python run.py dashboard     # Streamlit dashboard at http://localhost:8501
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | No | — | Gemini API key. If absent, fallback reasoning is used |
| `DATABASE_URL` | No | `sqlite:///./support_agent.db` | Database connection string |

### ADK System (`AI-Ticket-Agent-master/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | Path to GCP service account JSON |
| `GOOGLE_CLOUD_PROJECT` | Yes | Your GCP project ID |
| `GOOGLE_CLOUD_LOCATION` | Yes | GCP region (e.g. `us-central1`) |
| `SLACK_BOT_TOKEN` | No | Slack bot token for team notifications |
| `SLACK_CHANNEL_ID` | No | Default Slack channel ID |
| `SMTP_HOST` | No | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | No | SMTP port (e.g. `587`) |
| `SMTP_USERNAME` | No | Email address to send from |
| `SMTP_PASSWORD` | No | Email app password |

---

## 🌐 API Reference

Base URL: `http://localhost:8000`

### `GET /tickets`

Returns a list of all tickets, newest first.

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by: `pending`, `in_progress`, `resolved`, `escalated`, `failed` |
| `priority` | string | Filter by: `low`, `medium`, `high`, `critical` |
| `limit` | int | Max results (default: 50) |

**Example:**
```bash
curl "http://localhost:8000/tickets?status=resolved&limit=10"
```

---

### `GET /tickets/{ticket_id}`

Returns full detail for one ticket including all reasoning steps and tool calls.

**Example:**
```bash
curl "http://localhost:8000/tickets/TKT-20260419-A1B2C3"
```

**Response includes:**
- Ticket info (status, priority, category, etc.)
- `reasoning_steps` — every thought the agent had, in order
- `tool_calls` — every tool called, with arguments, result, status, and retry count
- `confidence_score` — agent's self-reported confidence (0.0 to 1.0)
- `final_action` — what the agent decided: `refund`, `reply`, `escalate`, or `resolved`

---

### `POST /run-agent`

Creates a new ticket and immediately starts the ReAct agent in the background. Returns `202 Accepted` instantly — poll `GET /tickets/{id}` to watch progress.

**Request body:**
```json
{
  "subject": "Refund for damaged headphones",
  "description": "I received my order ORD-001 and the product is cracked. I want a full refund.",
  "user_email": "alice@example.com",
  "order_id": "ORD-001",
  "priority": "high",
  "category": "billing"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `subject` | Yes | Short summary of the issue |
| `description` | Yes | Full problem description |
| `user_email` | Yes | Customer's email address |
| `order_id` | No | Related order ID (e.g. `ORD-001`) |
| `priority` | No | `low` / `medium` / `high` / `critical` (default: `medium`) |
| `category` | No | `software` / `hardware` / `network` / `security` / `access` / `billing` / `general` |

**Response:**
```json
{
  "ticket_id": "TKT-20260419-A1B2C3",
  "status": "pending",
  "message": "Ticket created. Agent is processing in background."
}
```

---

### `GET /logs`

Returns audit log entries from `logs/audit_log.json`.

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Max entries to return (default: 100) |

---

### `GET /stats`

Returns summary counts for the dashboard.

**Response:**
```json
{
  "total": 12,
  "resolved": 8,
  "escalated": 2,
  "failed": 1,
  "pending": 0,
  "in_progress": 1,
  "resolution_rate": 66.7
}
```

---

## 📊 Dashboard Pages

### Dashboard Page (`/`)
The home screen. Shows:
- 4 stat cards: Total, Resolved, Escalated, Failed
- Resolution rate progress bar
- Grid of the 6 most recent tickets
- Refresh button to reload live data

### Tickets Page (`/tickets`)
Full ticket management. Shows:
- Search bar (searches by subject, ticket ID, or email)
- Status and priority filter dropdowns
- Card grid of all matching tickets
- "New Ticket" button that opens a modal form to submit a ticket and trigger the agent

### Ticket Detail Page (`/tickets/:id`)
Deep-dive into a single ticket. Shows:
- Ticket metadata (subject, email, priority, category, timestamps)
- Final action badge (Refund / Reply / Escalate / Resolved) with color coding
- Confidence score with animated progress bar
- **Reasoning Steps** — numbered thought bubbles showing exactly what the agent was thinking at each step
- **Tool Calls** — expandable rows for each tool call showing the arguments sent and the result received, plus retry count if applicable
- Auto-polls every 3 seconds while the agent is still running

### Logs Page (`/logs`)
Live audit log viewer. Shows:
- Terminal-style panel with color-coded log entries
- Each entry shows: timestamp, status, ticket ID, subject, confidence score
- Live mode (auto-refreshes every 4 seconds) with pause/resume toggle
- Raw JSON viewer for the latest log entry

---

## 🔧 Agent Tools

The ReAct agent has access to 8 tools:

| Tool | Arguments | What It Does |
|------|-----------|--------------|
| `get_customer` | `email` | Looks up customer profile (name, tier, account age, order count) |
| `get_order` | `order_id` | Fetches order details (product, amount, status, delivery date) |
| `get_product` | `product_id` | Gets product info (name, price, return window, warranty) |
| `search_knowledge_base` | `query` | Searches KB articles by relevance score |
| `check_refund_eligibility` | `order_id` | Checks if order is within return window. Has **20% random failure rate** to simulate real-world transient errors and test retry logic |
| `issue_refund` | `order_id`, `amount` | Processes the refund and returns a reference ID |
| `send_reply` | `ticket_id`, `message` | Sends a reply message to the customer |
| `escalate` | `ticket_id`, `summary`, `priority` | Escalates to the appropriate human team |

**Retry behavior:** If a tool throws an exception (like `check_refund_eligibility` does ~20% of the time), the agent automatically retries up to 3 times with exponential backoff (0.5s, 1s, 1.5s). The retry count is visible in the dashboard's tool call view.

---

## 📋 Team Routing

The Escalation Agent routes tickets to the correct team based on the problem type:

| Team | Slack Channel | Types of Issues Handled |
|------|--------------|------------------------|
| **Software Team** | `#it-software-support` | App bugs, CRM/ERP errors, software conflicts, authentication issues |
| **Security Team** | `#it-security-support` | Security incidents, malware, data breaches, suspicious activity |
| **Hardware Team** | `#it-hardware-support` | Hardware failures, device damage, equipment problems |
| **Network Team** | `#it-network-support` | VPN issues, connectivity problems, firewall configuration |
| **Infrastructure Team** | `#it-infrastructure-support` | Server outages, DNS/DHCP issues, core infrastructure |
| **Access Management** | `#it-access-support` | Account creation, permissions, user provisioning |
| **General IT Support** | `#it-general-support` | Mixed issues, general troubleshooting, non-technical users |

**SLA by priority:**
| Priority | Response Time |
|----------|--------------|
| 🚨 Critical | 1 hour |
| ⚠️ High | 4 hours |
| 📋 Medium | 8 hours |
| ℹ️ Low | 24 hours |

---

## 🔄 Ticket Lifecycle

```
[User submits ticket]
        │
        ▼
   PENDING ──► IN_PROGRESS ──► RESOLVED ✅
                    │
                    ├──► ESCALATED ⚠️  (agent decided human needed)
                    │
                    └──► FAILED ❌     (agent encountered unrecoverable error)
```

Every status change is recorded in the database with a timestamp and the reason for the change. The full history is visible in the Ticket Detail page.

---

## 🔔 Notifications

### Slack Notifications (ADK System)
Rich formatted messages sent to team channels:
- Priority emoji indicator (🚨 ⚠️ 📋 ℹ️)
- Customer name and email
- Problem description
- Assigned team and SLA
- Ticket ID for tracking

### Email Notifications (ADK System)
HTML emails sent to the customer for:
- **Self-service resolution** — includes step-by-step solution instructions
- **Escalation confirmation** — includes team name, priority, and expected response time

---

## 🚨 Troubleshooting

**Problem: `channel_not_found` error in Slack**
- Make sure the Slack channels exist (e.g. `#it-software-support`)
- Invite the bot to each channel with `/invite @your-bot-name`
- Double-check channel names in `ai_ticket_agent/tools/slack_handlers.py`

**Problem: `missing_scope` error in Slack**
- Go to your Slack app settings → OAuth & Permissions
- Add the `chat:write` scope
- Reinstall the app to your workspace

**Problem: Google Cloud authentication fails**
- Make sure `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON file
- The service account needs the `Vertex AI User` role
- Run `gcloud auth application-default login` as an alternative

**Problem: Backend starts but agent does nothing**
- Check that `GOOGLE_API_KEY` is set in `backend/.env`
- If not set, the fallback reasoning will be used (deterministic, no LLM)
- Check `backend/logs/audit_log.json` for error details

**Problem: Frontend shows "Network Error"**
- Make sure the backend is running on port 8000
- The frontend proxies `/api` → `http://localhost:8000` via `vite.config.js`
- Check the browser console for the exact error

**Problem: `poetry install` fails**
- Make sure Python 3.11+ is installed: `python --version`
- Try `pip install poetry` then `poetry install`

---

## 🧪 Testing

```bash
# Run all agent tests (ADK system)
cd AI-Ticket-Agent-master
python run.py test

# Test Slack notifications specifically
python tests/test_slack_notifications.py

# Test ticket lifecycle
python tests/test_ticket_lifecycle.py

# Test the dashboard
python tests/test_dashboard.py
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test them
4. Commit with a clear message: `git commit -m "Add: description of change"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open a Pull Request with a description of what you changed and why

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
