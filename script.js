const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;

  message.innerHTML = `
    <div class="avatar">✦</div>
    <div class="bubble">${text}</div>
  `;

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

  if (q.includes("javascript") || q.includes("js")) {
    return "JavaScript makes websites interactive and powerful. ⚡";
  }

  if (q.includes("business")) {
    return "A good business starts by solving a real problem for people. 💡";
  }

  if (q.includes("help")) {
    return "I can talk about HTML, CSS, JavaScript, business ideas, and programming. Try asking me something! 🚀";
  }

  return "Interesting! 🤔 I'm still learning. Ask me about HTML, CSS, JavaScript, business, programming, or myself.";
}

function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;
  showThinking();

  setTimeout(() => {
    removeThinking();
    addMessage(getAIResponse(text), "ai");
    sendBtn.disabled = false;
    input.focus();
  }, 700);
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});

input.focus();