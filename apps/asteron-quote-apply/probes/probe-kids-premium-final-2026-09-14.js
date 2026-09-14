// Kids AC08/AC09 — bounded, non-blocking. Fixes: (1) BLUR each field after fill (DOB validation
// commits/clears on blur — confirmed by user), (2) correct order, (3) NO waitForTimeout hang: does
// the work, writes result, closes, returns. ~2 min max.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
function sweep(page,label){return page.evaluate((l)=>{function vis(e){return e&&e.offsetParent!==null;}
  const es=[...document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger,[class*="validation"]')].filter(vis).map((e)=>(e.innerText||'').replace(/\s+/g,' ').trim()).filter((t)=>t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t));
  const m=(document.body.innerText||'').match(/Total Yearly Premium[\s\S]{0,40}?(\$[\d,]+\.\d{2})/i);
  const kids=(document.body.innerText||'').split('\n').map((x)=>x.trim()).filter((x)=>/kids/i.test(x)&&/\$\d[\d,]*\.\d{2}/.test(x));
  return {step:l,errors:[...new Set(es)],yearly:m?m[1]:null,kidsPremiumLines:kids};},label);}
async function stable(page,ms=8000){const s=Date.now();let last=null,c=0;while(Date.now()-s<ms){const sig=await page.evaluate(()=>((document.body.innerText||'').match(/\$[\d,]+\.\d{2}/g)||[]).join('|'));if(sig===last){if(++c>=2)return sig;}else{c=0;last=sig;}await page.waitForTimeout(400);}return last;}
// fill a field by id, then BLUR it (click body) so OutSystems commits + clears the transient required error
async function fillBlur(page,id,val){const loc=page.locator(`[id="${id}"]`);await loc.fill(val).catch(()=>{});await loc.evaluate((e)=>{e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}).catch(()=>{});await page.locator('body').click({position:{x:5,y:5}}).catch(()=>{});await page.waitForTimeout(400);}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';const out={sweeps:[]};const log=(m)=>{console.log(JSON.stringify(m));out.sweeps.push(m);};
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const q0=await ctx.newPage();
 try{const q=await H.openNewQuote(q0);await H.setMinimumPersonalDetails(q,{age:40,gender:'Male',occupationCode:'1'});
  await H.activateCover(q,'Life');await H.fillCalcMask(H.sumInsuredInput(q,0),'200000');await stable(q);log(await sweep(q,'life $200k'));
  const numSel=q.locator('select').filter({has:q.locator('option',{hasText:/^0$/})}).filter({has:q.locator('option',{hasText:/^9$/})}).first();await numSel.selectOption('3');await stable(q);
  // kid names (with blur) — all 3
  const nameRows=await q.evaluate(()=>{const fs=[...document.querySelectorAll('input[id*="FirstName"]')].filter((i)=>!/b15-/.test(i.id)).map((i)=>i.id);const ls=[...document.querySelectorAll('input[id*="LastName"],input[id*="Surname"]')].filter((i)=>!/b15-/.test(i.id)).map((i)=>i.id);return {fs,ls};});
  for(let i=0;i<nameRows.fs.length;i++){await fillBlur(q,nameRows.fs[i],'Kid'+(i+1));} for(const id of nameRows.ls){await fillBlur(q,id,'Test');}
  // kid SI via tier dropdown
  const nt=await q.evaluate(()=>{const t=[...document.querySelectorAll('select')].filter((s)=>[...s.options].some((o)=>o.text.includes('$50,000'))&&[...s.options].some((o)=>o.text.trim()==='$200,000'));t.forEach((s,i)=>s.setAttribute('data-kt',String(i)));return t.length;});
  for(let i=0;i<nt;i++){await q.locator(`select[data-kt="${i}"]`).selectOption({label:'$100,000'}).catch(()=>{});}await stable(q);
  // DOB LAST, with blur + landing verify
  for(let p=0;p<4;p++){const ids=await q.evaluate(()=>[...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i)=>i.id.indexOf('b15-Input_BirthDate')===-1).map((i)=>i.id));
    for(const id of ids){await fillBlur(q,id,'2018-06-15');}await stable(q);
    const ok=await q.evaluate(()=>[...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i)=>i.id.indexOf('b15-Input_BirthDate')===-1).every((i)=>i.value==='2018-06-15'));if(ok)break;}
  await stable(q);log(await sweep(q,'FINAL 3 kids @ $100k (blurred)'));
  const panel=await q.evaluate(()=>{const lines=(document.body.innerText||'').split('\n').map((x)=>x.trim()).filter(Boolean);const i=lines.findIndex((l)=>/^Premium$/i.test(l));return i>=0?lines.slice(i,i+25):lines.slice(-25);});
  log({step:'PANEL breakdown',panel});
  fs.writeFileSync(path.join(__dirname,'probe-kids-premium-final-result.json'),JSON.stringify(out,null,2));console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);fs.writeFileSync(path.join(__dirname,'probe-kids-premium-final-result.json'),JSON.stringify(out,null,2));}finally{await browser.close();}})();
