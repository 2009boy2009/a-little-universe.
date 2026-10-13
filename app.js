const $ = s => document.querySelector(s);
let musicVideoId = ''; // Optional: paste a YouTube video ID here to enable background music.
let playerFrame = null, musicStarted = false, messageRevealed = false, typingTimer = null;
let allMessages = {};
function localDateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function formatDate(key){const [y,m,d]=key.split('-').map(Number);return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));}
async function start(){
  try { const r=await fetch('./messages.json',{cache:'no-store'}); if(!r.ok) throw new Error('Could not load messages'); allMessages=await r.json(); }
  catch { $('#today-content').innerHTML='<h2>Just a little pause</h2><p>Messages could not load yet. Please check the files in the GitHub repository.</p>'; return; }
  const today=localDateKey(); $('#today-date').textContent=formatDate(today); renderToday(today,allMessages[today]);
  const previous=Object.entries(allMessages).filter(([date])=>date<today).sort(([a],[b])=>b.localeCompare(a)).map(([date,msg])=>({...msg,date})); renderArchive(previous);
}
function renderToday(today,msg){const content=$('#today-content'),reveal=$('#reveal-button'),hint=$('#reveal-hint');messageRevealed=false;
 if(!msg){content.innerHTML='<div class="placeholder-orbit">✧</div><h2>A note for today</h2><p>Today’s note is still among the stars, waiting to be written.</p>';reveal.classList.add('hidden');hint.textContent='Add a message for today in messages.json.';return;}
 content.innerHTML='<div class="placeholder-orbit">✧</div><h2></h2><p>Your words are waiting here.</p>';content.querySelector('h2').textContent=msg.title||'A little note for today';reveal.classList.remove('hidden');reveal.disabled=false;reveal.innerHTML='Reveal today’s message <span>♡</span>';hint.textContent='A little note, just for today.';
 reveal.onclick=()=>{if(messageRevealed)return;messageRevealed=true;reveal.classList.add('hidden');hint.textContent='Take your time. There is no rush.';const p=content.querySelector('p');p.textContent='';typeText(p,msg.message||'');};
}
function typeText(el,text){if(typingTimer)clearTimeout(typingTimer);let i=0;const chars=Array.from(text);function step(){if(i>=chars.length)return;const ch=chars[i++];el.append(document.createTextNode(ch));typingTimer=setTimeout(step,ch==='\n'?180:24);}step();}
function renderArchive(items){const list=$('#archive-list');list.innerHTML='';$('#archive-count').textContent=`${items.length} ${items.length===1?'note':'notes'}`;$('#archive-empty').classList.toggle('hidden',items.length>0);
 for(const item of items){const article=document.createElement('article');article.className='archive-item';const btn=document.createElement('button');btn.className='archive-toggle';btn.type='button';btn.setAttribute('aria-expanded','false');const meta=document.createElement('span');meta.className='archive-meta';const date=document.createElement('span');date.className='archive-date';date.textContent=item.dateLabel||formatDate(item.date);const title=document.createElement('span');title.className='archive-title';title.textContent=item.title||'A little note';meta.append(date,title);const chevron=document.createElement('span');chevron.className='archive-chevron';chevron.textContent='⌄';btn.append(meta,chevron);const message=document.createElement('div');message.className='archive-message';message.textContent=item.message||'';btn.addEventListener('click',()=>{const open=article.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));});article.append(btn,message);list.append(article);}
}
const musicToggle=$('#music-toggle'),musicStatus=$('#music-status'),playerHolder=$('#player-holder');
musicToggle.addEventListener('click',()=>{if(!musicVideoId){musicStatus.textContent='Add a YouTube video ID in app.js to enable music.';return;}if(!musicStarted){playerFrame=document.createElement('iframe');playerFrame.title='YouTube background music';playerFrame.allow='autoplay; encrypted-media; picture-in-picture';playerFrame.referrerPolicy='strict-origin-when-cross-origin';playerFrame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(musicVideoId)}?autoplay=1&playsinline=1&controls=0&loop=1&playlist=${encodeURIComponent(musicVideoId)}&rel=0`;playerFrame.width='1';playerFrame.height='1';playerFrame.tabIndex=-1;playerHolder.append(playerFrame);musicStarted=true;musicToggle.textContent='Music on ♫';musicStatus.textContent='Playing your soundtrack';}else{if(playerFrame)playerFrame.remove();playerFrame=null;musicStarted=false;musicToggle.textContent='Play music ♫';musicStatus.textContent='Paused until you press play';}});
start();
