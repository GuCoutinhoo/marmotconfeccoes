import fs from 'fs';
import path from 'path';

const photoMappings = {
  'Shorts Cargo Baggy - cor preto.png': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=80',
  'Shorts Cargo Baggy - cor verde oliva.png': 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=900&q=80',
  'Shorts Mesh Sport - cor preto.png': 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=900&q=80',
  'Shorts Mesh Sport - cor off white.png': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=80',
  'Shorts Baggy Denim - cor preto.png': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',
  'Shorts Baggy Denim - cor bege.png': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
  'Shorts Denim Washed - cor preto lavado.png': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
  'Shorts Denim Washed - cor azul claro.png': 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=900&q=80',
  'Shorts Distressed - cor preto.png': 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
  'Shorts Distressed - cor jeans claro.png': 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&q=80',
  'Shorts Parachute - cor preto.png': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
  'Shorts Parachute - cor verde oliva.png': 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=80',
  'Shorts Tech Nylon - cor preto.png': 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=900&q=80',
  'Shorts Tech Nylon - cor cinza.png': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',
  'Shorts Flame - cor preto.png': 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=900&q=80',
  'Shorts Flame - cor off white.png': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',
  'Shorts Minimal - cor preto.png': 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
  'Shorts Minimal - cor bege.png': 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=80',
  'Shorts Panel - cor preto.png': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80',
  'Shorts Panel - cor caqui.png': 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&w=900&q=80',
  'Shorts Graphic - cor preto.png': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80',
  'Shorts Graphic - cor marrom.png': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80',
  'Shorts Side Stripe - cor preto.png': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
  'Shorts Side Stripe - cor off white.png': 'https://images.unsplash.com/photo-1584865288642-42078afe6942?auto=format&fit=crop&w=900&q=80',
};

async function downloadImages() {
  console.log('Downloading real streetwear product photography for shorts...');
  const publicDir = path.resolve(process.cwd(), 'public');
  const distDir = path.resolve(process.cwd(), 'dist');

  let successCount = 0;
  for (const [filename, url] of Object.entries(photoMappings)) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      
      const publicPath = path.join(publicDir, filename);
      fs.writeFileSync(publicPath, buffer);

      if (fs.existsSync(distDir)) {
        const distPath = path.join(distDir, filename);
        fs.writeFileSync(distPath, buffer);
      }

      console.log(`✓ ${filename} (${buffer.length} bytes)`);
      successCount++;
    } catch (err) {
      console.error(`✗ Error downloading ${filename}:`, err.message);
    }
  }

  console.log(`Finished: ${successCount}/${Object.keys(photoMappings).length} images updated successfully.`);
}

downloadImages();
