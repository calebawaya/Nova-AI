const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const clearBtn = document.getElementById("clearBtn");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");
const historyBtn = document.getElementById("historyBtn");
const chatBtn = document.getElementById("chatBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const themeSelect = document.getElementById("themeSelect");
const styleSelect = document.getElementById("styleSelect");
const memoryToggle = document.getElementById("memoryToggle");
const historyList = document.getElementById("historyList");
const historySearch = document.getElementById("historySearch");


function loadSettings() {
  const theme = localStorage.getItem("novaTheme") || "dark";
  const responseStyle = localStorage.getItem("novaResponseStyle") || "balanced";
  const memory = localStorage.getItem("novaMemory") !== "false";

  document.body.dataset.theme = theme;
  themeSelect.value = theme;
  styleSelect.value = responseStyle;
  memoryToggle.checked = memory;
}

function saveSettings() {
  localStorage.setItem("novaTheme", themeSelect.value);
  localStorage.setItem("novaResponseStyle", styleSelect.value);
  localStorage.setItem("novaMemory", String(memoryToggle.checked));
  document.body.dataset.theme = themeSelect.value;
}

settingsBtn?.addEventListener("click", () => {
  settingsPanel?.classList.toggle("open");
  historyList?.classList.remove("visible");
  historyBtn?.classList.remove("active");
});

closeSettings?.addEventListener("click", () => settingsPanel?.classList.remove("open"));
themeSelect?.addEventListener("change", saveSettings);
styleSelect?.addEventListener("change", saveSettings);
memoryToggle?.addEventListener("change", saveSettings);

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
  sessions = sessions.map(item => ({ ...item, updatedAt: item.updatedAt || Date.now() }));
  localStorage.setItem("novaSessions", JSON.stringify(sessions));
}

function rememberSession(id, title = "New conversation") {
  const sessions = getSavedSessions().filter(item => item.id !== id);
  sessions.unshift({ id, title, updatedAt: Date.now() });
  saveSessionList(sessions.slice(0, 20));
}

if (!sessionId) {
  sessionId = createSessionId();
  localStorage.setItem("novaSessionId", sessionId);
}

rememberSession(sessionId);

// Change this one value when Nova's Python backend is deployed online.
const API_URL = "http://127.0.0.1:5000";

function getResponseStyleInstruction() {
  const style = localStorage.getItem("novaResponseStyle") || "balanced";
  if (style === "concise") return "Keep answers concise and focused.";
  if (style === "detailed") return "Give detailed explanations with useful examples.";
  return "Use a balanced level of detail.";
}

let isStreaming = false;
let stopStreamingRequested = false;

function setStreamingUI(active) {
  isStreaming = active;
  sendBtn.disabled = active;
  sendBtn.textContent = active ? "■" : "➤";
  sendBtn.title = active ? "Stop generating" : "Send message";
}

function stopStreaming() {
  if (!isStreaming) return;
  stopStreamingRequested = true;
  isStreaming = false;
  const stopButton = document.getElementById("stopStreamBtn");
  stopButton?.remove();
  sendBtn.disabled = false;
  sendBtn.textContent = "➤";
  sendBtn.title = "Send message";
}

function createStreamingMessage() {
  clearWelcome();

  const message = document.createElement("div");
  message.className = "message ai";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "✦";

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "bubble streaming-bubble";

  const cursor = document.createElement("span");
  cursor.className = "stream-cursor";
  cursor.textContent = "▌";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  const time = document.createElement("span");
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  meta.appendChild(time);

  content.appendChild(bubble);
  content.appendChild(meta);
  message.appendChild(avatar);
  message.appendChild(content);
  chat.appendChild(message);

  return { message, bubble, cursor, meta };
}

