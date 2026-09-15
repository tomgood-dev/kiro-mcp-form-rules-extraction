// Get to Personal Details and pass it by filling the NAME fields (all First/Last on screen) + Next.
const { chromium } = require('playwright');
const path = require('path');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
const log = (m) => console.log(JSON.stringify(m));
async function settle(p,ms){await p.waitForTimeout(ms);}
async function occ(q){await q.evaluate(()=>{var t=[].slice.call(document.querySelectorAll('.vscomp-toggle-button')).find(function(x){return x.offsetParent!==null&&/select\.\.\./i.test((x.innerText||'').trim());});if(t)t.click();});await settle(q,1200);await q.evaluate(()=>{var b=document.querySelector('.vscomp-search-input, input[class*="search"]');if(b){b.focus();b.value='Accountant';b.dispatchEvent(new Event('input',{bubbles:true}));}});await settle(q,1800);await q.evaluate(()=>{var o=[].slice.call(document.querySelectorAll('.vscomp-option')).filter(function(x){return x.offsetParent!==null;})[0];if(o)o.click();});await settle(q,2000);}
function fillNames(q){return q.evaluate(()=>{function set(e,v){e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}
  [].slice.call(document.querySelectorAll('input[id*="Input_FirstName"]')).filter(function(i){return i.offsetParent!==null&&!i.value;}).forEach(function(f){set(f,'Solo');});
  [].slice.call(document.querySelectorAll('input[id*="Input_LastName"]')).filter(function(i){return i.offsetParent!==null&&!i.value;}).forEach(function(l){set(l,'One');});
  return {firsts:[].slice.call(document.querySelectorAll('input[id*="Input_FirstName"]')).filter(function(i){return i.offsetParent!==null;}).map(function(i){return i.value;}), lasts:[].slice.call(document.querySelectorAll('input[id*="Input_LastName"]')).filter(function(i){return i.offsetParent!==null;}).map(function(i){return i.value;})};});}
function clickNext(q){return q.evaluate(()=>{var n=[].slice.call(document.querySelectorAll('button,a')).find(function(b){return b.offsetParent!==null&&/^(next|continue|save and continue)/i.test((b.innerText||'').trim());});if(n){n.click();return true;}return false;});}
function whereAmI(q){return q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}var errs=[].slice.call(document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')).filter(vis).map(function(e){return (e.innerText||'').replace(/\s+/g,' ').trim();}).filter(function(t){return t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t);});return {url:location.pathname, errs:[...new Set(errs)].slice(0,6)};});}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{
   var q=await H.openNewQuote(p);
   await H.completePersonalDetailsForApply(q,{firstName:'Solo',lastName:'One',income:120000});
   await occ(q); await H.activateCover(q,'Life'); await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000'); await settle(q,1500);
   await H.fillAdviserUse(q,'Upfront').catch(()=>{}); await H.clickApplyNow(q); await settle(q,3000);
   if(!(await q.evaluate(()=>/client summary/i.test(document.body.innerText||'')))){await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return x.offsetParent!==null&&(x.innerText||'').trim()==='Apply';});if(b)b.click();}); await settle(q,8000);}
   await H.proceedThroughClientSummary(q,{}).catch(()=>{}); await settle(q,2000);
   // Agree DoD + Next -> Personal Details
   await q.evaluate(()=>{var y=[].slice.call(document.querySelectorAll('button,.button-group-item,label')).find(function(b){return b.offsetParent!==null&&/^(yes|i agree|agree)$/i.test((b.innerText||'').trim());});if(y)y.click();}); await settle(q,800);
   await clickNext(q); await settle(q,4000);
   log(Object.assign({step:'reached PD'},await whereAmI(q)));
   // Pass Personal Details by filling name fields + Next, up to 3 tries
   for(var i=0;i<3;i++){
     var names=await fillNames(q); log({fillNames:names});
     await settle(q,1000);
     await clickNext(q); await settle(q,4000);
     var w=await whereAmI(q); log(Object.assign({step:'after Next '+(i+1)},w));
     if(!/PersonalDetails/i.test(w.url)) break;
   }
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
