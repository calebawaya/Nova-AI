from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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
        return "Python is a beginner-friendly programming language that we can use to build Nova AI's backend. 🐍"

    if "business" in q:
        return "A good business starts by solving a real problem for people. 💡"

    if "help" in q:
        return "I can help with HTML, CSS, JavaScript, Python, business ideas and programming. 🚀"

    return "Interesting! 🤔 I'm still learning. Ask me about programming, websites, Python, business, or myself."

@app.get("/api/health")
def health():
    return jsonify({"status": "online", "name": "Nova AI"})

@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")
    return jsonify({"reply": nova_response(message)})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
