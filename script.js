const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const clearBtn = document.getElementById("clearBtn");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");
const historyBtn = document.getElementById("historyBtn");
const chatBtn = document.getElementById("chatBtn");
const historyList = document.getElementById("historyList");
const historySearch = document.getElementById("historySearch");

function createSessionId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return "nova-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

let sessionId = localStorage.getItem("novaSessionId");

function getSavedSessions() {
  try {
    const sessions = JSON.parse(localStorage.getItem("novaSessions") || "[]");
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
}

function saveSessionList(sessions) {
  localStorage.setItem("novaSessions", JSON.stringify(sessions));
}

function rememberSession(id, title = "New conversation") {
  const sessions = getSavedSessions().filter(item => item.id !== id);
  sessions.unshift({ id, title });
  saveSessionList(sessions.slice(0, 20));
}

if (!sessionId) {
  sessionId = createSessionId();
  localStorage.setItem("novaSessionId", sessionId);
}

rememberSession(sessionId);

// Change this one value when Nova's Python backend is deployed online.
const API_URL = "http://127.0.0.1:5000";

function clearWelcome() {
  document.querySelector(".welcome")?.remove();
}

function addMessage(text, type) {
  clearWelcome();

  const message = document.createElement("div");
  message.className = `message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = String(text ?? "");

  message.appendChild(avatar);
  message.appendChild(bubble);
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function showThinking() {
  const message = document.createElement("div");
  message.className = "message ai";
  message.id = "thinking";

  message.innerHTML = `
    <div class="avatar">✦</div>
    <div class="bubble thinking">
      <span></span><span></span><span></span>
    </div>
  `;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function removeThinking() {
  document.getElementById("thinking")?.remove();
}

function getAIResponse(question) {
  const q = question.toLowerCase();

  if (q.includes("hello") || q.includes("hi")) {
    return "Hey! 👋 I'm Nova AI. How can I help you?";
  }

  if (q.includes("your name")) {
    return "My name is Nova AI 🤖";
  }

  if (q.includes("who are you")) {
    return "I'm Nova AI — your personal AI assistant. ✦";
  }

  if (q.includes("html")) {
    return "HTML creates the structure of a website. 🌐";
  }

  if (q.includes("css")) {
    return "CSS controls the design, layout, colors and animations of websites. 🎨";
  }

  if (q.includes("javascript") || /\bjs\b/.test(q)) {
    return "JavaScript makes websites interactive and powerful. ⚡";
  }

  if (q.includes("python")) {
    return "Python powers Nova's backend. 🐍";
  }

  if (q.includes("sql") || q.includes("database")) {
    return "SQLite stores Nova's conversation history. 🗄️";
  }

  if (q.includes("business")) {
    return "A good business starts by solving a real problem for people. 💡";
  }

  if (q.includes("help")) {
    return "I can help with programming, websites, Python, SQL, business ideas and Nova AI. 🚀";
  }

  return "Interesting! 🤔 I'm still learning. Ask me about programming, websites, Python, SQL, business, or myself.";
}

function createConversationTitle(message) {
  const clean = String(message ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "New conversation";
  return clean.length > 36 ? clean.slice(0, 36).trimEnd() + "…" : clean;
}

function resetChatScreen() {
  chat.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">✦</div>
      <h1>How can I help you?</h1>
      <p>Ask Nova about coding, ideas, websites, business, or anything you're curious about.</p>
    </div>
  `;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;

  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;
  showThinking();

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: sessionId })
    });

    if (!response.ok) throw new Error("Backend error");

    const data = await response.json();
    rememberSession(sessionId, data.title || createConversationTitle(text));
    removeThinking();
    addMessage(data.reply, "ai");
    await loadHistory();
  } catch (error) {
    removeThinking();
    addMessage(
      getAIResponse(text) +
        " Python backend is offline, so Nova used its browser backup.",
      "ai"
    );
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});

async function checkConnection() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (!response.ok) throw new Error();
    const data = await response.json();

    statusText.textContent = data.ai_enabled ? "AI online" : "Backend online";
    statusDot.style.color = "#4ade80";
  } catch {
    statusText.textContent = "Offline mode";
    statusDot.style.color = "#facc15";
  }
}

