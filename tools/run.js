// Helper: node run.js <json-file>
// Reads command from a JSON file and sends to server.js on port 3333
const http = require('http');
const fs = require('fs');
const file = process.argv[2];
const cmd = JSON.parse(fs.readFileSync(file, 'utf8'));
const r = http.request({hostname:'127.0.0.1', port:Number(process.env.PORT)||3333, method:'POST', headers:{'Content-Type':'application/json'}}, res => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>console.log(d));
});
r.on('error', e => { console.error(JSON.stringify({ok:false,error:e.message})); process.exit(1); });
r.write(JSON.stringify(cmd));
r.end();
