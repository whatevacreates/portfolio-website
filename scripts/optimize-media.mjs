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
  // Detect animation from the file itself. Keying off the "-01-" cover naming
  // flattened every in-page GIF to a single frame.
  const { pages = 1 } = await sharp(inputPath, { animated: true, limitInputPixels: false }).metadata();
  const animated = pages > 1;
  await sharp(inputPath, { animated, pages: animated ? -1 : 1, limitInputPixels: false })
    .resize({ width: animated ? 1100 : 2000, height: animated ? 1100 : 2000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: animated ? 68 : 82, effort: 6 })
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
