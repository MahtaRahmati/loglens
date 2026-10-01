export function parseCSV(text){
  text=String(text).replace(/^\uFEFF/,'');
  const records=[];let row=[],field='',quoted=false,closed=false;
  const cell=()=>{row.push(field);field='';closed=false;if(row.length>200)throw Error('Maximum: 200 columns.');};
  const record=()=>{cell();if(!(row.length===1&&row[0]===''))records.push(row);row=[];if(records.length>50001)throw Error('Maximum: 50,000 data rows.');};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c===','){cell();continue;}
    if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;record();continue;}
    if(closed){if(c===' '||c==='\t')continue;throw Error('Unexpected character after a quoted CSV field.');}
    if(c==='"'){if(field)throw Error('Quotes must start at the beginning of a field.');quoted=true;continue;}
    field+=c;
  }
  if(quoted)throw Error('Unclosed quoted field in CSV.');
  if(field||row.length||closed)record();
  if(records.length<2)throw Error('Include a header and at least one data row.');
  const headers=records.shift().map(x=>x.trim());
  if(headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('Column names must be nonempty and unique.');
  const rows=records.map((values,i)=>{if(values.length!==headers.length)throw Error(`Row ${i+2} has ${values.length} fields; expected ${headers.length}.`);return Object.fromEntries(headers.map((h,j)=>[h,values[j]]));});
  return {headers,rows};
}
export function toCSV(headers,rows){const encode=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};return [headers.map(encode).join(','),...rows.map(row=>headers.map(h=>encode(row[h])).join(','))].join('\r\n');}
export function numeric(value){const s=String(value??'').trim();return s!==''&&/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)&&Number.isFinite(Number(s))?Number(s):null;}
export function columnProfile(name,rows){const raw=rows.map(r=>r[name]),present=raw.filter(x=>String(x??'').trim()!=='');const numbers=present.map(numeric);const isNumeric=present.length>0&&numbers.every(x=>x!==null);const isDate=present.length>0&&present.every(x=>/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(x)&&Number.isFinite(Date.parse(x)));const counts=new Map();present.forEach(v=>counts.set(v,(counts.get(v)||0)+1));const profile={name,type:isNumeric?'number':isDate?'date':'text',count:rows.length,missing:rows.length-present.length,distinct:counts.size,top:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,8)};
  if(isNumeric){const sorted=numbers.toSorted((a,b)=>a-b),sum=numbers.reduce((a,b)=>a+b,0);Object.assign(profile,{min:sorted[0],max:sorted.at(-1),mean:sum/numbers.length,median:sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2,sum});}
  return profile;
}
export function distribution(profile,rows){if(profile.type!=='number')return profile.top;const nums=rows.map(r=>numeric(r[profile.name])).filter(n=>n!==null);if(profile.min===profile.max)return [[String(profile.min),nums.length]];const count=6,step=(profile.max-profile.min)/count;const bins=Array.from({length:count},(_,i)=>[`${(profile.min+i*step).toFixed(1)}–${(profile.min+(i+1)*step).toFixed(1)}`,0]);nums.forEach(n=>bins[Math.min(count-1,Math.floor((n-profile.min)/step))][1]++);return bins;}