async function loadHistory(filterText = "") {
  historyList.innerHTML = '<div class="history-item">Loading conversations...</div>';

  const sessions = getSavedSessions();
  if (!sessions.length) {
    historyList.innerHTML = '<div class="history-item">No conversations yet</div>';
    return;
  }

  const conversations = [];

  for (const session of sessions) {
    try {
      const response = await fetch(
        `${API_URL}/api/history/${encodeURIComponent(session.id)}`
      );
      if (!response.ok) continue;

      const data = await response.json();
      if (!data.messages?.length) continue;

      const title = data.title || session.title || "New conversation";
      conversations.push({ ...session, title });
    } catch {
      // Keep checking the remaining saved conversations.
    }
  }

  if (!conversations.length) {
    historyList.innerHTML = '<div class="history-item">No conversations yet</div>';
    return;
  }

  saveSessionList(conversations);

  const filter = String(filterText).trim().toLowerCase();
  const filtered = conversations.filter(conversation => conversation.title.toLowerCase().includes(filter));
  if (!filtered.length) {
    historyList.innerHTML = '<div class="history-empty">No matching conversations</div>';
    return;
  }

  historyList.innerHTML = "";

  filtered.forEach((conversation) => {
    const row = document.createElement("div");
    row.className = "history-row";

    const button = document.createElement("button");
    button.className = "history-item" + (conversation.id === sessionId ? " current-chat" : "");
    button.textContent = conversation.title;
    button.title = conversation.title;
    button.addEventListener("click", async () => {
      await switchConversation(conversation.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete conversation";
    deleteButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteSession(conversation.id);
    });

    row.appendChild(button);
    row.appendChild(deleteButton);
    historyList.appendChild(row);
  });
}

async function switchConversation(id) {
  sessionId = id;
  localStorage.setItem("novaSessionId", sessionId);
  resetChatScreen();
  await restoreChat();
  input.focus();
  await loadHistory();
}

async function restoreChat() {
  try {
    const response = await fetch(`${API_URL}/api/history/${encodeURIComponent(sessionId)}`);
    if (!response.ok) throw new Error("Conversation unavailable");

    const data = await response.json();
    if (!data.messages?.length) return;

    resetChatScreen();

    data.messages.forEach((item) => {
      if (item.role === "user" || item.role === "assistant") {
        addMessage(item.message, item.role === "user" ? "user" : "ai");
      }
    });
  } catch {
    // Keep the welcome screen when the backend is unavailable.
  }
}

async function deleteSession(id) {
  try {
    const response = await fetch(API_URL + "/api/history/" + encodeURIComponent(id), { method: "DELETE" });
    if (!response.ok) throw new Error("Delete failed");
  } catch {
    return;
  }
  saveSessionList(getSavedSessions().filter(item => item.id !== id));
  if (id === sessionId) resetChatScreen();
  await loadHistory(historySearch?.value || "");
}

async function deleteCurrentSession() {
  try {
    await fetch(`${API_URL}/api/history/${encodeURIComponent(sessionId)}`, {
      method: "DELETE"
    });
  } catch {
    // The local chat should still reset if the backend is unavailable.
  }
}

historyBtn?.addEventListener("click", () => {
  historyList.classList.toggle("visible");
  historyBtn.classList.toggle("active");
  if (historyList.classList.contains("visible")) loadHistory(historySearch?.value || "");
});

chatBtn?.addEventListener("click", () => {
  historyList.classList.remove("visible");
  historyBtn.classList.remove("active");
  chatBtn.classList.add("active");
  input.focus();
});

async function startNewChat() {
  sessionId = createSessionId();
  localStorage.setItem("novaSessionId", sessionId);
  rememberSession(sessionId);
  resetChatScreen();
  await loadHistory();
  input.focus();
}

historySearch?.addEventListener("input", () => loadHistory(historySearch.value));

newChatBtn?.addEventListener("click", startNewChat);

clearBtn?.addEventListener("click", async () => {
  await deleteCurrentSession();
  resetChatScreen();

  const sessions = getSavedSessions().filter(item => item.id !== sessionId);
  saveSessionList(sessions);

  await loadHistory();
  input.focus();
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent;
    sendMessage();
  });
});

checkConnection();
restoreChat();
input.focus();
