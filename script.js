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
const projectsBtn = document.getElementById("projectsBtn");
const projectsPanel = document.getElementById("projectsPanel");
const closeProjects = document.getElementById("closeProjects");
const createProjectBtn = document.getElementById("createProjectBtn");
const projectsList = document.getElementById("projectsList");
const projectModal = document.getElementById("projectModal");
const closeProjectModal = document.getElementById("closeProjectModal");
const cancelProject = document.getElementById("cancelProject");
const saveProject = document.getElementById("saveProject");
const projectName = document.getElementById("projectName");
const projectDescription = document.getElementById("projectDescription");
const projectModalTitle = document.getElementById("projectModalTitle");
let activeProjectId = localStorage.getItem("novaActiveProjectId") || null;

const historySearch = document.getElementById("historySearch");

const githubConnectBtn=document.getElementById("githubConnectBtn");
const githubModal=document.getElementById("githubModal");
const closeGithubModal=document.getElementById("closeGithubModal");
const cancelGithub=document.getElementById("cancelGithub");
const connectGithub=document.getElementById("connectGithub");
const githubRepoInput=document.getElementById("githubRepoInput");
const githubBranchInput=document.getElementById("githubBranchInput");
const githubConnectionStatus=document.getElementById("githubConnectionStatus");
const githubFileStatus=document.getElementById("githubFileStatus");
const refreshGithubBtn=document.getElementById("refreshGithubBtn");
const workspaceView = document.getElementById("workspaceView");
const workspaceBack = document.getElementById("workspaceBack");
const workspaceClose = document.getElementById("workspaceClose");
const workspaceName = document.getElementById("workspaceName");
const workspaceDescription = document.getElementById("workspaceDescription");
const workspaceSave = document.getElementById("workspaceSave");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const projectStatus = document.getElementById("projectStatus");
const workspaceFiles = document.getElementById("workspaceFiles");
const codeEditor = document.getElementById("codeEditor");
const currentFileName = document.getElementById("currentFileName");
const saveFileBtn = document.getElementById("saveFileBtn");
const newFileBtn = document.getElementById("newFileBtn");
const workspaceChat = document.getElementById("workspaceChat");
const workspaceInput = document.getElementById("workspaceInput");
const workspaceSend = document.getElementById("workspaceSend");
let workspaceFileId=null;
let workspaceFilesState=[];
let githubRepo=null;
let githubBranch="main";
let githubFilesCache=[];
function projectGithubStorageKey(id){return "novaProjectGithub_"+id;}
function loadGithubConnection(project){try{const x=JSON.parse(localStorage.getItem(projectGithubStorageKey(project.id))||"null");return x&&x.repo?{repo:x.repo,branch:x.branch||"main"}:{repo:"",branch:"main"};}catch{return {repo:"",branch:"main"};}}
function saveGithubConnection(id,x){localStorage.setItem(projectGithubStorageKey(id),JSON.stringify(x));}
function setGithubStatus(t,type=""){if(!githubConnectionStatus)return;githubConnectionStatus.textContent=t;githubConnectionStatus.className="github-connection-status"+(type?" "+type:"");}
function setGithubFileStatus(t){if(githubFileStatus)githubFileStatus.textContent=t;}
function openGithubModal(){const p=getActiveProject();if(!p)return;const x=loadGithubConnection(p);githubRepoInput.value=x.repo;githubBranchInput.value=x.branch;setGithubStatus(x.repo?"Saved connection: "+x.repo+" ("+x.branch+")":"Not connected");githubModal.classList.add("open");githubModal.setAttribute("aria-hidden","false");}
function closeGithubConnectionModal(){githubModal.classList.remove("open");githubModal.setAttribute("aria-hidden","true");}
async function connectGithubRepo(){const p=getActiveProject(),repo=githubRepoInput.value.trim(),branch=githubBranchInput.value.trim()||"main";if(!p||!repo.includes("/")){setGithubStatus("Enter a repository like calebawaya/Nova-AI.","error");return;}connectGithub.disabled=true;setGithubStatus("Checking repository...");try{const r=await fetch(API_URL+"/api/github/repository?repo="+encodeURIComponent(repo));const d=await r.json();if(!r.ok)throw new Error(d.error||"Repository could not be connected.");githubRepo=d.repo||repo;githubBranch=branch;saveGithubConnection(p.id,{repo:githubRepo,branch});setGithubStatus("Connected to "+githubRepo+" ("+branch+")","connected");setGithubFileStatus("GitHub: "+githubRepo);await loadGithubFiles();closeGithubConnectionModal();}catch(e){setGithubStatus(e.message||"GitHub connection failed.","error");}finally{connectGithub.disabled=false;}}
async function loadGithubFiles(){if(!githubRepo)return;setGithubFileStatus("Loading GitHub files...");try{const r=await fetch(API_URL+"/api/github/files?repo="+encodeURIComponent(githubRepo)+"&branch="+encodeURIComponent(githubBranch));const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load GitHub files.");githubFilesCache=d.files||[];workspaceFilesState=githubFilesCache.filter(f=>f.type==="file").map(f=>({id:"gh:"+f.path,name:f.path,content:"",sha:f.sha,githubPath:f.path,source:"github"}));persistWorkspace();renderWorkspaceFiles();if(workspaceFilesState.length)selectWorkspaceFile(workspaceFilesState[0].id);setGithubFileStatus("GitHub: "+githubRepo);}catch(e){setGithubFileStatus("GitHub error");addWorkspaceMessage(e.message||"Could not load GitHub files.","ai");}}
async function loadGithubFileContent(file){try{const r=await fetch(API_URL+"/api/github/file?repo="+encodeURIComponent(githubRepo)+"&path="+encodeURIComponent(file.githubPath)+"&branch="+encodeURIComponent(githubBranch));const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load file.");file.content=d.content||"";file.sha=d.sha||file.sha;codeEditor.value=file.content;}catch(e){addWorkspaceMessage(e.message||"Could not load GitHub file.","ai");}}


function projectStorageKey(id){ return "novaProjectWorkspace_" + id; }
function loadWorkspaceState(project){
  try {
    const saved=JSON.parse(localStorage.getItem(projectStorageKey(project.id))||"null");
    return saved && typeof saved==="object" ? saved : {progress:0,status:"Planning",files:[]};
  } catch { return {progress:0,status:"Planning",files:[]}; }
}
function saveWorkspaceState(projectId,state){ localStorage.setItem(projectStorageKey(projectId),JSON.stringify(state)); }
function renderWorkspaceFiles(){
  workspaceFiles.innerHTML="";
  if(!workspaceFilesState.length){ workspaceFiles.innerHTML='<div class="file-empty">No files yet. Create one.</div>'; return; }
  workspaceFilesState.forEach(file=>{
    const b=document.createElement("button");
    b.type="button"; b.className="file-item"+(file.id===workspaceFileId?" active":"");
    b.textContent=file.name;
    b.addEventListener("click",()=>selectWorkspaceFile(file.id));
    workspaceFiles.appendChild(b);
  });
}
function selectWorkspaceFile(id){const file=workspaceFilesState.find(f=>f.id===id);if(!file)return;workspaceFileId=id;currentFileName.textContent=file.name;codeEditor.value=file.content||"";renderWorkspaceFiles();if(file.source==="github"&&!file.content)loadGithubFileContent(file);}
function updateWorkspaceProgress(value){
  const v=Math.max(0,Math.min(100,Number(value)||0));
  progressBar.style.width=v+"%"; progressLabel.textContent=v+"%";
}
function addWorkspaceMessage(text,type){
  const el=document.createElement("div"); el.className="workspace-msg "+type; el.textContent=text; workspaceChat.appendChild(el); workspaceChat.scrollTop=workspaceChat.scrollHeight;
}
function renderWorkspaceChat(){
  workspaceChat.innerHTML="";
  addWorkspaceMessage("This chat is connected to the active project. Nova will receive its project context.","ai");
}
function openProjectWorkspace(project){
  const state=loadWorkspaceState(project);
  const github=loadGithubConnection(project); githubRepo=github.repo||null; githubBranch=github.branch||"main"; if(githubRepo){setGithubFileStatus("GitHub: "+githubRepo);loadGithubFiles();}
  activeProjectId=project.id; localStorage.setItem("novaActiveProjectId",project.id);
  workspaceName.textContent=project.name;
  workspaceDescription.textContent=project.description||"No description yet.";
  workspaceView.classList.add("open"); workspaceView.setAttribute("aria-hidden","false");
  workspaceFilesState=Array.isArray(state.files)?state.files:[];
  updateWorkspaceProgress(state.progress); projectStatus.value=state.status||"Planning";
  workspaceFileId=workspaceFilesState[0]?.id||null; renderWorkspaceFiles();
  if(workspaceFileId) selectWorkspaceFile(workspaceFileId); else {currentFileName.textContent="Select a file";codeEditor.value="";}
  renderWorkspaceChat();
}
function closeProjectWorkspace(){
  workspaceView.classList.remove("open"); workspaceView.setAttribute("aria-hidden","true");
}
function persistWorkspace(){
  if(!activeProjectId)return;
  saveWorkspaceState(activeProjectId,{progress:Number(progressLabel.textContent.replace("%","")),status:projectStatus.value,files:workspaceFilesState});
}
function createWorkspaceFile(){
  if(!activeProjectId)return;
  const name=prompt("File name:", "index.html");
  if(!name||!name.trim())return;
  const cleanName=name.trim().slice(0,80);
  const file={id:createSessionId(),name:githubRepo ? cleanName : cleanName,content:"",source:githubRepo?"github":"local",githubPath:githubRepo?cleanName:null,sha:null};
  workspaceFilesState.push(file); persistWorkspace(); selectWorkspaceFile(file.id);
}
async function saveWorkspaceFile(){const file=workspaceFilesState.find(f=>f.id===workspaceFileId);if(!file)return;file.content=codeEditor.value;if(githubRepo){saveFileBtn.textContent="Saving...";try{const r=await fetch(API_URL+"/api/github/file",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({repo:githubRepo,path:file.githubPath||file.name,branch:githubBranch,content:file.content,sha:file.sha||null,message:"Update "+(file.githubPath||file.name)+" from Nova AI"})});const d=await r.json();if(!r.ok)throw new Error(d.error||"GitHub save failed.");file.sha=d.sha||file.sha;file.source="github";file.githubPath=file.githubPath||file.name;setGithubFileStatus("Saved: "+file.githubPath);saveFileBtn.textContent="Saved to GitHub";persistWorkspace();setTimeout(()=>saveFileBtn.textContent="Save file",1200);}catch(e){saveFileBtn.textContent="Save file";addWorkspaceMessage(e.message||"GitHub save failed.","ai");}return;}persistWorkspace();saveFileBtn.textContent="Saved";setTimeout(()=>saveFileBtn.textContent="Save file",1000);}
async function sendWorkspaceChat(){
  const message=workspaceInput.value.trim();
  if(!message||!activeProjectId||isStreaming)return;
  workspaceInput.value="";
  addWorkspaceMessage(message,"user");
  try{
    const response=await fetch(API_URL+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      message,session_id:sessionId,project_id:activeProjectId,response_style:localStorage.getItem("novaResponseStyle")||"balanced",memory_enabled:localStorage.getItem("novaMemory")!=="false"
    })});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Request failed");
    addWorkspaceMessage(data.reply||"Nova did not return a response.","ai");
  }catch(e){addWorkspaceMessage("I couldn't reach Nova right now. Check that the Python backend is running.","ai");}
}
function runWorkspaceTool(kind){
  const project=getActiveProject(); if(!project)return;
  const prompts={
    code:"Generate the next code needed for my project.",
    fix:"Review my project and help me find a likely bug.",
    plan:"Create a step-by-step build plan for this project.",
    review:"Review my current project structure and suggest useful improvements."
  };
  workspaceInput.value=prompts[kind]||prompts.plan; sendWorkspaceChat();
}




