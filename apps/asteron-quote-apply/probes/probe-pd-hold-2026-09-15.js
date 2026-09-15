// Build to Personal Details, fill everything, then STOP at the address lookup and HOLD the browser
// open so the user can watch. Prints progress; stays alive ~15 min (Ctrl+C / esc to end).
const { chromium } = require('playwright');
const path = require('path');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
async function settle(p,ms){await p.waitForTimeout(ms);}
async function occ(q){await q.evaluate(()=>{var t=[].slice.call(document.querySelectorAll('.vscomp-toggle-button')).find(function(x){return x.offsetParent!==null&&/select\.\.\./i.test((x.innerText||'').trim());});if(t)t.click();});await settle(q,1200);await q.evaluate(()=>{var b=document.querySelector('.vscomp-search-input, input[class*="search"]');if(b){b.focus();b.value='Accountant';b.dispatchEvent(new Event('input',{bubbles:true}));}});await settle(q,1800);await q.evaluate(()=>{var o=[].slice.call(document.querySelectorAll('.vscomp-option')).filter(function(x){return x.offsetParent!==null;})[0];if(o)o.click();});await settle(q,2000);}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{
   console.log('building quote...');
   var q=await H.openNewQuote(p);
   await H.completePersonalDetailsForApply(q,{firstName:'Solo',lastName:'One',income:120000});
   await occ(q); await H.activateCover(q,'Life'); await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000'); await settle(q,1500);
   await H.fillAdviserUse(q,'Upfront').catch(()=>{}); await H.clickApplyNow(q); await settle(q,3000);
   if(!(await q.evaluate(()=>/client summary/i.test(document.body.innerText||'')))){await q.evaluate(()=>{var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return x.offsetParent!==null&&(x.innerText||'').trim()==='Apply';});if(b)b.click();}); await settle(q,8000);}
   console.log('at client summary; proceeding...');
   await H.proceedThroughClientSummary(q,{}).catch(()=>{}); await settle(q,2000);
   await q.evaluate(()=>{var y=[].slice.call(document.querySelectorAll('button,.button-group-item,label')).find(function(b){return b.offsetParent!==null&&/^(yes|i agree|agree)$/i.test((b.innerText||'').trim());});if(y)y.click();}); await settle(q,800);
   await q.evaluate(()=>{var n=[].slice.call(document.querySelectorAll('button,a')).find(function(b){return b.offsetParent!==null&&/^(next|continue)/i.test((b.innerText||'').trim());});if(n)n.click();}); await settle(q,4000);
   console.log('at Personal Details; filling all fields except address...');
   await q.evaluate(()=>{var t=document.getElementById('b5-Dropdown_Title');if(t){var o=[].slice.call(t.options).find(function(o){return /^mr$/i.test(o.text.trim());})||t.options[1];t.value=o.value;t.dispatchEvent(new Event('change',{bubbles:true}));} var m=document.getElementById('b5-Dropdown_MaritalStatus');if(m){m.value=m.options[1].value;m.dispatchEvent(new Event('change',{bubbles:true}));}}); await settle(q,600);
   await q.evaluate(()=>{[].slice.call(document.querySelectorAll('.button-group-item')).filter(function(b){return b.offsetParent!==null&&/^No$/.test((b.innerText||'').trim());}).forEach(function(b){b.click();});}); await settle(q,600);
   await H.fillCalcMask(q.locator('[id="b5-Input_Cm"]'),'180').catch(()=>{});
   await H.fillCalcMask(q.locator('[id="b5-Input_Kg"]'),'80').catch(()=>{});
   await q.evaluate(()=>{function set(id,v){var e=document.getElementById(id);if(e){e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}} set('b5-Input_MobileNumber','0211234567'); set('b5-Input_Email','test@example.com');});
   await settle(q,800);
   // focus the address field so it's obvious on screen, type a query, and LEAVE the suggestions showing
   var addr=q.locator('[id="b5-b20-Input_AddressLookup"]');
   await addr.scrollIntoViewIfNeeded().catch(()=>{}); await addr.click().catch(()=>{});
   await q.keyboard.type('12 Queen Street Auckland', {delay:80});
   console.log('\n>>> PAUSED at the ADDRESS LOOKUP on Personal Details. Watch the address field / suggestions.');
   console.log('>>> Everything else is filled. This is the blocker. Browser stays open ~15 min. <<<\n');
   await settle(q, 900000);
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
