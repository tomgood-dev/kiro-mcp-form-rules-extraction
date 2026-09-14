// Apply-flow depth probe. Reaches Client Summary -> Duty of Disclosure (confirmed helpers), then
// attempts to progress PAST DoD and reports each screen it reaches + visible controls/errors, so we
// know which Apply-flow deferrals (occupation / navigation URE / multi-lives client-summary) are now
// testable. Bounded, error-swept, no hang.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
function snap(page,label){return page.evaluate((l)=>{function vis(e){return e&&e.offsetParent!==null;}
  const body=(document.body.innerText||'');
  const heads=[...document.querySelectorAll('h1,h2,h3,[class*="title"],[class*="Title"],[class*="heading"]')].filter(vis).map((e)=>(e.innerText||'').trim()).filter(Boolean).slice(0,8);
  const btns=[...document.querySelectorAll('button,a')].filter(vis).map((b)=>(b.innerText||'').replace(/\s+/g,' ').trim()).filter(Boolean).filter((t)=>t.length<40).slice(0,25);
  const errs=[...document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')].filter(vis).map((e)=>(e.innerText||'').replace(/\s+/g,' ').trim()).filter((t)=>t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t));
  const markers={dutyOfDisclosure:/duty of disclosure/i.test(body),clientSummary:/client summary/i.test(body),personalStatement:/personal statement/i.test(body),occupation:/occupation/i.test(body)&&/employer|income/i.test(body),income:/income/i.test(body),ure:/underwriting|questionnaire/i.test(body)};
  return {step:l,url:location.pathname+location.search,heads,markers,errors:[...new Set(errs)],buttons:[...new Set(btns)]};},label);}
async function settle(page,ms=3000){await page.waitForTimeout(ms);}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';const out=[];const log=(m)=>{console.log(JSON.stringify(m));out.push(m);};
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{const q=await H.reachApplicationFlow(p,{cover:'Life',sumInsured:'500000'});log(await snap(q,'after reachApplicationFlow (expect Client Summary)'));
   const cs=await H.proceedThroughClientSummary(q,{});log(Object.assign(await snap(q,'after proceedThroughClientSummary'),{reachedDoD:cs.reachedDoD}));
   // Attempt to progress PAST Duty of Disclosure: find a Yes/agree + Continue/Next control.
   await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     // click any Yes / I agree / acknowledge, then a Next/Continue/Proceed
     const yes=[...document.querySelectorAll('button,.button-group-item,label,a')].filter(vis).find((b)=>/^(yes|i agree|agree|acknowledge)$/i.test((b.innerText||'').trim()));if(yes)yes.click();});
   await settle(q,1500);
   await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}const nx=[...document.querySelectorAll('button,a')].filter(vis).find((b)=>/^(next|continue|proceed|save and continue)/i.test((b.innerText||'').trim()));if(nx)nx.click();});
   await settle(q,4000);
   log(await snap(q,'after attempting to progress past DoD'));
   // Walk Next through the wizard, recording each screen (max 10 steps or until no progress / payment).
   let lastUrl='';
   for(let i=0;i<10;i++){
     const cur=await q.evaluate(()=>location.pathname);
     if(cur===lastUrl){ // no nav happened; try filling any required then Next again once
       await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
         [...document.querySelectorAll('.button-group-item,button')].filter(vis).filter((b)=>/^(no|male)$/i.test((b.innerText||'').trim())).slice(0,6).forEach((b)=>b.click());});
       await settle(q,800);
     }
     lastUrl=cur;
     await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}const nx=[...document.querySelectorAll('button,a')].filter(vis).find((b)=>/^(next|continue|proceed|save and continue)/i.test((b.innerText||'').trim()));if(nx)nx.click();});
     await settle(q,3500);
     const s=await snap(q,'wizard step '+(i+1));
     log(s);
     if(/payment|submit/i.test(JSON.stringify(s.markers))||s.url===cur)break;
   }
   fs.writeFileSync(path.join(__dirname,'probe-applyflow-depth-result.json'),JSON.stringify(out,null,2));console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);fs.writeFileSync(path.join(__dirname,'probe-applyflow-depth-result.json'),JSON.stringify(out,null,2));}finally{await browser.close();}})();