function getProjects() {
  try {
    const items = JSON.parse(localStorage.getItem("novaProjects") || "[]");
    return Array.isArray(items) ? items : [];
  } catch { return []; }
}
function saveProjects(items) { localStorage.setItem("novaProjects", JSON.stringify(items)); }
function setActiveProject(id) {
  activeProjectId = id || null;
  if (activeProjectId) localStorage.setItem("novaActiveProjectId", activeProjectId);
  else localStorage.removeItem("novaActiveProjectId");
  renderProjects();
}
function getActiveProject() {
  return getProjects().find(item => item.id === activeProjectId) || null;
}
async function syncProjectsFromServer() {
  try {
    const localProjects = getProjects();
    for (const project of localProjects) {
      await syncProjectToServer(project);
    }
    const response = await fetch(API_URL + "/api/projects");
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.projects)) {
      saveProjects(data.projects);
      if (activeProjectId && !data.projects.some(p => p.id === activeProjectId)) setActiveProject(null);
      renderProjects();
    }
  } catch {}
}
async function syncProjectToServer(project) {
  try {
    const response = await fetch(API_URL + "/api/projects", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(project)
    });
    return response.ok;
  } catch { return false; }
}
function renderProjects() {
  const items = getProjects();
  if (!items.length) { projectsList.innerHTML = '<div class="project-empty">No projects yet</div>'; return; }
  projectsList.innerHTML = "";
  const active = getActiveProject();
  if (active) {
    const activeBar = document.createElement("div");
    activeBar.className = "project-active";
    activeBar.textContent = "● " + active.name;
    projectsList.appendChild(activeBar);
  }
  items.forEach(project => {
    const row = document.createElement("div"); row.className = "project-row";
    const open = document.createElement("button"); open.className = "project-open"; open.textContent = project.name; open.title = project.description || project.name;
    open.addEventListener("click", async () => {
      setActiveProject(project.id);
      projectsPanel.classList.remove("open");
      projectsBtn.classList.remove("active");
      chatBtn?.classList.add("active");
      openProjectWorkspace(project);
    });
    const del = document.createElement("button"); del.className = "project-delete"; del.textContent = "×"; del.title = "Delete project";
    del.addEventListener("click", async () => {
      try { await fetch(API_URL + "/api/projects/" + encodeURIComponent(project.id), {method:"DELETE"}); } catch {}
      saveProjects(getProjects().filter(item => item.id !== project.id));
      if (activeProjectId === project.id) setActiveProject(null);
      renderProjects();
    });
    row.append(open, del); projectsList.appendChild(row);
  });
}
function openProjectModal() {
  projectName.value = "";
  projectDescription.value = "";
  projectModalTitle.textContent = "Create project";
  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden","false");
  setTimeout(() => projectName.focus(),50);
}
function closeProjectModalFn() { projectModal.classList.remove("open"); projectModal.setAttribute("aria-hidden","true"); }
async function saveCurrentProject() {
  const name = projectName.value.trim();
  if (!name) { projectName.focus(); return; }
  const project = {
    id: createSessionId(),
    name: name.slice(0,50),
    description: projectDescription.value.trim().slice(0,500)
  };
  await syncProjectToServer(project);
  const items = getProjects().filter(item => item.id !== project.id);
  items.unshift({...project, createdAt: Date.now(), updatedAt: Date.now()});
  saveProjects(items.slice(0,30));
  setActiveProject(project.id);
  closeProjectModalFn();
}
projectsBtn?.addEventListener("click",()=>{ projectsPanel.classList.toggle("open"); settingsPanel?.classList.remove("open"); historyList?.classList.remove("visible"); historyBtn?.classList.remove("active"); projectsBtn.classList.toggle("active"); if(projectsPanel.classList.contains("open")) renderProjects(); });
closeProjects?.addEventListener("click",()=>projectsPanel.classList.remove("open"));
createProjectBtn?.addEventListener("click",openProjectModal);
closeProjectModal?.addEventListener("click",closeProjectModalFn);
cancelProject?.addEventListener("click",closeProjectModalFn);
saveProject?.addEventListener("click",saveCurrentProject);
projectModal?.addEventListener("click",e=>{if(e.target===projectModal)closeProjectModalFn();});
projectDescription?.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")saveCurrentProject();});

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
        memory_enabled: localStorage.getItem("novaMemory") !== "false",
        project_id: activeProjectId || null
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

