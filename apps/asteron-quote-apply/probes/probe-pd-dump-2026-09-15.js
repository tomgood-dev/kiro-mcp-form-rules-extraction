// Reach Personal Details and dump EVERY visible field (full id, nearby label text, value, required).
// Read-only — the point is to SEE the real fields, not guess selectors.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
async function settle(p,ms){await p.waitForTimeout(ms);}
async function occ(q){await q.evaluate(()=>{var t=[].slice.call(document.querySelectorAll('.vscomp-toggle-button')).find(function(x){return x.offsetParent!==null&&/select\.\.\./i.test((x.innerText||'').trim());});if(t)t.click();});await settle(q,1200);await q.evaluate(()=>{var b=document.querySelector('.vscomp-search-input, input[class*="search"]');if(b){b.focus();b.value='Accountant';b.dispatchEvent(new Event('input',{bubbles:true}));}});await settle(q,1800);await q.evaluate(()=>{var o=[].slice.call(document.querySelectorAll('.vscomp-option')).filter(function(x){return x.offsetParent!==null;})[0];if(o)o.click();});await settle(q,2000);}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{
   var q=await H.openNewQuote(p);
   await H.completePersonalDetailsForApply(q,{firstName:'Solo',lastName:'One',income:120000});
   await occ(q); await H.activateCover(q,'Life'); await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000'); await settle(q,1500);
   await H.fillAdviserUse(q,'Upfront').catch(()=>{}); await H.clickApplyNow(q); await settle(q,3000);
   if(!(await q.evaluate(()=>/client summary/i.test(document.body.innerText||'')))){await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return x.offsetParent!==null&&(x.innerText||'').trim()==='Apply';});if(b)b.click();}); await settle(q,8000);}
   await H.proceedThroughClientSummary(q,{}).catch(()=>{}); await settle(q,2000);
   await q.evaluate(()=>{var y=[].slice.call(document.querySelectorAll('button,.button-group-item,label')).find(function(b){return b.offsetParent!==null&&/^(yes|i agree|agree)$/i.test((b.innerText||'').trim());});if(y)y.click();}); await settle(q,800);
   await q.evaluate(()=>{var n=[].slice.call(document.querySelectorAll('button,a')).find(function(b){return b.offsetParent!==null&&/^(next|continue)/i.test((b.innerText||'').trim());});if(n)n.click();}); await settle(q,4000);
   // FULL dump of every visible input/select + vscomp with full id + label + value
   var dump=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     function label(e){var id=e.id;if(id){var l=document.querySelector('label[for="'+id+'"]');if(l&&(l.innerText||'').trim())return (l.innerText||'').trim().slice(0,35);}var n=e;for(var d=0;d<4&&n;d++){n=n.parentElement;if(n){var lbl=n.querySelector&&n.querySelector('label');if(lbl&&(lbl.innerText||'').trim())return (lbl.innerText||'').trim().slice(0,35);}}return '';}
     var out=[];
     [].slice.call(document.querySelectorAll('input,select,textarea')).filter(vis).forEach(function(e){ out.push({id:e.id, tag:e.tagName, type:e.type||'', val:(e.tagName==='SELECT'?((e.options[e.selectedIndex]||{}).text||''):e.value), req:e.required||e.getAttribute('aria-required')==='true', ph:e.placeholder||'', label:label(e)}); });
     [].slice.call(document.querySelectorAll('.vscomp-toggle-button')).filter(vis).forEach(function(e){ out.push({id:'(vscomp)', tag:'VSCOMP', val:(e.innerText||'').trim().slice(0,20), label:label(e)}); });
     return out;});
   fs.writeFileSync(path.join(__dirname,'probe-pd-dump.json'),JSON.stringify(dump,null,2));
   console.log('FIELD COUNT: '+dump.length);
   dump.forEach(function(f){ console.log((f.req?'[REQ] ':'      ')+f.tag+' | id='+f.id+' | val="'+(f.val||'')+'" | ph="'+(f.ph||'')+'" | label="'+(f.label||'')+'"'); });
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
