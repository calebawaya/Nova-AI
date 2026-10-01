import os
import re
import sqlite3
import time
from collections import defaultdict, deque

from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_NAME = "nova.db"
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")
client = OpenAI() if os.getenv("OPENAI_API_KEY") else None

SESSION_PATTERN = re.compile(r"^[A-Za-z0-9_-]{10,100}$")
MAX_MESSAGE_LENGTH = 4000
RATE_LIMIT_COUNT = 30
RATE_LIMIT_WINDOW = 60
request_log = defaultdict(deque)


def init_db():
    with sqlite3.connect(DB_NAME) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS session_memory (
                session_id TEXT PRIMARY KEY,
                summary TEXT NOT NULL DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS project_sessions (
                project_id TEXT NOT NULL,
                session_id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON project_sessions(project_id)")
        db.commit()


def get_session_memory(session_id):
    with sqlite3.connect(DB_NAME) as db:
        row = db.execute(
            "SELECT summary FROM session_memory WHERE session_id = ?",
            (session_id,)
        ).fetchone()
    return row[0] if row else ""


def save_session_memory(session_id, summary):
    with sqlite3.connect(DB_NAME) as db:
        db.execute(
            """
            INSERT INTO session_memory (session_id, summary, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(session_id) DO UPDATE SET
                summary = excluded.summary,
                updated_at = CURRENT_TIMESTAMP
            """,
            (session_id, summary)
        )
        db.commit()


def update_session_memory(session_id):
    if not client:
        return

    history = get_history(session_id)
    if len(history) < 4:
        return

    recent = history[-12:]
    previous = get_session_memory(session_id)

    try:
        response = client.responses.create(
            model=OPENAI_MODEL,
            instructions=(
                "Create concise conversation memory for Nova AI. Keep only useful "
                "project context, goals, preferences, and decisions. Do not include "
                "sensitive personal information. Return plain text under 700 characters."
            ),
            input=[{
                "role": "user",
                "content": f"Previous memory:\n{previous or '(none)'}\n\nRecent conversation:\n{recent}"
            }]
        )
        summary = response.output_text.strip()[:700]
        if summary:
            save_session_memory(session_id, summary)
    except Exception:
        app.logger.exception("Session memory update failed")


def save_message(session_id, role, message):
    with sqlite3.connect(DB_NAME) as db:
        db.execute(
            "INSERT INTO messages (session_id, role, message) VALUES (?, ?, ?)",
            (session_id, role, message)
        )
        db.commit()


def get_history(session_id):
    with sqlite3.connect(DB_NAME) as db:
        rows = db.execute(
            "SELECT role, message, created_at FROM messages "
            "WHERE session_id = ? ORDER BY id DESC LIMIT 30",
            (session_id,)
        ).fetchall()

    return [
        {"role": row[0], "message": row[1], "created_at": row[2]}
        for row in reversed(rows)
    ]


def delete_history(session_id):
    with sqlite3.connect(DB_NAME) as db:
        db.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        db.execute("DELETE FROM session_memory WHERE session_id = ?", (session_id,))
        db.commit()


def get_project(project_id):
    with sqlite3.connect(DB_NAME) as db:
        row = db.execute(
            "SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?",
            (project_id,)
        ).fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "description": row[2], "created_at": row[3], "updated_at": row[4]}


def get_projects():
    with sqlite3.connect(DB_NAME) as db:
        rows = db.execute(
            "SELECT id, name, description, created_at, updated_at FROM projects "
            "ORDER BY updated_at DESC, id DESC"
        ).fetchall()
    return [{"id": r[0], "name": r[1], "description": r[2], "created_at": r[3], "updated_at": r[4]} for r in rows]


def save_project(project_id, name, description):
    with sqlite3.connect(DB_NAME) as db:
        db.execute(
            """
            INSERT INTO projects (id, name, description, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                updated_at = CURRENT_TIMESTAMP
            """,
            (project_id, name, description)
        )
        db.commit()


def delete_project(project_id):
    with sqlite3.connect(DB_NAME) as db:
        db.execute("DELETE FROM project_sessions WHERE project_id = ?", (project_id,))
        db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        db.commit()


def attach_session_to_project(project_id, session_id):
    with sqlite3.connect(DB_NAME) as db:
        db.execute(
            """
            INSERT INTO project_sessions (project_id, session_id)
            VALUES (?, ?)
            ON CONFLICT(session_id) DO UPDATE SET project_id = excluded.project_id
            """,
            (project_id, session_id)
        )
        db.execute("UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (project_id,))
        db.commit()


def get_project_for_session(session_id):
    with sqlite3.connect(DB_NAME) as db:
        row = db.execute("SELECT project_id FROM project_sessions WHERE session_id = ?", (session_id,)).fetchone()
    return get_project(row[0]) if row else None


def fallback_response(message):
    q = message.lower().strip()

    if not q:
        return "Please type a message and I'll try to help. ✦"
    if any(word in q for word in ["hello", "hi", "hey"]):
        return "Hey! 👋 I'm Nova AI. How can I help you?"
    if "your name" in q or "who are you" in q:
        return "I'm Nova AI — your personal AI assistant. ✦"
    if "html" in q:
        return "HTML creates the structure of a website. 🌐"
    if "css" in q:
        return "CSS controls the design, layout, colors and animations of websites. 🎨"
    if "javascript" in q or re.search(r"\bjs\b", q):
        return "JavaScript makes websites interactive and powerful. ⚡"
    if "python" in q:
        return "Python powers my backend, while SQLite stores conversation history. 🐍"
    if "sql" in q or "database" in q:
        return "SQL lets Nova AI store and retrieve conversation data. 🗄️"
    if "business" in q:
        return "A good business starts by solving a real problem for people. 💡"
    if "help" in q:
        return "I can help with programming, websites, Python, SQL, business ideas and Nova AI. 🚀"

    return "I'm still learning. Try asking me about programming, websites, Python, SQL, business, or myself."


def ai_response(message, session_id, response_style="balanced", memory_enabled=True, project_id=None):
    if not client:
        return fallback_response(message)

    history = get_history(session_id)
    memory = get_session_memory(session_id) if memory_enabled else ""
    project = get_project(project_id) if project_id else get_project_for_session(session_id)

    style_instruction = {
        "concise": "Keep answers concise and focused.",
        "detailed": "Give detailed explanations with useful examples.",
        "balanced": "Use a balanced level of detail."
    }.get(response_style, "Use a balanced level of detail.")

    input_items = []
    if project:
        input_items.append({
            "role": "developer",
            "content": (
                f"Active Nova project: {project['name']}\n"
                f"Project description: {project['description'] or '(no description yet)'}\n"
                "Treat this as ongoing project context and keep suggestions consistent with it."
            )
        })
    if memory:
        input_items.append({
            "role": "developer",
            "content": f"Session memory:\n{memory}"
        })

    input_items.extend(
        {"role": item["role"], "content": item["message"]}
        for item in history[-20:]
    )

    response = client.responses.create(
        model=OPENAI_MODEL,
        instructions=(
            "You are Nova AI, a friendly and helpful assistant. "
            "Give clear, age-appropriate answers. "
            "When explaining programming, use beginner-friendly steps and examples. "
            "Use session memory when relevant, but never invent facts. "
            f"{style_instruction}"
        ),
        input=input_items
    )
    return response.output_text


def valid_session_id(session_id):
    return bool(SESSION_PATTERN.fullmatch(session_id))


def rate_limit_ok(ip_address):
    now = time.monotonic()
    timestamps = request_log[ip_address]

    while timestamps and now - timestamps[0] > RATE_LIMIT_WINDOW:
        timestamps.popleft()

    if len(timestamps) >= RATE_LIMIT_COUNT:
        return False

    timestamps.append(now)
    return True


@app.get("/api/health")
def health():
    return jsonify({
        "status": "online",
        "name": "Nova AI",
        "ai_enabled": client is not None,
        "memory_enabled": client is not None
    })


@app.post("/api/chat")
def chat():
    if not rate_limit_ok(request.remote_addr or "unknown"):
        return jsonify({"error": "Too many requests. Please wait a moment."}), 429

    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    session_id = str(data.get("session_id", "")).strip()
    project_id = str(data.get("project_id", "")).strip() or None
    response_style = str(data.get("response_style", "balanced")).strip().lower()
    memory_enabled = data.get("memory_enabled", True) is not False

    if response_style not in {"balanced", "concise", "detailed"}:
        response_style = "balanced"

    if not message:
        return jsonify({"error": "Message is required."}), 400

    if len(message) > MAX_MESSAGE_LENGTH:
        return jsonify({
            "error": f"Message is too long. Maximum length is {MAX_MESSAGE_LENGTH} characters."
        }), 400

    if not valid_session_id(session_id):
        return jsonify({"error": "Invalid session ID."}), 400

    if project_id and not valid_session_id(project_id):
        return jsonify({"error": "Invalid project ID."}), 400
    if project_id:
        if not get_project(project_id):
            return jsonify({"error": "Project not found."}), 404
        attach_session_to_project(project_id, session_id)

    save_message(session_id, "user", message)

    try:
        reply = ai_response(message, session_id, response_style, memory_enabled, project_id)
    except Exception as error:
        app.logger.exception("AI request failed")
        reply = fallback_response(message)

    save_message(session_id, "assistant", reply)
    if memory_enabled:
        update_session_memory(session_id)

    return jsonify({
        "reply": reply,
        "history_count": len(get_history(session_id)),
        "ai_enabled": client is not None
    })


@app.get("/api/projects")
def projects():
    return jsonify({"projects": get_projects()})


@app.post("/api/projects")
def create_project():
    data = request.get_json(silent=True) or {}
    project_id = str(data.get("id", "")).strip()
    name = str(data.get("name", "")).strip()
    description = str(data.get("description", "")).strip()
    if not valid_session_id(project_id):
        return jsonify({"error": "Invalid project ID."}), 400
    if not name:
        return jsonify({"error": "Project name is required."}), 400
    if len(name) > 50 or len(description) > 500:
        return jsonify({"error": "Project name or description is too long."}), 400
    save_project(project_id, name, description)
    return jsonify({"project": get_project(project_id)}), 201


@app.get("/api/projects/<project_id>")
def project(project_id):
    if not valid_session_id(project_id):
        return jsonify({"error": "Invalid project ID."}), 400
    item = get_project(project_id)
    if not item:
        return jsonify({"error": "Project not found."}), 404
    return jsonify({"project": item})


@app.put("/api/projects/<project_id>")
def update_project(project_id):
    if not valid_session_id(project_id):
        return jsonify({"error": "Invalid project ID."}), 400
    if not get_project(project_id):
        return jsonify({"error": "Project not found."}), 404
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    description = str(data.get("description", "")).strip()
    if not name:
        return jsonify({"error": "Project name is required."}), 400
    if len(name) > 50 or len(description) > 500:
        return jsonify({"error": "Project name or description is too long."}), 400
    save_project(project_id, name, description)
    return jsonify({"project": get_project(project_id)})


@app.delete("/api/projects/<project_id>")
def remove_project(project_id):
    if not valid_session_id(project_id):
        return jsonify({"error": "Invalid project ID."}), 400
    if not get_project(project_id):
        return jsonify({"error": "Project not found."}), 404
    delete_project(project_id)
    return jsonify({"success": True})


@app.get("/api/history/<session_id>")
def history(session_id):
    if not valid_session_id(session_id):
        return jsonify({"error": "Invalid session ID."}), 400

    messages = get_history(session_id)
    first_user_message = next(
        (item["message"] for item in messages if item["role"] == "user"),
        ""
    )
    title = first_user_message.strip()
    if len(title) > 36:
        title = title[:36].rstrip() + "…"

    return jsonify({
        "title": title or "New conversation",
        "messages": messages
    })


@app.delete("/api/history/<session_id>")
def clear_history(session_id):
    if not valid_session_id(session_id):
        return jsonify({"error": "Invalid session ID."}), 400

    delete_history(session_id)
    return jsonify({"success": True})


init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
