import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const TARGET_SHORTS = [
  {
    file: 'Shorts Cargo Baggy - cor preto.png',
    query: 'mens black baggy cargo shorts streetwear product',
  },
  {
    file: 'Shorts Cargo Baggy - cor verde oliva.png',
    query: 'mens olive green cargo shorts streetwear product',
  },
  {
    file: 'Shorts Mesh Sport - cor preto.png',
    query: 'mens black basketball mesh shorts streetwear',
  },
  {
    file: 'Shorts Mesh Sport - cor off white.png',
    query: 'mens cream off white basketball mesh shorts streetwear',
  },
  {
    file: 'Shorts Baggy Denim - cor preto.png',
    query: 'mens black baggy denim shorts jorts streetwear',
  },
  {
    file: 'Shorts Baggy Denim - cor bege.png',
    query: 'mens beige tan denim shorts jorts streetwear',
  },
  {
    file: 'Shorts Denim Washed - cor preto lavado.png',
    query: 'mens washed black denim shorts jorts streetwear',
  },
  {
    file: 'Shorts Denim Washed - cor azul claro.png',
    query: 'mens light blue washed denim shorts jorts streetwear',
  },
  {
    file: 'Shorts Distressed - cor preto.png',
    query: 'mens black distressed ripped denim shorts jorts',
  },
  {
    file: 'Shorts Distressed - cor jeans claro.png',
    query: 'mens light blue distressed ripped denim shorts jorts',
  },
  {
    file: 'Shorts Parachute - cor preto.png',
    query: 'mens black parachute cargo shorts streetwear',
  },
  {
    file: 'Shorts Parachute - cor verde oliva.png',
    query: 'mens olive green parachute shorts streetwear',
  },
  {
    file: 'Shorts Tech Nylon - cor preto.png',
    query: 'mens black nylon techwear cargo shorts streetwear',
  },
  {
    file: 'Shorts Tech Nylon - cor cinza.png',
    query: 'mens grey nylon techwear cargo shorts streetwear',
  },
  {
    file: 'Shorts Flame - cor preto.png',
    query: 'mens black flame fire print streetwear shorts',
  },
  {
    file: 'Shorts Flame - cor off white.png',
    query: 'mens white flame fire print streetwear shorts',
  },
  {
    file: 'Shorts Minimal - cor preto.png',
    query: 'mens black minimal sweatshorts fleece cotton streetwear',
  },
  {
    file: 'Shorts Minimal - cor bege.png',
    query: 'mens beige minimal sweatshorts fleece cotton streetwear',
  },
  {
    file: 'Shorts Panel - cor preto.png',
    query: 'mens black colorblock panel shorts streetwear',
  },
  {
    file: 'Shorts Panel - cor caqui.png',
    query: 'mens khaki colorblock panel shorts streetwear',
  },
  {
    file: 'Shorts Graphic - cor preto.png',
    query: 'mens black graphic streetwear shorts',
  },
  {
    file: 'Shorts Graphic - cor marrom.png',
    query: 'mens brown graphic streetwear shorts',
  },
  {
    file: 'Shorts Side Stripe - cor preto.png',
    query: 'mens black track shorts side stripe streetwear',
  },
  {
    file: 'Shorts Side Stripe - cor off white.png',
    query: 'mens white track shorts side stripe streetwear',
  },
];

async function fetchCandidates(query) {
  const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query) + '&form=HDRSC2&first=1';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    const html = await res.text();
    const matches = [...html.matchAll(/class=\"iusc\"[^>]*m=\"({[^\"]+})\"/g)].map((m) => {
      const raw = m[1];
      const murlMatch = raw.match(/murl&quot;:&quot;(https?:[^&]+)&quot;/);
      const titleMatch = raw.match(/t&quot;:&quot;(.*?)&quot;,\s*&quot;/);
      return {
        url: murlMatch ? murlMatch[1] : null,
        title: titleMatch ? titleMatch[1].replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c)).replace(/&amp;/g, '&') : '',
      };
    }).filter(
      (x) =>
        x.url &&
        /\b(shorts|short|jorts|jort|bermuda|cargo|sweatshort|sweatshorts)\b/i.test(x.title) &&
        !x.title.toLowerCase().includes('shorthair') &&
        !x.title.toLowerCase().includes('wallpaper') &&
        !x.title.toLowerCase().includes('drawing') &&
        !x.url.toLowerCase().includes('wallpaper') &&
        !x.url.toLowerCase().includes('colorsexplained')
    );

    return matches;
  } catch (err) {
    console.error(`Failed fetching candidates for "${query}":`, err.message);
    return [];
  }
}

async function downloadAndProcessImage(url, destPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) return false;

    const img = sharp(buf);
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return false;
    if (meta.width < 250 || meta.height < 250) return false;

    await img
      .resize(750, 1000, {
        fit: 'cover',
        position: 'center',
      })
      .png({ quality: 90 })
      .toFile(destPath);

    return true;
  } catch (err) {
    clearTimeout(timeout);
    return false;
  }
}

async function main() {
  console.log('=== STARTING COMPLETE AUTHENTIC SHORTS CATALOG REPLACEMENT ===');
  let successCount = 0;

  for (let i = 0; i < TARGET_SHORTS.length; i++) {
    const item = TARGET_SHORTS[i];
    const dest = path.join(process.cwd(), 'public', item.file);
    console.log(`\n[${i + 1}/${TARGET_SHORTS.length}] Processing "${item.file}"`);

    const candidates = await fetchCandidates(item.query);
    console.log(`Found ${candidates.length} verified clothing candidates for "${item.query}"`);

    let saved = false;
    for (const c of candidates.slice(0, 15)) {
      console.log(` -> Trying [${c.title.slice(0, 45)}] ${c.url.slice(0, 60)}...`);
      const ok = await downloadAndProcessImage(c.url, dest);
      if (ok) {
        console.log(`    ✓ SUCCESS: Saved "${item.file}"`);
        saved = true;
        successCount++;
        break;
      }
    }

    if (!saved) {
      console.error(`    ✗ FAILED: Could not save "${item.file}"`);
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n=============================================`);
  console.log(`REPLACEMENT SUMMARY: ${successCount}/${TARGET_SHORTS.length} SHORTS IMAGES PERFECTLY UPDATED`);
  console.log(`=============================================`);
}

main().catch(console.error);
