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

function getAIResponse(question) {
  const q = question.toLowerCase();

  if (q.includes("hello") || q.includes("hi")) {
    return "Hey! 👋 I'm Nova AI. How can I help you?";
  }

  if (q.includes("your name")) {
    return "My name is Nova AI 🤖";
  }

  if (q.includes("who are you")) {
    return "I'm Nova AI — your little personal AI assistant.";
  }

  if (q.includes("html")) {
    return "HTML is used to create the structure of websites. 🌐";
  }

  if (q.includes("css")) {
    return "CSS makes websites look beautiful — colors, layouts, animations and more. 🎨";
  }

  if (q.includes("javascript")) {
    return "JavaScript makes websites interactive and powerful. ⚡";
  }

  if (q.includes("business")) {
    return "A good business starts with a problem people need solved. 💡";
  }

  return "Interesting! 🤔 I'm still learning. Try asking me about HTML, CSS, JavaScript, business, or myself.";
}

function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    const response = getAIResponse(text);
    addMessage(response, "ai");
  }, 500);
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});