githubConnectBtn?.addEventListener("click",openGithubModal);
closeGithubModal?.addEventListener("click",closeGithubConnectionModal);
cancelGithub?.addEventListener("click",closeGithubConnectionModal);
connectGithub?.addEventListener("click",connectGithubRepo);
refreshGithubBtn?.addEventListener("click",loadGithubFiles);
githubModal?.addEventListener("click",e=>{if(e.target===githubModal)closeGithubConnectionModal();});
workspaceBack?.addEventListener("click",closeProjectWorkspace);
workspaceClose?.addEventListener("click",closeProjectWorkspace);
workspaceSave?.addEventListener("click",persistWorkspace);
saveFileBtn?.addEventListener("click",saveWorkspaceFile);
newFileBtn?.addEventListener("click",createWorkspaceFile);
projectStatus?.addEventListener("change",persistWorkspace);
document.querySelectorAll(".progress-controls button").forEach(button=>{
  button.addEventListener("click",()=>{updateWorkspaceProgress(button.dataset.progress);persistWorkspace();});
});
workspaceSend?.addEventListener("click",sendWorkspaceChat);
workspaceInput?.addEventListener("keydown",e=>{if(e.key==="Enter")sendWorkspaceChat();});
document.querySelectorAll("[data-worktool]").forEach(button=>button.addEventListener("click",()=>runWorkspaceTool(button.dataset.worktool)));


loadSettings();
renderProjects();
syncProjectsFromServer();
checkConnection();
restoreChat();
input.focus();
