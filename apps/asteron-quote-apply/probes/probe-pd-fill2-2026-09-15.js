// Fill Personal Details with the EXACT fields from the dump, drive the address lookup, then Next.
const { chromium } = require('playwright');
const path = require('path');
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
   log({onPD:await q.evaluate(()=>/personal details/i.test(document.body.innerText||''))});
   // Title
   await q.evaluate(()=>{var t=document.getElementById('b5-Dropdown_Title');if(t){var o=[].slice.call(t.options).find(function(o){return /^mr$/i.test(o.text.trim());})||t.options[1];t.value=o.value;t.dispatchEvent(new Event('change',{bubbles:true}));}}); await settle(q,600);
   // Marital status (not req but set anyway)
   await q.evaluate(()=>{var t=document.getElementById('b5-Dropdown_MaritalStatus');if(t){t.value=t.options[1].value;t.dispatchEvent(new Event('change',{bubbles:true}));}}); await settle(q,600);
   // Height cm + weight kg via calcmask
   await H.fillCalcMask(q.locator('[id="b5-Input_Cm"]'),'180').catch(()=>{});
   await H.fillCalcMask(q.locator('[id="b5-Input_Kg"]'),'80').catch(()=>{});
   await settle(q,800);
   // Mobile + Email
   await q.evaluate(()=>{function set(id,v){var e=document.getElementById(id);if(e){e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}} set('b5-Input_MobileNumber','0211234567'); set('b5-Input_Email','test@example.com');}); await settle(q,800);
   // Address lookup: type via real keyboard, wait, then DUMP the suggestion structure
   var addr=q.locator('[id="b5-b20-Input_AddressLookup"]');
   await addr.click().catch(()=>{}); await addr.evaluate(e=>e.focus()).catch(()=>{});
   await q.keyboard.type('12 Queen Street Auckland', {delay:80}); await settle(q,3500);
   var suggDump=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     // find containers that appeared near the address input holding option-like children
     var lists=[].slice.call(document.querySelectorAll('ul,[role="listbox"],[class*="dropdown"],[class*="suggest"],[class*="autocomplete"],[class*="results"]')).filter(vis);
     var items=[];
     lists.forEach(function(l){[].slice.call(l.children).forEach(function(c){var t=(c.innerText||'').replace(/\s+/g,' ').trim();if(t&&t.length<60)items.push({tag:c.tagName, cls:String(c.className).slice(0,30), role:c.getAttribute('role')||'', text:t.slice(0,45)});});});
     // also any li/option globally that looks address-y
     [].slice.call(document.querySelectorAll('li,[role="option"]')).filter(vis).forEach(function(c){var t=(c.innerText||'').replace(/\s+/g,' ').trim();if(t&&/\d|street|road|auckland/i.test(t)&&t.length<60)items.push({tag:c.tagName, cls:String(c.className).slice(0,30), role:c.getAttribute('role')||'', text:t.slice(0,45)});});
     return items.slice(0,12);});
   log({addressSuggestions:suggDump});
   // Is there a manual-address-entry alternative near the lookup? + does the lookup show a no-options msg?
   var addrCtx=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     var manual=[].slice.call(document.querySelectorAll('a,button,label')).filter(function(b){return vis(b)&&/manual|enter address|can't find|cannot find|add manually/i.test((b.innerText||''));}).map(function(b){return (b.innerText||'').trim().slice(0,40);});
     var noOpts=/no options to show/i.test(document.body.innerText||'');
     var addrInputs=[].slice.call(document.querySelectorAll('input')).filter(function(i){return vis(i)&&/address|street|suburb|city|postcode|postal/i.test((i.id||'')+(i.placeholder||''));}).map(function(i){return {id:i.id.slice(-30), ph:i.placeholder};});
     return {manualOptions:manual, lookupNoOptions:noOpts, addressInputs:addrInputs};});
   log({addressContext:addrCtx});
   console.log('DONE-ADDR'); await browser.close(); return;
   var after=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}var errs=[].slice.call(document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')).filter(vis).map(function(e){return (e.innerText||'').replace(/\s+/g,' ').trim();}).filter(function(t){return t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t);}); return {url:location.pathname, head:((document.querySelector('h1,h2')||{}).innerText||'').slice(0,40), errs:[...new Set(errs)].slice(0,6)};});
   log({afterNext:after});
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
