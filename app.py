import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_NAME = "nova.db"

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
        db.commit()

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
            "SELECT role, message, created_at FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 30",
            (session_id,)
        ).fetchall()
    return [{"role": r[0], "message": r[1], "created_at": r[2]} for r in reversed(rows)]

def nova_response(message):
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
    if "javascript" in q or q == "js":
        return "JavaScript makes websites interactive and powerful. ⚡"
    if "python" in q:
        return "Python powers my backend, while SQLite stores our conversation history. 🐍"
    if "sql" in q or "database" in q:
        return "SQL lets Nova AI store and retrieve conversation data from its database. 🗄️"
    if "business" in q:
        return "A good business starts by solving a real problem for people. 💡"
    if "help" in q:
        return "I can help with HTML, CSS, JavaScript, Python, SQL, business ideas and programming. 🚀"
    return "Interesting! 🤔 I'm still learning. Ask me about programming, websites, Python, SQL, business, or myself."

@app.get("/api/health")
def health():
    return jsonify({"status": "online", "name": "Nova AI"})

@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    session_id = str(data.get("session_id", "default")).strip() or "default"

    save_message(session_id, "user", message)
    reply = nova_response(message)
    save_message(session_id, "assistant", reply)

    return jsonify({
        "reply": reply,
        "history_count": len(get_history(session_id))
    })

@app.get("/api/history/<session_id>")
def history(session_id):
    return jsonify({"messages": get_history(session_id)})

init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
