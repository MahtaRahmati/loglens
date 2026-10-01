import {parseCSV} from './csv.js';
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function apacheTime(s){const m=s.match(/^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/);if(!m||!months.includes(m[2]))return null;const offset=(Number(m[8])*60+Number(m[9]))*(m[7]==='+'?1:-1);return new Date(Date.UTC(+m[3],months.indexOf(m[2]),+m[1],+m[4],+m[5]-offset,+m[6])).toISOString();}
export function parseLogs(text){
  const apache=/^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) ([^ ]+) [^"]+" (\d{3}) (\d+|-)(?: .*)?$/;
  const first=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/)[0];let records;
  if(apache.test(first)||first.includes(' [')&&first.includes('] "'))records=text.trim().split(/\r?\n/).filter(Boolean).map(line=>{const m=line.match(apache);return m?{timestamp:apacheTime(m[2]),ip:m[1],method:m[3],path:m[4],status:Number(m[5]),bytes:m[6]==='-'?0:Number(m[6])}:null;});
  else{
    const {headers,rows}=parseCSV(text);const aliases={timestamp:['timestamp','time','datetime','date'],ip:['ip','client_ip','remote_addr'],status:['status','status_code','code'],path:['path','url','endpoint'],method:['method','request_method'],bytes:['bytes','size','response_bytes']};const columns=Object.fromEntries(Object.entries(aliases).map(([key,names])=>[key,headers.find(h=>names.includes(h.toLowerCase()))]));
    for(const key of ['timestamp','ip','status','path'])if(!columns[key])throw Error(`Missing ${key} column. Use timestamp, ip, method, path, status, bytes.`);
    records=rows.map(row=>({timestamp:row[columns.timestamp],ip:row[columns.ip],status:Number(row[columns.status]),path:row[columns.path],method:(row[columns.method]||'GET').toUpperCase(),bytes:columns.bytes?Number(row[columns.bytes]||0):0}));
  }
  const rows=[];let skipped=0;
  for(const r of records){if(!r||!r.timestamp||!Number.isFinite(Date.parse(r.timestamp))||!r.ip||!r.path||!Number.isInteger(r.status)||r.status<100||r.status>599||!Number.isFinite(r.bytes)||r.bytes<0){skipped++;continue;}rows.push({...r,timestamp:new Date(r.timestamp).toISOString()});}
  if(!rows.length)throw Error('No valid log records found. Check the timestamp, IP, path, status, and bytes fields.');
  return {rows,skipped};
}
export function countBy(rows,key){const counts=new Map();rows.forEach(r=>{const value=typeof key==='function'?key(r):r[key];counts.set(String(value),(counts.get(String(value))||0)+1);});return [...counts].sort((a,b)=>b[1]-a[1]);}
export function analyze(rows){const errors=rows.filter(r=>r.status>=400),perIP=countBy(rows,'ip'),perMinute=countBy(rows,r=>r.timestamp.slice(0,16));const signals=[];
  const ipGroups=new Map();for(const r of rows){if(!ipGroups.has(r.ip))ipGroups.set(r.ip,[]);ipGroups.get(r.ip).push(r);}
  for(const [ip,list] of ipGroups){const errors=list.filter(r=>r.status>=400).length;const bursts=countBy(list,r=>r.timestamp.slice(0,16));if(errors>=3&&errors/list.length>=.5)signals.push({ip,kind:'Elevated errors',detail:`${errors} of ${list.length} requests returned 4xx or 5xx.`});if(bursts[0]?.[1]>=20)signals.push({ip,kind:'Request burst',detail:`${bursts[0][1]} requests in one UTC minute.`});const paths=new Set(list.filter(r=>r.status===404).map(r=>r.path));if(paths.size>=4)signals.push({ip,kind:'Repeated missing paths',detail:`${paths.size} different paths returned 404.`});}
  return {total:rows.length,errors:errors.length,errorRate:rows.length?errors.length/rows.length*100:0,uniqueIPs:perIP.length,bytes:rows.reduce((n,r)=>n+r.bytes,0),perIP,status:countBy(rows,r=>`${Math.floor(r.status/100)}xx`),traffic:perMinute.toSorted((a,b)=>a[0].localeCompare(b[0])),signals};
}
export const demoLogs=`timestamp,ip,method,path,status,bytes\n`+Array.from({length:96},(_,i)=>`${new Date(Date.UTC(2026,8,28,9,Math.floor(i/12),i%12*5)).toISOString()},${i%6===0?'192.0.2.48':i%4===0?'198.51.100.7':`203.0.113.${10+i%5}`},GET,${i%6===0?['/admin','/.env','/wp-login','/config','/backup'][i%5]:['/api/courses','/','/assets/app.js'][i%3]},${i%6===0?404:i%13===0?500:200},${i%6===0?128:1240+i*30}`).join('\n');
