// batch.js — Execute multiple commands sequentially against server.js
// Usage: node batch.js commands.json
// commands.json = array of command objects
const http = require('http');
const fs = require('fs');

const commands = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const results = [];

function send(cmd) {
  return new Promise((resolve, reject) => {
    const r = http.request({hostname:'127.0.0.1', port:3333, method:'POST', headers:{'Content-Type':'application/json'}}, res => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=> {
        try { resolve(JSON.parse(d)); } catch(e) { resolve({ok:false, raw:d}); }
      });
    });
    r.on('error', e => resolve({ok:false, error:e.message}));
    r.write(JSON.stringify(cmd));
    r.end();
  });
}

async function run() {
  for (const cmd of commands) {
    const result = await send(cmd);
    results.push({cmd: cmd.action, ...result});
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
