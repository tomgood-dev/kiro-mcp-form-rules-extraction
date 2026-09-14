// FINAL clean determination of AC08/AC09. Kid SI is the tier DROPDOWN (Dropdown1 with $ options) —
// use selectOption on THAT, do NOT write the masked Input_SumInsured (that corrupts). Order: kids ->
// SI dropdown -> DOB (post re-render) -> verify no empty required + no on-screen error -> read premium.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${process.env.PROBE_ACCT || 'a'}.json`);
const H = require('../helpers/quote-helpers');
function sweep(page,label){return page.evaluate((l)=>{function vis(e){return e&&e.offsetParent!==null;}const es=[...document.querySelectorAll('[class*="feedback"],[class*="error"],[role="alert"],.text-danger,[class*="validation"]')].filter(vis).map((e)=>(e.innerText||'').replace(/\s+/g,' ').trim()).filter((t)=>t&&t.toLowerCase()!=='remove'&&!/^(male female|yes no)$/i.test(t));const m=(document.body.innerText||'').match(/Total Yearly Premium[\s\S]{0,40}?(\$[\d,]+\.\d{2})/i);const kids=(document.body.innerText||'').split('\n').map((x)=>x.trim()).filter((x)=>/kids/i.test(x)&&/\$\d[\d,]*\.\d{2}/.test(x));return {step:l,errors:[...new Set(es)],yearly:m?m[1]:null,kidsPremiumLines:kids};},label);}
async function stable(page,ms=10000){const s=Date.now();let last=null,c=0;while(Date.now()-s<ms){const sig=await page.evaluate(()=>((document.body.innerText||'').match(/\$[\d,]+\.\d{2}/g)||[]).join('|'));if(sig===last){if(++c>=2)return sig;}else{c=0;last=sig;}await page.waitForTimeout(400);}return last;}
(async()=>{process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';const out={sweeps:[]};const log=(m)=>{console.log(JSON.stringify(m));out.sweeps.push(m);};
 const browser=await chromium.launch({channel:'msedge',headless:false});const ctx=await browser.newContext({storageState:statePath,ignoreHTTPSErrors:true,baseURL:BASE_URL});const page=await ctx.newPage();
 try{const q=await H.openNewQuote(page);await H.setMinimumPersonalDetails(q,{age:40,gender:'Male',occupationCode:'1'});await H.activateCover(q,'Life');await H.fillCalcMask(H.sumInsuredInput(q,0),'200000');await stable(q);log(await sweep(q,'life'));
  const numSel=q.locator('select').filter({has:q.locator('option',{hasText:/^0$/})}).filter({has:q.locator('option',{hasText:/^9$/})}).first();await numSel.selectOption('2');await stable(q);
  // kid SI tier dropdown = the select with $ options; set to $100,000 (do NOT touch masked Input_SumInsured)
  const nt=await q.evaluate(()=>{const t=[...document.querySelectorAll('select')].filter((s)=>[...s.options].some((o)=>o.text.includes('$50,000'))&&[...s.options].some((o)=>o.text.trim()==='$200,000'));t.forEach((s,i)=>s.setAttribute('data-kt',String(i)));return t.length;});
  for(let i=0;i<nt;i++){await q.locator(`select[data-kt="${i}"]`).selectOption({label:'$100,000'}).catch(()=>{});}await stable(q);log(await sweep(q,'after SI dropdown $100k'));
  // now fill DOBs (post re-render) + names + gender, with landing verification
  for(let pass=0;pass<4;pass++){await q.evaluate(()=>{function si(e,v){if(!e)return;e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();}
    [...document.querySelectorAll('input[id*="FirstName"]')].filter((i)=>!/b15-/.test(i.id)).forEach((f,i)=>{if(!f.value)si(f,'Kid'+(i+1));});
    [...document.querySelectorAll('input[id*="LastName"],input[id*="Surname"]')].filter((i)=>!/b15-/.test(i.id)).forEach((l)=>{if(!l.value)si(l,'Test');});});
   const ids=await q.evaluate(()=>[...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i)=>i.id.indexOf('b15-Input_BirthDate')===-1).map((i)=>i.id));
   for(const id of ids){await q.locator(`[id="${id}"]`).fill('2018-06-15').catch(()=>{});await q.waitForTimeout(150);}
   await stable(q);
   const ok=await q.evaluate(()=>[...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i)=>i.id.indexOf('b15-Input_BirthDate')===-1).every((i)=>i.value==='2018-06-15'));
   if(ok)break;}
  await stable(q);log(await sweep(q,'after kids fully filled'));
  // dump any remaining empty-required
  const rem=await q.evaluate(()=>{function vis(e){return e&&e.offsetParent!==null;}return [...document.querySelectorAll('input,select')].filter(vis).filter((e)=>{const empty=e.tagName==='SELECT'?/please select|^select|^$/i.test(((e.options[e.selectedIndex]||{}).text||'').trim()):!(e.value&&e.value.trim());return (e.required||e.getAttribute('aria-required')==='true')&&empty;}).map((e)=>e.id);});
  log({step:'empty-required remaining',rem});
  fs.writeFileSync(path.join(__dirname,'probe-kids-premium-final-result.json'),JSON.stringify(out,null,2));console.log('DONE');
 }catch(e){console.log('ERROR: '+e.message);fs.writeFileSync(path.join(__dirname,'probe-kids-premium-final-result.json'),JSON.stringify(out,null,2));}finally{await browser.close();}})();
