// Decisive 2-life Apply-readiness check. Builds 2 lives, then reports each precondition crisply
// so the exact blocker is unambiguous, then Applies. Uses the spec's own buildTwoLifeApplyReady is
// not importable; replicate the proven sequence here with per-step verification.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
const log = (m) => console.log(JSON.stringify(m));
async function stable(page,ms=8000){const s=Date.now();let last=null,c=0;while(Date.now()-s<ms){const sig=await page.evaluate(()=>((document.body.innerText||'').match(/\$[\d,]+\.\d{2}/g)||[]).join('|'));if(sig===last){if(++c>=2)return sig;}else{c=0;last=sig;}await page.waitForTimeout(400);}return last;}
async function ensureLifeReady(q,name){
  // fill personal details; then verify gender+dob landed (retry); then SI via calcmask verify premium>0
  await H.completePersonalDetailsForApply(q,{firstName:name,lastName:'Test',income:120000}).catch(()=>{});
  for(let p=0;p<5;p++){
    const need=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
      const dob=[...document.querySelectorAll('input[type="date"][id*="b15-Input_BirthDate"]')].filter(vis)[0];
      const g=[...document.querySelectorAll('.button-group-selected-item,[class*="selected"]')].filter(vis).some((e)=>/male|female/i.test((e.innerText||'').trim()));
      return {dobEmpty:!(dob&&dob.value),gUnset:!g};});
    if(!need.dobEmpty&&!need.gUnset)break;
    await q.evaluate(()=>{const b=[...document.querySelectorAll('.button-group-item,button')].find((x)=>x.offsetParent!==null&&/^Male$/.test((x.innerText||'').trim()));if(b)b.click();});
    await q.locator('input[type="date"][id*="b15-Input_BirthDate"]').first().fill('1985-06-15').catch(()=>{});
    await q.locator('body').click({position:{x:5,y:5}}).catch(()=>{});
    await q.waitForTimeout(800);
  }
  await H.activateCover(q,'Life').catch(()=>{});
  for(let p=0;p<5;p++){
    await H.fillCalcMask(H.sumInsuredInput(q,0),'1000000').catch(()=>{});
    await stable(q);
    const y=await q.evaluate(()=>{const m=(document.body.innerText||'').match(/Total Yearly Premium[\s\S]{0,40}?(\$[\d,]+\.\d{2})/i);return m?m[1]:'$0.00';});
    if(y&&y!=='$0.00')return y;
  }
  return '$0.00';
}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const p=await ctx.newPage();
 try{const q=await H.openNewQuote(p);
   const y1=await ensureLifeReady(q,'Alpha');log({life1Premium:y1});
   await q.evaluate(()=>{const b=[...document.querySelectorAll('button,a')].find((x)=>x.offsetParent!==null&&/add life/i.test((x.innerText||'').trim()));if(b)b.click();});
   await q.waitForTimeout(2500);
   const y2=await ensureLifeReady(q,'Beta');log({life2Premium:y2});
   // fill adviser use
   await H.fillAdviserUse(q,'Upfront').catch((e)=>log({adviserErr:e.message}));
   await q.waitForTimeout(1500);
   // PRECONDITION REPORT before Apply
   const pre=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     function comm(s){const o=[...s.options].map((x)=>x.text.trim());return o.includes('Upfront')&&o.includes('Level 30')&&o.includes('Spread 20');}
     const unsetComm=[...document.querySelectorAll('select')].filter(vis).filter(comm).filter((s)=>/please select/i.test((s.options[s.selectedIndex]||{}).text||'')).length;
     const errs=[...document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger')].filter(vis).map((e)=>(e.innerText||'').replace(/\s+/g,' ').trim()).filter((t)=>t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t));
     const lives=[...new Set([...document.querySelectorAll('*')].filter(vis).map((e)=>(e.innerText||'').trim()).filter((t)=>/^Life \d$/.test(t)))];
     return {lives,unsetCommissionDropdowns:unsetComm,errors:[...new Set(errs)]};});
   log({preApply:pre});
   // Inspect the Apply control(s) present in the 2-life view before clicking.
   const applyControls=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}
     return [...document.querySelectorAll('button,a')].filter(vis).filter((b)=>/apply/i.test((b.innerText||'').trim())).map((b)=>({t:(b.innerText||'').replace(/\s+/g,' ').trim().slice(0,25),tag:b.tagName,disabled:b.disabled,cls:String(b.className).slice(0,30)}));});
   log({applyControls});
   // Click the exact Apply button and watch the URL + any navigation for 8s.
   const before=await q.evaluate(()=>location.href);
   await q.getByRole('button',{name:'Apply',exact:true}).click({timeout:8000}).catch((e)=>log({applyClickErr:e.message}));
   await q.waitForTimeout(8000);
   const after=await q.evaluate(()=>({href:location.href,onCS:/client summary/i.test(document.body.innerText||''),bodyLen:(document.body.innerText||'').length}));
   log({urlBefore:before.slice(-30),urlAfter:after.href.slice(-30),onCS:after.onCS});
   const cs=await q.evaluate(()=>({onCS:/client summary/i.test(document.body.innerText||''),proceed:[...document.querySelectorAll('button,a')].filter((b)=>b.offsetParent!==null&&/proceed to application/i.test((b.innerText||'').trim())).length}));
   log({clientSummary:cs});
   console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);}finally{await browser.close();}})();
