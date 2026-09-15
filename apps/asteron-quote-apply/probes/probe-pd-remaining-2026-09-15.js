// After filling most PD fields, identify what's STILL required/empty (esp. the 'Type to search' typeahead).
// Assumes we can rebuild to PD. Reuses the fill probe's path but ends by dumping remaining-empty-required.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
const log = (m) => console.log(JSON.stringify(m));
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
   // Identify the 'Type to search' typeahead + all empty-required fields with LABELS
   var diag=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     function label(e){var id=e.id;var l=id&&document.querySelector('label[for="'+id+'"]');if(l)return (l.innerText||'').trim().slice(0,30);var n=e.closest('.form-group,[class*="field"],[class*="Field"],li,tr,div');if(n){var t=(n.innerText||'').replace(/\s+/g,' ').trim();return t.slice(0,40);}return '';}
     var typeaheads=[].slice.call(document.querySelectorAll('input')).filter(function(i){return vis(i)&&/type to search|search/i.test((i.placeholder||''));}).map(function(i){return {id:(i.id||'').slice(-30), ph:i.placeholder, val:i.value, label:label(i)};});
     var emptyReq=[].slice.call(document.querySelectorAll('input,select')).filter(function(e){return vis(e)&&(e.required||e.getAttribute('aria-required')==='true');}).filter(function(e){return e.tagName==='SELECT'?/please select|^select|^$/i.test(((e.options[e.selectedIndex]||{}).text||'').trim()):!(e.value&&e.value.trim()&&e.value.trim()!=='.');}).map(function(e){return {id:(e.id||'').slice(-30), tag:e.tagName, label:label(e)};});
     var vscompUnset=[].slice.call(document.querySelectorAll('.vscomp-toggle-button,.vscomp-value')).filter(function(e){return vis(e)&&/select\.\.\.|please select/i.test((e.innerText||'').trim());}).map(function(e){return label(e);});
     return {typeaheads:typeaheads, emptyRequired:emptyReq, vscompUnset:[...new Set(vscompUnset)]};});
   log({diag:diag});
   fs.writeFileSync(path.join(__dirname,'probe-pd-remaining-result.json'),JSON.stringify(diag,null,2));
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
