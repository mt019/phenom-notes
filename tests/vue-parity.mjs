// Compare delivered static HTML, independent of framework implementation.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
const baseline=resolve('../notes-react/dist/notes'),candidate=resolve('dist/notes');
const files=[];
async function walk(dir,prefix='') {for(const item of await readdir(dir,{withFileTypes:true})){const name=prefix+item.name;if(item.isDirectory())await walk(resolve(dir,item.name),name+'/');else if(name.endsWith('.html'))files.push(name);}}
await walk(baseline);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const report=[];
try {
 for(const file of files){
  const [before,after]=await Promise.all([readFile(resolve(baseline,file),'utf8'),readFile(resolve(candidate,file),'utf8')]);
  const result=await page.evaluate(({before,after})=>{
   const parse=s=>new DOMParser().parseFromString(s,'text/html');
   const summarize=d=>({title:d.title,canonical:d.querySelector('link[rel=canonical]')?.href,
    schema:[...d.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)),
    prose:[...d.querySelectorAll('.notes-html')].map(e=>e.innerHTML),
    // Link sets preserve all article, inventory and cross-product destinations.
    links:[...new Set([...d.querySelectorAll('#main-content a[href]')].map(a=>a.getAttribute('href').replace(/^\/notes\/$/,'/notes')))].sort(),
    headings:[...d.querySelectorAll('#main-content h1,#main-content h2,#main-content h3')].map(e=>({id:e.id,text:e.textContent.trim()})),
   });
   return {before:summarize(parse(before)),after:summarize(parse(after))};
  },{before,after});
  assert.deepEqual(result.after,result.before,`Static content/metadata/navigation mismatch: ${file}`);
  report.push({file,prose:result.after.prose.length,headings:result.after.headings.length,links:result.after.links.length});
 }
 for(const file of ['inventory.json','timeline.json','songs.json'])assert.equal(await readFile(resolve(candidate,file),'utf8'),await readFile(resolve(baseline,file),'utf8'),`${file} payload changed`);
 await writeFile('../evidence/notes-vue-static-parity.json',JSON.stringify({routes:report.length,dataFiles:3,checks:report},null,2)+'\n');
 console.log(`Static parity: ${report.length} routes, exact article HTML, headings, links, schema and 3 public JSON files`);
}finally{await browser.close();}
