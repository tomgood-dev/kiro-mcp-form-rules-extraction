// MLP-11 probe: at the multi-life Client Summary, does clicking "Proceed to application" on Life 1
// proceed for Life 1 ONLY (Life 2 stays PRE APPLICATION)? Reuses the proven build. Error-swept.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
const log = (m) => console.log(JSON.stringify(m));
async function settle(p,ms){await p.waitForTimeout(ms);}
// inline copy of the proven build (helper is spec-local)
async function build2(page){
  const q=await H.openNewQuote(page);
  async function occ(){await q.evaluate(()=>{var t=[].slice.call(document.querySelectorAll('.vscomp-toggle-button')).find(function(x){return x.offsetParent!==null&&/select\.\.\./i.test((x.innerText||'').trim());});if(t)t.click();}); await settle(q,1200); await q.evaluate(()=>{var b=document.querySelector('.vscomp-search-input, input[class*="search"]');if(b){b.focus();b.value='Accountant';b.dispatchEvent(new Event('input',{bubbles:true}));}}); await settle(q,1800); await q.evaluate(()=>{var o=[].slice.call(document.querySelectorAll('.vscomp-option')).filter(function(x){return x.offsetParent!==null;})[0];if(o)o.click();}); await settle(q,2000);}
  await H.completePersonalDetailsForApply(q,{firstName:'Alpha',lastName:'One',income:120000});
  await occ();
  await H.activateCover(q,'Life'); await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000'); await settle(q,1500);
  await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('button,a')).find(function(x){return x.offsetParent!==null&&/add life/i.test((x.innerText||'').trim());});if(b)b.click();}); await settle(q,2500);
  await H.completePersonalDetailsForApply(q,{firstName:'Beta',lastName:'Two',income:120000}).catch(()=>{});
  for(let p=0;p<4;p++){var need=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}var d=[].slice.call(document.querySelectorAll('input[type="date"][id*="b15-Input_BirthDate"]')).filter(vis)[0];var g=[].slice.call(document.querySelectorAll('.button-group-selected-item,[class*="selected"]')).filter(vis).some(function(e){return /male|female/i.test((e.innerText||'').trim());});return {d:!(d&&d.value),g:!g};}); if(!need.d&&!need.g)break; await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('.button-group-item,button')).find(function(x){return x.offsetParent!==null&&/^Male$/.test((x.innerText||'').trim());});if(b)b.click();}); await q.locator('input[type="date"][id*="b15-Input_BirthDate"]').first().fill('1985-06-15').catch(()=>{}); await q.locator('body').click({position:{x:5,y:5}}).catch(()=>{}); await settle(q,1000);}
  await occ();
  await H.activateCover(q,'Life').catch(()=>{});
  for(let p=0;p<4;p++){await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000').catch(()=>{});await settle(q,2500);var pr=await q.evaluate(()=>{var m=(document.body.innerText||'').match(/Total Yearly Premium[\s\S]{0,40}?(\$[\d,]+\.\d{2})/i);return m?m[1]:'$0.00';});if(pr!=='$0.00')break;}
  await q.evaluate(()=>{var t=[].slice.call(document.querySelectorAll('*')).find(function(e){return e.offsetParent!==null&&(e.innerText||'').trim()==='Life 1';});if(t)t.click();}); await settle(q,2000); await occ();
  return q;
}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{const q=await build2(p);
   await H.fillAdviserUse(q,'Upfront').catch(()=>{});
   await H.clickApplyNow(q); await settle(q,4000);
   // ensure on CS (may need a 2nd Apply click after gate clears)
   var onCS=await q.evaluate(()=>/client summary/i.test(document.body.innerText||''));
   if(!onCS){await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return x.offsetParent!==null&&(x.innerText||'').trim()==='Apply';});if(b)b.click();}); await settle(q,8000);}
   // Client Summary structure BEFORE proceeding
   var before=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}var proceeds=[].slice.call(document.querySelectorAll('button,a')).filter(function(b){return vis(b)&&/proceed to application/i.test((b.innerText||'').trim());});var statuses=(document.body.innerText||'').match(/PRE APPLICATION|IN PROGRESS|SUBMITTED|NOT STARTED/gi)||[];return {onCS:/client summary/i.test(document.body.innerText||''),proceedCount:proceeds.length,statuses:statuses};});
   log({beforeProceed:before});
   // Fill EVERY per-life First/Last name on the Client Summary (repeating list l1-NNNN_i-...).
   // Life 1 (_0) names default empty and block its Proceed.
   await q.evaluate(()=>{function set(e,v){e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}
     [].slice.call(document.querySelectorAll('input[id*="Input_FirstName"]')).filter(function(i){return i.offsetParent!==null;}).forEach(function(f,idx){set(f,'Client'+(idx+1));});
     [].slice.call(document.querySelectorAll('input[id*="Input_LastName"]')).filter(function(i){return i.offsetParent!==null;}).forEach(function(l){set(l,'Test');});});
   await settle(q,2000);
   var namesNow=await q.evaluate(()=>[].slice.call(document.querySelectorAll('input[id*="Input_FirstName"],input[id*="Input_LastName"]')).filter(function(i){return i.offsetParent!==null;}).map(function(i){return i.value;}));
   log({clientSummaryNames:namesNow});
   // Click Life 1's Proceed (first one)
   await q.getByRole('button',{name:/proceed to application/i}).first().click({timeout:10000}).catch((e)=>log({proceedClickErr:e.message}));
   await settle(q,6000);
   var after=await q.evaluate(()=>{return {url:location.pathname, onDoD:/duty of disclosure/i.test(document.body.innerText||''), onPD:/personal details/i.test(document.body.innerText||''), statuses:(document.body.innerText||'').match(/PRE APPLICATION|IN PROGRESS|SUBMITTED|NOT STARTED/gi)||[], body:(document.body.innerText||'').slice(0,80)};});
   log({afterProceedLife1:after});
   // Dump Client Summary structure to see what's blocking the per-life Proceed
   var struct=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     var inputs=[].slice.call(document.querySelectorAll('input,select')).filter(vis).map(function(e){return {id:(e.id||'').slice(-30), tag:e.tagName, type:e.type||'', val:e.tagName==='SELECT'?((e.options[e.selectedIndex]||{}).text||''):e.value, req:e.required||e.getAttribute('aria-required')==='true'};}).filter(function(f){return f.req || f.tag==='SELECT' || /name|birth|email|phone/i.test(f.id);});
     var errs=[].slice.call(document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')).filter(vis).map(function(e){return (e.innerText||'').replace(/\s+/g,' ').trim();}).filter(function(t){return t&&t.toLowerCase()!=='remove';});
     return {inputs:inputs.slice(0,20), errs:[...new Set(errs)]};});
   log({clientSummaryStruct:struct});
   fs.writeFileSync(path.join(__dirname,'probe-mlp11-result.json'),JSON.stringify({before,after},null,2));
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