async function streamText(text) {
  const ui = createStreamingMessage();
  const fullText = String(text ?? "");
  let output = "";

  ui.bubble.appendChild(ui.cursor);

  for (let i = 0; i < fullText.length; i += 3) {
    if (stopStreamingRequested) break;

    output += fullText.slice(i, i + 3);
    ui.bubble.textContent = output;
    ui.bubble.appendChild(ui.cursor);
    chat.scrollTop = chat.scrollHeight;

    await new Promise(resolve => setTimeout(resolve, 12));
  }

  ui.cursor.remove();

  const copyButton = document.createElement("button");
  copyButton.className = "message-action";
  copyButton.type = "button";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output);
      copyButton.textContent = "Copied";
      setTimeout(() => copyButton.textContent = "Copy", 1200);
    } catch {
      copyButton.textContent = "Unavailable";
      setTimeout(() => copyButton.textContent = "Copy", 1200);
    }
  });
  ui.meta.appendChild(copyButton);

  return output;
}

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

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = String(text ?? "");

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const time = document.createElement("span");
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  meta.appendChild(time);

  if (type === "ai") {
    const copyButton = document.createElement("button");
    copyButton.className = "message-action";
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(String(text ?? ""));
        copyButton.textContent = "Copied";
        setTimeout(() => copyButton.textContent = "Copy", 1200);
      } catch {
        copyButton.textContent = "Unavailable";
        setTimeout(() => copyButton.textContent = "Copy", 1200);
      }
    });
    meta.appendChild(copyButton);
  }

  content.appendChild(bubble);
  content.appendChild(meta);
  message.appendChild(avatar);
  message.appendChild(content);
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function addRegenerateButton(question) {
  document.querySelector(".regenerate-row")?.remove();

  const row = document.createElement("div");
  row.className = "regenerate-row";

  const button = document.createElement("button");
  button.className = "regenerate-button";
  button.type = "button";
  button.textContent = "↻ Regenerate response";
  button.addEventListener("click", async () => {
    button.disabled = true;
    const last = [...chat.querySelectorAll(".message.ai")].pop();
    last?.remove();
    await requestAIResponse(question, true);
  });

  row.appendChild(button);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

async function requestAIResponse(text, isRegenerate = false) {
  stopStreamingRequested = false;
  setStreamingUI(true);
  showThinking();

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
        response_style: localStorage.getItem("novaResponseStyle") || "balanced",
        memory_enabled: localStorage.getItem("novaMemory") !== "false"
      })
    });

    if (!response.ok) throw new Error("Backend error");

    const data = await response.json();
    removeThinking();

    await streamText(data.reply);
    if (!stopStreamingRequested) addRegenerateButton(text);
    return true;
  } catch {
    removeThinking();
    await streamText(getAIResponse(text) + " Python backend is offline, so Nova used its browser backup.");
    if (!stopStreamingRequested) addRegenerateButton(text);
    return false;
  } finally {
    stopStreamingRequested = false;
    setStreamingUI(false);
    input.focus();
  }
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

function showCommandHelp() {
  clearWelcome();
  addMessage(
    "Nova commands:\n\n/help — show this command list\n/clear — clear the current conversation\n/code <request> — ask Nova for code\n/summarize — summarize the current conversation",
    "ai"
  );
}

