// Reach Personal Details (single life) and DUMP every field so I can fill it to progress past it.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
const log = (m) => console.log(JSON.stringify(m));
async function settle(p,ms){await p.waitForTimeout(ms);}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{
   var q=await H.openNewQuote(p);
   await H.completePersonalDetailsForApply(q,{firstName:'Solo',lastName:'One',income:120000});
   await q.evaluate(()=>{var t=[].slice.call(document.querySelectorAll('.vscomp-toggle-button')).find(function(x){return x.offsetParent!==null&&/select\.\.\./i.test((x.innerText||'').trim());});if(t)t.click();}); await settle(q,1200); await q.evaluate(()=>{var b=document.querySelector('.vscomp-search-input, input[class*="search"]');if(b){b.focus();b.value='Accountant';b.dispatchEvent(new Event('input',{bubbles:true}));}}); await settle(q,1800); await q.evaluate(()=>{var o=[].slice.call(document.querySelectorAll('.vscomp-option')).filter(function(x){return x.offsetParent!==null;})[0];if(o)o.click();}); await settle(q,2000);
   await H.activateCover(q,'Life'); await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000'); await settle(q,1500);
   await H.fillAdviserUse(q,'Upfront').catch(()=>{});
   await H.clickApplyNow(q); await settle(q,3000);
   if(!(await q.evaluate(()=>/client summary/i.test(document.body.innerText||'')))){await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return x.offsetParent!==null&&(x.innerText||'').trim()==='Apply';});if(b)b.click();}); await settle(q,8000);}
   await H.proceedThroughClientSummary(q,{}).catch(()=>{});
   await settle(q,2000);
   // Accept DoD -> go to Personal Details
   await q.evaluate(()=>{var y=[].slice.call(document.querySelectorAll('button,.button-group-item,label')).find(function(b){return b.offsetParent!==null&&/^(yes|i agree|agree)$/i.test((b.innerText||'').trim());});if(y)y.click();}); await settle(q,800);
   await q.evaluate(()=>{var n=[].slice.call(document.querySelectorAll('button,a')).find(function(b){return b.offsetParent!==null&&/^(next|continue)/i.test((b.innerText||'').trim());});if(n)n.click();}); await settle(q,4000);
   log({onPD:await q.evaluate(()=>/personal details/i.test(document.body.innerText||''))});
   // DUMP every visible field on Personal Details
   var fields=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     return [].slice.call(document.querySelectorAll('input,select,textarea,.vscomp-toggle-button,.button-group-item')).filter(vis).map(function(e){
       var isVs=/vscomp/.test(e.className||''); var isBg=/button-group/.test(e.className||'');
       return {tag:e.tagName, id:(e.id||'').slice(-32), type:e.type||'', val:(e.tagName==='SELECT'?((e.options[e.selectedIndex]||{}).text||''):(isVs||isBg?(e.innerText||'').trim().slice(0,20):e.value)), req:e.required||e.getAttribute('aria-required')==='true', kind:isVs?'vscomp':(isBg?'btngroup':'')};
     }).filter(function(f){return f.req || f.kind || f.tag==='SELECT' || (f.tag==='INPUT'&&!f.val);}).slice(0,40);});
   log({personalDetailsFields:fields});
   fs.writeFileSync(path.join(__dirname,'probe-pd-fields-result.json'),JSON.stringify(fields,null,2));
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
