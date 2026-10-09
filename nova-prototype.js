/* Nova AI prototype polish: visual reactor and responsive shell */
(()=>{
  const mount=()=>{
    const icon=document.querySelector(".welcome-icon");
    if(icon && !icon.querySelector(".nova-reactor-core")){
      icon.innerHTML='<span class="nova-reactor-core" aria-hidden="true"></span>';
      icon.setAttribute("role","img");
      icon.setAttribute("aria-label","Blue Nova AI reactor core");
    }
    const status=document.getElementById("statusText");
    const dot=document.getElementById("statusDot");
    if(status && dot && !status.dataset.novaStatusHint){
      status.dataset.novaStatusHint="true";
      const observer=new MutationObserver(()=>{
        const online=/online|connected/i.test(status.textContent||"");
        dot.style.color=online?"#49d7ff":"#f6bf55";
        dot.style.textShadow=online?"0 0 12px rgba(73,215,255,.8)":"0 0 10px rgba(246,191,85,.5)";
      });
      observer.observe(status,{childList:true,subtree:true,characterData:true});
    }
    document.querySelectorAll(".tool-card,.suggestion").forEach(button=>{
      if(button.dataset.novaPrototypeBound)return;
      button.dataset.novaPrototypeBound="true";
      button.addEventListener("pointerdown",()=>button.classList.add("nova-pressed"));
      button.addEventListener("pointerup",()=>button.classList.remove("nova-pressed"));
      button.addEventListener("pointerleave",()=>button.classList.remove("nova-pressed"));
    });
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
