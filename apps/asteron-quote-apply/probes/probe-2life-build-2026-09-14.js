// Diagnose the 2-life build. After each step, report: lives present, which is active, life-2 field
// values, and any error. Determines why multi-life Apply stays on the quote screen.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
function state(page,label){return page.evaluate((l)=>{function vis(e){return e&&e.offsetParent!==null;}
  const body=document.body.innerText||'';
  // life tabs / sections
  const lifeTabs=[...document.querySelectorAll('*')].filter(vis).map((e)=>(e.innerText||'').trim()).filter((t)=>/^Life \d$/.test(t));
  const addLife=[...document.querySelectorAll('button,a')].filter(vis).map((b)=>(b.innerText||'').replace(/\s+/g,' ').trim()).filter((t)=>/add life/i.test(t));
  const applyBtn=[...document.querySelectorAll('button')].filter(vis).filter((b)=>/^apply$/i.test((b.innerText||'').trim())).map((b)=>({disabled:b.disabled}));
  // count key inputs across the whole form
  const firstNames=[...document.querySelectorAll('input[id*="Input_FirstName"]')].filter(vis).map((i)=>({id:i.id.slice(-40),v:i.value}));
  const incomes=[...document.querySelectorAll('input[id*="AnnualIncome"]')].filter(vis).map((i)=>({id:i.id.slice(-40),v:i.value}));
  const dobs=[...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter(vis).map((i)=>({id:i.id.slice(-45),v:i.value}));
  const errs=[...document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')].filter(vis).map((e)=>(e.innerText||'').replace(/\s+/g,' ').trim()).filter((t)=>t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t));
  return {step:l,lifeTabs:[...new Set(lifeTabs)],addLife,applyBtn,firstNames,incomes,dobs,errors:[...new Set(errs)]};},label);}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';const out=[];const log=(m)=>{console.log(JSON.stringify(m));out.push(m);};
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{const q=await H.openNewQuote(p);
   await H.completePersonalDetailsForApply(q,{firstName:'Alpha',lastName:'One',income:120000});
   await H.activateCover(q,'Life');await H.fillCalcMask(H.sumInsuredInput(q,0),'500000');await q.waitForTimeout(1500);
   log(await state(q,'life1 ready'));
   // Click Add life
   await q.evaluate(()=>{const b=[...document.querySelectorAll('button,a')].find((x)=>x.offsetParent!==null&&/add life/i.test((x.innerText||'').trim()));if(b)b.click();});
   await q.waitForTimeout(3000);
   log(await state(q,'after Add life'));
   // Fully complete Life 2 (now the active/blank life)
   await H.completePersonalDetailsForApply(q,{firstName:'Beta',lastName:'Two',income:120000}).catch((e)=>log({l2pd:e.message}));
   // Life 2 fields race the Add-life re-render — explicitly ensure Gender + DOB landed (retry).
   for(let p=0;p<4;p++){
     const need=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
       const dob=[...document.querySelectorAll('input[type="date"][id*="b15-Input_BirthDate"]')].filter(vis)[0];
       const genderSet=[...document.querySelectorAll('.button-group-selected-item,[class*="selected"]')].filter(vis).some((e)=>/male|female/i.test((e.innerText||'').trim()));
       return {dobEmpty:!(dob&&dob.value),genderUnset:!genderSet};});
     if(!need.dobEmpty&&!need.genderUnset)break;
     await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
       // set gender Male
       const g=[...document.querySelectorAll('.button-group-item,button')].filter(vis).find((b)=>/^Male$/.test((b.innerText||'').trim()));if(g)g.click();});
     await q.locator('input[type="date"][id*="b15-Input_BirthDate"]').first().fill('1985-06-15').catch(()=>{});
     await q.locator('body').click({position:{x:5,y:5}}).catch(()=>{});
     await q.waitForTimeout(1000);
   }
   await H.activateCover(q,'Life').catch((e)=>log({l2cover:e.message}));
   await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000').catch((e)=>log({l2si:e.message}));
   await q.waitForTimeout(2500);
   const l2=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}const dob=[...document.querySelectorAll('input[type="date"][id*="b15-Input_BirthDate"]')].filter(vis)[0];const errs=[...document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')].filter(vis).map((e)=>(e.innerText||'').replace(/\s+/g,' ').trim()).filter((t)=>t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t));const prem=(document.body.innerText||'').match(/Total Yearly Premium[\s\S]{0,40}?(\$[\d,]+\.\d{2})/i);return {dob:dob&&dob.value,errs:[...new Set(errs)],yearly:prem?prem[1]:null};});
   log({life2Ready:l2});
   log(await state(q,'life2 completed'));
   // open the Adviser Use popup and inspect its buttons + commission dropdowns (find the OK control)
   await q.evaluate(()=>{const b=[...document.querySelectorAll('button')].find((e)=>e.offsetParent!==null&&(e.innerText||'').trim()==='Adviser Use');if(b)b.click();});
   await q.waitForTimeout(2500);
   const popup=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     const modal=[...document.querySelectorAll('[class*="modal"],[class*="Modal"],[class*="popup"],[class*="Popup"],[role="dialog"]')].filter(vis).pop();
     const scope=modal||document.body;
     const btns=[...scope.querySelectorAll('button,a')].filter(vis).map((b)=>({t:(b.innerText||'').replace(/\s+/g,' ').trim().slice(0,20),cls:String(b.className).slice(0,30)}));
     const commDds=[...scope.querySelectorAll('select')].filter(vis).map((s)=>({cur:(s.options[s.selectedIndex]||{}).text,opts:[...s.options].map((o)=>o.text.trim()).slice(0,4)}));
     return {hasModal:!!modal,buttons:btns,commissionDropdowns:commDds};});
   log({adviserPopup:popup});
   // close popup if open, then run the real helper path + Apply
   await q.evaluate(()=>{const c=[...document.querySelectorAll('button')].find((b)=>b.offsetParent!==null&&/^cancel$/i.test((b.innerText||'').trim()));if(c)c.click();}).catch(()=>{});
   await q.waitForTimeout(1500);
   await H.fillAdviserUse(q,'Upfront').catch((e)=>log({adviserErr:e.message}));
   await q.waitForTimeout(1500);
   const ap=await H.clickApplyNow(q);log({applyProgressed:ap.progressed,applyErrors:ap.errors});
   await q.waitForTimeout(3000);
   const after=await q.evaluate(()=>({onCS:/client summary/i.test(document.body.innerText||''),url:location.pathname}));
   log({afterApply:after});
   fs.writeFileSync(path.join(__dirname,'probe-2life-build-result.json'),JSON.stringify(out,null,2));console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);fs.writeFileSync(path.join(__dirname,'probe-2life-build-result.json'),JSON.stringify(out,null,2));}finally{await browser.close();}})();