async function handleCommand(text) {
  const commandLine = text.trim();
  const lower = commandLine.toLowerCase();

  if (lower === "/help") {
    showCommandHelp();
    return true;
  }

  if (lower === "/clear") {
    await deleteCurrentSession();
    resetChatScreen();

    const sessions = getSavedSessions().filter(item => item.id !== sessionId);
    saveSessionList(sessions);
    await loadHistory();
    return true;
  }

  if (lower.startsWith("/code")) {
    const request = commandLine.slice(5).trim();
    if (!request) {
      addMessage("Usage: /code <what you want to build>", "ai");
      return true;
    }

    addMessage(commandLine, "user");
    await requestAIResponse(
      "Act as a coding assistant. Give me beginner-friendly code for this request, explain where to put the code, and include the complete code when practical:\n\n" + request
    );
    return true;
  }

  if (lower === "/summarize") {
    addMessage(commandLine, "user");
    await requestAIResponse(
      "Summarize our current conversation. Give me the main goal, important decisions, current project or task, and useful next steps. If there is not enough conversation to summarize, say so clearly."
    );
    return true;
  }

  return false;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || isStreaming) return;

  if (text.startsWith("/")) {
    input.value = "";
    await handleCommand(text);
    input.focus();
    return;
  }

  addMessage(text, "user");
  input.value = "";
  stopStreamingRequested = false;
  setStreamingUI(true);
  showThinking();

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
        response_style: localStorage.getItem("novaResponseStyle") || "balanced",
        memory_enabled: localStorage.getItem("novaMemory") !== "false"
      })
    });

    if (!response.ok) throw new Error("Backend error");

    const data = await response.json();
    rememberSession(sessionId, data.title || createConversationTitle(text));
    removeThinking();

    await streamText(data.reply);
    if (!stopStreamingRequested) addRegenerateButton(text);
    await loadHistory();
  } catch (error) {
    removeThinking();
    await streamText(
      getAIResponse(text) +
      " Python backend is offline, so Nova used its browser backup."
    );
    if (!stopStreamingRequested) addRegenerateButton(text);
  } finally {
    stopStreamingRequested = false;
    setStreamingUI(false);
    input.focus();
  }
}

sendBtn.addEventListener("click", () => {
  if (isStreaming) {
    stopStreaming();
    return;
  }
  sendMessage();
});

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

      const title = session.customTitle || data.title || session.title || "New conversation";
      conversations.push({ ...session, title, updatedAt: session.updatedAt || Date.now() });
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

    const menuButton = document.createElement("button");
    menuButton.className = "history-menu";
    menuButton.type = "button";
    menuButton.textContent = "⋯";
    menuButton.title = "Conversation options";

    const menu = document.createElement("div");
    menu.className = "history-menu-panel";

    const renameButton = document.createElement("button");
    renameButton.textContent = "✎ Rename";
    renameButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      const current = conversation.customTitle || conversation.title;
      const name = prompt("Rename conversation:", current);
      if (name && name.trim()) {
        const sessions = getSavedSessions();
        const target = sessions.find(item => item.id === conversation.id);
        if (target) target.customTitle = name.trim().slice(0, 60);
        saveSessionList(sessions);
        await loadHistory(historySearch?.value || "");
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete conversation";
    menu.appendChild(renameButton);
    menu.appendChild(deleteButton);
    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      document.querySelectorAll(".history-menu-panel.open").forEach(panel => panel.classList.remove("open"));
      menu.classList.toggle("open");
    });
    deleteButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteSession(conversation.id);
    });

    row.appendChild(button);
    row.appendChild(menuButton);
    row.appendChild(menu);
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

    const lastUser = [...data.messages].reverse().find(item => item.role === "user");
    if (lastUser) addRegenerateButton(lastUser.message);
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
document.addEventListener("click", () => document.querySelectorAll(".history-menu-panel.open").forEach(panel => panel.classList.remove("open")));

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

const toolConfigs = {
  code: {
    icon: "💻", title: "Code Generator",
    description: "Describe what you want to build and Nova will create beginner-friendly code and explain where each file goes.",
    placeholder: "Example: Build a responsive calculator with HTML, CSS and JavaScript.",
    fields: `<div class="tool-field"><label>Language</label><select id="toolLanguage"><option>HTML/CSS/JavaScript</option><option>Python</option><option>JavaScript</option><option>SQL</option></select></div>`
  },
  explain: {
    icon: "📖", title: "Explain Code",
    description: "Paste code and Nova will break down what it does in simple language.",
    placeholder: "Paste your code here...",
    fields: `<div class="tool-field"><label>Level</label><select id="toolLevel"><option>Beginner</option><option>Intermediate</option></select></div>`
  },
  fix: {
    icon: "🛠", title: "Fix Error",
    description: "Paste the code and error message. Nova will identify the likely cause and suggest a correction.",
    placeholder: "Paste the code and the exact error message here...",
    fields: `<div class="tool-field"><label>Goal</label><select id="toolGoal"><option>Find the bug</option><option>Fix the code</option><option>Explain the error</option></select></div>`
  },
  website: {
    icon: "🌐", title: "Website Builder",
    description: "Turn an idea into a website plan with pages, features, design and starter code.",
    placeholder: "Example: I want a website for a small clothing business in Ghana.",
    fields: `<div class="tool-field"><label>Style</label><select id="toolStyle"><option>Modern</option><option>Minimal</option><option>Professional</option><option>Colorful</option></select></div>`
  },
  idea: {
    icon: "💡", title: "Idea Generator",
    description: "Get practical project ideas matched to your programming level and interests.",
    placeholder: "Example: Give me ideas for websites I could build and eventually monetize.",
    fields: `<div class="tool-field"><label>Focus</label><select id="toolFocus"><option>Websites</option><option>Apps</option><option>AI</option><option>Business</option></select></div>`
  }
};

