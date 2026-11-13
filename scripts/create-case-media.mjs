// Complete, genuine browser captures. Historical light views are re-rendered
// from the original source commits; no screenshot is recoloured or redrawn.
import { mkdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch {
  if (!process.env.NOEMATRACE_MEDIA_NODE_MODULES) throw new Error('Media generation requires the sharp package.');
  sharp = require(`${process.env.NOEMATRACE_MEDIA_NODE_MODULES}/sharp`);
}
const captures = process.argv[2] || 'qa/v31';
const root = process.cwd();
const out = path.join(root, 'public/case');
// Reject loading screens before writing any derived assets. A successful page
// navigation or image decode does not establish that the workspace is visible.
const sourceScenes = ['03-trace', '04-review', '05-comparison', '06-finance', '07-history', '08-stale', '10-canvas-earlier', '12-review-earlier'];
for (const theme of ['light', 'dark']) {
  for (const scene of sourceScenes) {
    const source = path.join(root, captures, `${scene}-${theme}.jpg`);
    const capture = sharp(source);
    const { width, height } = await capture.metadata();
    const { entropy } = await capture.greyscale().stats();
    if (width !== 1363 || height !== 912 || entropy < 1) {
      throw new Error(`Incomplete workspace capture: ${source}. Wait for the scene heading, fonts and layout, then recapture.`);
    }
  }
}
for (const theme of ['light', 'dark']) {
  const directory = path.join(out, theme);
  await mkdir(directory, {recursive:true});
  for (const [source,name,region] of [
    [`${captures}/10-canvas-earlier-${theme}.jpg`, 'canvas-earlier-context.webp', {left:229,top:190,width:791,height:718}],
    [`${captures}/03-trace-${theme}.jpg`, 'canvas-current-context.webp', {left:229,top:190,width:791,height:718}],
    [`${captures}/12-review-earlier-${theme}.jpg`, 'review-earlier-context.webp', {left:176,top:32,width:1012,height:872}],
    [`${captures}/04-review-${theme}.jpg`, 'review-current-context.webp', {left:176,top:32,width:1012,height:872}],
  ]) await sharp(path.join(root,source)).extract(region).webp({quality:94}).toFile(path.join(directory,name));
  const scenes=['03-trace','05-comparison','06-finance','07-history','08-stale'];
  for (let i=0;i<scenes.length;i++) await sharp(path.join(root,`${captures}/${scenes[i]}-${theme}.jpg`))
    .extract({left:0,top:0,width:1363,height:900}).jpeg({quality:95}).toFile(path.join(directory,`state-${i+1}.jpg`));
  const result=spawnSync('python3',['scripts/render-case-film.py',theme],{stdio:'inherit'});
  if(result.status!==0) process.exit(result.status||1);
}
// Existing downloaded links keep working with the updated dark compositions.
for(const name of ['canvas-earlier-context.webp','canvas-current-context.webp','review-earlier-context.webp','review-current-context.webp','overview.mp4','overview-poster.jpg',...Array.from({length:5},(_,i)=>[`state-${i+1}.jpg`,`chapter-${i+1}.jpg`,`chapter-${i+1}.mp4`]).flat()])
  await copyFile(path.join(out,'dark',name),path.join(out,name));
for (const name of ['canvas-earlier', 'canvas-current', 'review-earlier', 'review-current'])
  await copyFile(path.join(out, `${name}-context.webp`), path.join(out, `${name}.webp`));
await copyFile(path.join(root, captures, '03-trace-light.jpg'), path.join(out, 'workspace-light.jpg'));
console.log('Updated complete case media in both themes.');
