// Multi-life Client Summary probe for MLP-10/AC10 + MLP-19/AC19. Build 2 lives, Apply, read the
// Client Summary structure: per-life name/DOB fields + the per-life Proceed/Start Application control.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';const out=[];const log=(m)=>{console.log(JSON.stringify(m));out.push(m);};
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{
   // Reach the quote screen with a first life priced + Apply-ready
   const q=await H.openNewQuote(p);
   await H.completePersonalDetailsForApply(q,{firstName:'Alpha',lastName:'One',income:120000});
   await H.activateCover(q,'Life');await H.fillCalcMask(H.sumInsuredInput(q,0),'500000');await q.waitForTimeout(1500);
   // Add a 2nd life (Add life control), fill its Apply-mandatory personal details + a cover
   const added=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}const b=[...document.querySelectorAll('button,a')].filter(vis).find((x)=>/add life|add another life|add a life/i.test((x.innerText||'').trim()));if(b){b.click();return b.innerText.trim();}return null;});
   log({addLifeControl:added});
   await q.waitForTimeout(2500);
   // Fill life 2 personal details (best-effort via helper on the now-active life) + cover
   await H.completePersonalDetailsForApply(q,{firstName:'Beta',lastName:'Two',income:120000}).catch((e)=>log({life2pd:e.message}));
   await H.activateCover(q,'Life').catch(()=>{});
   await H.fillCalcMask(H.sumInsuredInput(q,0),'500000').catch(()=>{});
   await q.waitForTimeout(1500);
   await H.fillAdviserUse(q,'Upfront').catch((e)=>log({adviser:e.message}));
   const ap=await H.clickApplyNow(q);log({apply:ap.progressed,errors:ap.errors});
   await q.waitForTimeout(3000);
   // Read Client Summary structure
   const cs=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     const body=document.body.innerText||'';
     const proceedBtns=[...document.querySelectorAll('button,a')].filter(vis).filter((b)=>/proceed to application|start application/i.test((b.innerText||'').trim())).map((b)=>(b.innerText||'').trim());
     const lifeSections=(body.match(/Life \d/g)||[]);
     const firstNames=[...document.querySelectorAll('input[id*="FirstName"]')].filter(vis).length;
     const dobs=[...document.querySelectorAll('input[type="date"][id*="BirthDate"]')].filter(vis).length;
     const statuses=(body.match(/PRE APPLICATION|IN PROGRESS|SUBMITTED|NOT STARTED/gi)||[]);
     return {onClientSummary:/client summary/i.test(body),proceedBtns,lifeSectionCount:lifeSections.length,firstNameInputs:firstNames,dobInputs:dobs,statuses};});
   log({clientSummary:cs});
   fs.writeFileSync(path.join(__dirname,'probe-multilife-cs-result.json'),JSON.stringify(out,null,2));console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);fs.writeFileSync(path.join(__dirname,'probe-multilife-cs-result.json'),JSON.stringify(out,null,2));}finally{await browser.close();}})();