const toolModal = document.getElementById("toolModal");
const toolModalIcon = document.getElementById("toolModalIcon");
const toolModalTitle = document.getElementById("toolModalTitle");
const toolModalDescription = document.getElementById("toolModalDescription");
const toolRequest = document.getElementById("toolRequest");
const toolExtraFields = document.getElementById("toolExtraFields");
const closeToolModal = document.getElementById("closeToolModal");
const cancelTool = document.getElementById("cancelTool");
const runTool = document.getElementById("runTool");
let activeTool = null;

function openTool(tool) {
  const config = toolConfigs[tool];
  if (!config || isStreaming) return;
  activeTool = tool;
  toolModalIcon.textContent = config.icon;
  toolModalTitle.textContent = config.title;
  toolModalDescription.textContent = config.description;
  toolRequest.placeholder = config.placeholder;
  toolRequest.value = "";
  toolExtraFields.innerHTML = config.fields;
  toolModal.classList.add("open");
  toolModal.setAttribute("aria-hidden", "false");
  setTimeout(() => toolRequest.focus(), 50);
}

function closeTool() {
  activeTool = null;
  toolModal.classList.remove("open");
  toolModal.setAttribute("aria-hidden", "true");
}

function buildToolPrompt() {
  const request = toolRequest.value.trim();
  if (!request) return "";
  const values = [...toolExtraFields.querySelectorAll("select")].map(select => `${select.previousElementSibling?.textContent}: ${select.value}`).join("\n");
  const base = {
    code: "Act as Nova Code Generator. Create complete beginner-friendly code when practical. Explain the files and how to run them.",
    explain: "Act as Nova Code Explainer. Explain the supplied code step by step in simple language. Point out important lines and concepts.",
    fix: "Act as Nova Debugger. Diagnose the supplied code/error, explain the likely cause, then provide corrected code and a simple explanation.",
    website: "Act as Nova Website Builder. Turn the request into a clear website plan with pages, features, design, and starter HTML/CSS/JavaScript where useful.",
    idea: "Act as Nova Idea Generator. Suggest practical beginner-friendly project ideas. Explain the problem, main features, and a sensible first build step."
  }[activeTool];
  return base + "\n\n" + values + "\n\nUser request:\n" + request;
}

function runActiveTool() {
  const prompt = buildToolPrompt();
  if (!prompt || !activeTool || isStreaming) return;
  const config = toolConfigs[activeTool];
  const displayRequest = toolRequest.value.trim();
  addMessage(`${config.icon} ${config.title}\n${displayRequest}`, "user");
  closeTool();
  requestAIResponse(prompt);
}

runTool?.addEventListener("click", runActiveTool);
closeToolModal?.addEventListener("click", closeTool);
cancelTool?.addEventListener("click", closeTool);
toolModal?.addEventListener("click", (event) => { if (event.target === toolModal) closeTool(); });
toolRequest?.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runActiveTool();
});

document.querySelectorAll(".tool-card").forEach((button) => {
  button.addEventListener("click", () => openTool(button.dataset.tool));
});

loadSettings();
checkConnection();
restoreChat();
input.focus();
