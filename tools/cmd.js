// Quick command sender: node cmd.js '{"action":"state"}'
const http = require('http');
const cmd = JSON.parse(process.argv[2]);
const r = http.request({hostname:'127.0.0.1',port:3333,method:'POST',headers:{'Content-Type':'application/json'}}, res => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>console.log(d));
});
r.write(JSON.stringify(cmd));
r.end();
