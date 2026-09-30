// Rendering parser only. Server-side parsing and verification remain authoritative.
export function parseTable(text, filename) {
  if(filename.endsWith('.json')){const p=JSON.parse(text),records=Array.isArray(p)?p:p.records;if(!Array.isArray(records))throw new Error('Not a JSON table');const columns=[...new Set(records.flatMap(Object.keys))];return {columns,rows:records.map(r=>columns.map(c=>String(r[c]??'')))};}
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted && text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted && ch===','){row.push(cell);cell='';}else if(!quoted && (ch==='\n'||ch==='\r')){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=ch;}
  if(quoted)throw new Error('Malformed CSV');if(cell || row.length){row.push(cell);rows.push(row);}return {columns:rows.shift() || [],rows};
}