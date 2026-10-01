export const $=(selector,root=document)=>root.querySelector(selector);
export const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
export function download(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const uid=()=>crypto.randomUUID();
export const fmt=n=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n);
export function readStore(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback;}catch{return fallback;}}
export function saveStore(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('Storage is unavailable. Export a backup before closing.');return false;}}
export function navigate(render){$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{$$('[data-view]').forEach(b=>b.classList.toggle('active',b===button));render(Number(button.dataset.view));}));}
export function heading(kicker,title,description,actions=''){return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="subtitle">${description}</p></div><div class="actions">${actions}</div></div>`;}
export function stats(items){return `<div class="stats">${items.map(([label,value,note])=>`<article class="stat"><span>${label}</span><strong>${value}</strong><small>${note||''}</small></article>`).join('')}</div>`;}
export function bars(items){const max=Math.max(1,...items.map(x=>x[1]));return `<div class="bars">${items.map(([label,value])=>`<div class="bar-row"><span title="${esc(label)}">${esc(label)}</span><div><i style="width:${value/max*100}%"></i></div><b>${fmt(value)}</b></div>`).join('')}</div>`;}
export function empty(message){return `<div class="empty"><span>◇</span><p>${esc(message)}</p></div>`;}
export function setupDialog(id){const dialog=$('#'+id);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});$('.close',dialog)?.addEventListener('click',()=>dialog.close());return dialog;}
export function sizeCheck(file){if(!file)throw Error('Choose a file first.');if(file.size>5*1024*1024)throw Error('Please choose a file smaller than 5 MB.');}
