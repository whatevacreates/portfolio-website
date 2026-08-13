import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const sourceDir = '/tmp/fk-pages';
const assetDir = new URL('../public/media/', import.meta.url);
const dataFile = new URL('../src/portfolio-data.json', import.meta.url);

const meta = {
  'team-nl': ['This is how we do it!', 'TeamNL', 'Brand campaign'],
  'adidas-email': ['Hottest drops! New Arrivals', 'adidas', 'CRM & direct mail'],
  slime: ['Slime', 'Wall’s', 'Launch campaign'],
  '100-days-of-summer-by-walls': ['100 days of Summer', 'Wall’s', 'Social campaign'],
  'new-page': ['Skip your laundry', 'dobbi by Persil', 'Integrated campaign'],
  'adidas-ub': ['UltraBOOST All Terrain', 'adidas Running', 'Product advertising'],
  'twister-digital-campaign': ['Twister Paddle-pop', 'Wall’s', 'Digital campaign'],
  reebok: ['Go Elemental!', 'Reebok', 'Mobile campaign'],
  'tbwa-recruitment-campaign': ['The Yellow Phone', 'TBWA', 'Recruitment campaign'],
  'www-design': ['Selected web design', 'Various clients', 'Digital design'],
  mcwalk: ['McWalk', 'McDonald’s Netherlands', 'Brand activation'],
  'ploom-jti': ['What if tobacco was discovered today?', 'JTI', 'Product launch'],
  'royal-canin-social-campaign-2': ['Healthy habits', 'Royal Canin', 'Social campaign'],
  branding: ['Selected branding', 'Various clients', 'Identity design'],
  'magnum-social': ['Magnum Social', 'Magnum', 'Social art direction']
};

const covers = {
  'team-nl': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532689595899-309V41IXNGO2MZJ34OUR/zo-doen-we-dat3.gif',
  'adidas-email': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532695426320-7TJIF6YP5UTEV8QBU7BP/adidas-crm2.gif',
  slime: 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1633631276816-5H6KD0O59GGN0RR7ZWCT/slime-icon2.gif',
  '100-days-of-summer-by-walls': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1590335934029-8WF1E9HPG9C36INHDF9K/100+days+of+summer.png',
  'new-page': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532690283466-G68N3EXUINMYDA4IEPVE/dobbi-icon-v2.gif',
  'adidas-ub': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532694461702-PG5QBHS2RJK8CUMBYY36/adidas-product-video-icons.gif',
  'twister-digital-campaign': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1590335902817-C44EBKFFW0XPVDOKPTXK/twister+ikonka.png',
  reebok: 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532697467710-NZGI2PG65TN063TKUASE/go-elemental-xx.gif',
  'tbwa-recruitment-campaign': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532612055415-1W6JR4N29WM42NC5A65L/the-yellow-phone.gif',
  'www-design': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1535575470103-636IGLSWRW05T4GIJO8P/www-design-icons.gif',
  mcwalk: 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532700470284-CUGDGLRCPNLS4VJEKSED/mcwalk.gif',
  'ploom-jti': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1532696627662-XS6VP6ZERM3O43VL7P5A/PLOOM2.gif',
  'royal-canin-social-campaign-2': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1555667064448-QFZN0DCEU0ZVAMIS366E/rc-ikonka.gif',
  branding: 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1535575368158-1AEJIXFVN9L3FYYM94RY/logo-design-icons.gif',
  'magnum-social': 'https://images.squarespace-cdn.com/content/v1/54d52b22e4b07faf95d8f444/1636220800841-Q6K6SZO38H4QK0KXX1HA/magnum2.gif'
};

const clean = (text) => text
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const imageUrls = (html) => [...new Set(
  [...html.matchAll(/https:\/\/images\.squarespace-cdn\.com\/[^"' )<]+/g)]
    .map((match) => match[0].replace(/[?&](?:format|content-type).*$/, ''))
)];

const paragraphs = (html) => [...html.matchAll(/<(?:h1|h2|p)[^>]*>([\s\S]*?)<\/(?:h1|h2|p)>/gi)]
  .map((match) => clean(match[1]))
  .filter((text) => text && !['Eva Przybyla', 'Art Director / Designer / Programmer'].includes(text));

const localName = (url, index, slug) => {
  const raw = decodeURIComponent(basename(new URL(url).pathname).replace(/\+/g, ' '));
  const extension = extname(raw).toLowerCase() || '.jpg';
  const stem = raw.slice(0, -extension.length).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54);
  return `${slug}-${String(index + 1).padStart(2, '0')}-${stem || 'image'}${extension}`;
};

await mkdir(assetDir, { recursive: true });
await mkdir(new URL('../src/', import.meta.url), { recursive: true });
const projects = [];
const download = async (url, destination) => {
  try {
    await access(destination);
    return true;
  } catch {}
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${url}?format=1600w`);
      if (!response.ok) throw new Error(`${response.status}`);
      await writeFile(destination, Buffer.from(await response.arrayBuffer()));
      return true;
    } catch (error) {
      if (attempt === 2) console.warn(`\nSkipped ${url}: ${error.message}`);
    }
  }
  return false;
};

for (const [slug, details] of Object.entries(meta)) {
  const html = await readFile(`${sourceDir}/${slug}.html`, 'utf8');
  const urls = [covers[slug], ...imageUrls(html)].filter((url, index, all) => all.indexOf(url) === index);
  const images = [];
  for (let index = 0; index < urls.length; index++) {
    const filename = localName(urls[index], index, slug);
    const destination = new URL(filename, assetDir);
    if (await download(urls[index], destination)) {
      images.push(`/media/${filename}`);
      process.stdout.write('.');
    }
  }
  projects.push({ slug, title: details[0], client: details[1], category: details[2], description: paragraphs(html).slice(0, 2).join(' '), images });
}

const photoHtml = await readFile(`${sourceDir}/photography-4.html`, 'utf8');
const photography = [];
for (const [index, url] of imageUrls(photoHtml).entries()) {
  const filename = localName(url, index, 'photography');
  if (await download(url, new URL(filename, assetDir))) {
    photography.push(`/media/${filename}`);
    process.stdout.write('.');
  }
}

const aboutHtml = await readFile(`${sourceDir}/about.html`, 'utf8');
const aboutUrl = imageUrls(aboutHtml)[0];
const aboutName = localName(aboutUrl, 0, 'about');
await download(aboutUrl, new URL(aboutName, assetDir));

await writeFile(dataFile, JSON.stringify({ projects, photography, aboutImage: `/media/${aboutName}` }, null, 2));
console.log(`\nImported ${projects.length} projects and ${photography.length} photographs.`);
