// Fill Personal Details required fields and progress PAST it. Reports the screen reached after Next.
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
   await occ(q);
   await H.activateCover(q,'Life'); await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000'); await settle(q,1500);
   await H.fillAdviserUse(q,'Upfront').catch(()=>{});
   await H.clickApplyNow(q); await settle(q,3000);
   if(!(await q.evaluate(()=>/client summary/i.test(document.body.innerText||'')))){await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return x.offsetParent!==null&&(x.innerText||'').trim()==='Apply';});if(b)b.click();}); await settle(q,8000);}
   await H.proceedThroughClientSummary(q,{}).catch(()=>{}); await settle(q,2000);
   await q.evaluate(()=>{var y=[].slice.call(document.querySelectorAll('button,.button-group-item,label')).find(function(b){return b.offsetParent!==null&&/^(yes|i agree|agree)$/i.test((b.innerText||'').trim());});if(y)y.click();}); await settle(q,800);
   await q.evaluate(()=>{var n=[].slice.call(document.querySelectorAll('button,a')).find(function(b){return b.offsetParent!==null&&/^(next|continue)/i.test((b.innerText||'').trim());});if(n)n.click();}); await settle(q,4000);
   log({onPD:await q.evaluate(()=>/personal details/i.test(document.body.innerText||''))});
   // Fill required Personal Details fields
   await q.evaluate(()=>{var t=document.getElementById('b5-Dropdown_Title'); if(t){var o=[].slice.call(t.options).find(function(o){return /^(mr|ms|mrs)$/i.test(o.text.trim());})||t.options[1]; t.value=o.value; t.dispatchEvent(new Event('change',{bubbles:true}));}});
   await settle(q,800);
   // Smoking button-group -> No (first Yes/No pair), and any other Yes/No -> No
   await q.evaluate(()=>{[].slice.call(document.querySelectorAll('button.button-group-item, .button-group-item')).filter(function(b){return b.offsetParent!==null&&/^No$/.test((b.innerText||'').trim());}).forEach(function(b){b.click();});});
   await settle(q,800);
   // height cm + weight kg (masked) via calcmask helper
   await H.fillCalcMask(q.locator('[id="b5-Input_Cm"]'),'180').catch(()=>{});
   await H.fillCalcMask(q.locator('[id="b5-Input_Kg"]'),'80').catch(()=>{});
   await settle(q,800);
   // mobile + email (plain inputs)
   await q.evaluate(()=>{function set(id,v){var e=document.getElementById(id);if(e){e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}} set('b5-Input_MobileNumber','0211234567'); set('b5-Input_Email','test@example.com');});
   await settle(q,1000);
   // Address lookup — type + pick first suggestion
   await q.evaluate(()=>{var a=document.getElementById('b5-b20-Input_AddressLookup')||document.querySelector('input[id*="AddressLookup"]'); if(a){a.focus();a.value='1 Queen Street';a.dispatchEvent(new Event('input',{bubbles:true}));}});
   await settle(q,2500);
   await q.evaluate(()=>{var o=[].slice.call(document.querySelectorAll('li,[class*="suggestion"],[class*="option"],[role="option"]')).filter(function(x){return x.offsetParent!==null&&/queen|street|auckland|\d/i.test((x.innerText||''));})[0]; if(o)o.click();});
   await settle(q,1500);
   // Fill ANY repeating-list First/Last name fields on this screen (owner/per-life name block).
   await q.evaluate(()=>{function set(e,v){e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}
     [].slice.call(document.querySelectorAll('input[id*="Input_FirstName"]')).filter(function(i){return i.offsetParent!==null&&!i.value;}).forEach(function(f){set(f,'Solo');});
     [].slice.call(document.querySelectorAll('input[id*="Input_LastName"]')).filter(function(i){return i.offsetParent!==null&&!i.value;}).forEach(function(l){set(l,'One');});});
   await settle(q,1200);
   // Now click Next and see where we land
   await q.evaluate(()=>{var n=[].slice.call(document.querySelectorAll('button,a')).find(function(b){return b.offsetParent!==null&&/^(next|continue|save and continue)/i.test((b.innerText||'').trim());});if(n)n.click();});
   await settle(q,5000);
   var after=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}var errs=[].slice.call(document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')).filter(vis).map(function(e){return (e.innerText||'').replace(/\s+/g,' ').trim();}).filter(function(t){return t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t);}); return {url:location.pathname, head:((document.querySelector('h1,h2')||{}).innerText||'').slice(0,40), errs:[...new Set(errs)].slice(0,6)};});
   log({afterPersonalDetailsNext:after});
   fs.writeFileSync(path.join(__dirname,'probe-pd-fill-result.json'),JSON.stringify(after,null,2));
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
