import sharp from 'sharp';
import { readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const mediaDir = new URL('../public/media/', import.meta.url);
const dataPath = new URL('../src/portfolio-data.json', import.meta.url);
const files = await readdir(mediaDir);
const replacements = new Map();

for (const file of files) {
  const extension = extname(file);
  const output = file.slice(0, -extension.length) + '.webp';
  const inputPath = join(mediaDir.pathname, file);
  const finalPath = join(mediaDir.pathname, output);
  const outputPath = file.endsWith('.webp') ? `${finalPath}.tmp` : finalPath;
  const animated = /-01-/.test(file) && ['.gif', '.webp'].includes(extension.toLowerCase());
  await sharp(inputPath, { animated, pages: animated ? -1 : 1, limitInputPixels: false })
    .resize({ width: animated ? 760 : 960, height: animated ? 760 : 960, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: animated ? 38 : 58, effort: 6 })
    .toFile(outputPath);
  if (file.endsWith('.webp')) await rename(outputPath, finalPath);
  else await unlink(inputPath);
  replacements.set(`/media/${file}`, `/media/${output}`);
  process.stdout.write('.');
}

let data = await readFile(dataPath, 'utf8');
for (const [before, after] of replacements) data = data.replaceAll(before, after);
await writeFile(dataPath, data);
console.log(`\nOptimized ${replacements.size} assets.`);
