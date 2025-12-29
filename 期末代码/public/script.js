const toggle=document.getElementById('menu-toggle');
const nav=document.getElementById('nav');
if(toggle){
  toggle.setAttribute('aria-expanded','false');
  toggle.addEventListener('click',()=>{
    const open=nav.style.display==='flex';
    nav.style.display=open?'none':'flex';
    toggle.setAttribute('aria-expanded',open?'false':'true');
  })
}
function setupChat(ids){
  const form=document.getElementById(ids.form);
  const input=document.getElementById(ids.input);
  const send=document.getElementById(ids.send);
  const statusEl=document.getElementById(ids.status);
  const messages=document.getElementById(ids.messages);
  if(!form||!input||!send||!statusEl||!messages)return;
  statusEl.setAttribute('aria-live','polite');
  function append(role,text){const row=document.createElement('div');row.className='msg '+(role==='我'?'me':'ai');const r=document.createElement('div');r.className='role';r.textContent=role;const t=document.createElement('div');t.className='text';t.textContent=text;row.appendChild(r);row.appendChild(t);messages.appendChild(row);messages.scrollTop=messages.scrollHeight}
  function localReply(msg){
    return '无法连接到服务器，请检查网络或确认服务已启动。';
  }
  function getApiCandidates(){
    const ports=[3000,3001,3002,3003,3004];
    const isLocal3000 = location.hostname==='localhost' && location.port==='3000';
    if(isLocal3000){
      return ['/api/chat'];
    }
    const list=[];
    ports.forEach(p=>list.push(`http://localhost:${p}/api/chat`));
    return list;
  }
  async function postJson(url, payload){
    return await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  }
  async function chat(message){
    statusEl.textContent='正在思考...';
    send.disabled=true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try{
      const endpoints=getApiCandidates();
      let res=null;
      
      for(const url of endpoints){
        try{
          console.log('Trying endpoint:', url);
          const c = new AbortController();
          const id = setTimeout(() => c.abort(), 5000); // 增加到5秒
          const r = await fetch(url, {
             method: 'POST',
             headers: {'Content-Type':'application/json'},
             body: JSON.stringify({message}),
             signal: c.signal
          });
          clearTimeout(id);
          console.log('Connected to:', url, r.status);
          if(r.ok) { res = r; break; }
        }catch(e){
          console.log('Failed endpoint:', url, e);
        }
      }

      clearTimeout(timeoutId);

      if(!res){
        append('AI', localReply(message));
        statusEl.textContent='';
        send.disabled=false;
        return;
      }

      // Create AI message bubble manually to support streaming
      const row=document.createElement('div');
      row.className='msg ai';
      const r=document.createElement('div');r.className='role';r.textContent='AI';
      const t=document.createElement('div');t.className='text';t.textContent='';
      row.appendChild(r);row.appendChild(t);
      messages.appendChild(row);
      messages.scrollTop=messages.scrollHeight;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
           const trimmed = line.trim();
           if (!trimmed) continue;
           if (trimmed === 'data: [DONE]') break;
           if (trimmed.startsWith('data: ')) {
             try {
               const json = JSON.parse(trimmed.slice(6));
               if (json.content) {
                 fullText += json.content;
                 t.textContent = fullText;
                 messages.scrollTop = messages.scrollHeight;
               }
             } catch {}
           }
        }
      }
      statusEl.textContent='';
    }catch(e){
      if(e.name==='AbortError') statusEl.textContent='连接超时';
      else statusEl.textContent='网络错误';
    }finally{
      send.disabled=false;
    }
  }
  form.addEventListener('submit',e=>{e.preventDefault();const msg=(input.value||'').trim().slice(0,2000);if(!msg)return;append('我',msg);input.value='';chat(msg)});
  input.addEventListener('focus',()=>{setTimeout(()=>{input.scrollIntoView({block:'center',behavior:'smooth'})},200)});
}
setupChat({form:'chat-form',input:'message',send:'send',status:'status',messages:'messages'});
setupChat({form:'chat-form-float',input:'message-float',send:'send-float',status:'status-float',messages:'messages-float'});

function initLazy(){
  const imgs=document.querySelectorAll('img[data-src],img.lazy');
  if(!imgs.length)return;
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){const img=e.target;const src=img.getAttribute('data-src');if(src){img.setAttribute('src',src);img.removeAttribute('data-src')}obs.unobserve(img)}})
  },{rootMargin:'100px'});
  imgs.forEach(img=>obs.observe(img));
}

function initScrollAnimations() {
  const elements = document.querySelectorAll('.section, .card, .work');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

function typeWriterEffect() {
  const subtitle = document.querySelector('.hero .subtitle');
  if (!subtitle) return;
  const text = subtitle.textContent;
  subtitle.textContent = '';
  let i = 0;
  function type() {
    if (i < text.length) {
      subtitle.textContent += text.charAt(i);
      i++;
      setTimeout(type, 100);
    }
  }
  setTimeout(type, 500); // Small delay before starting
}

initLazy();
initScrollAnimations();
typeWriterEffect();
