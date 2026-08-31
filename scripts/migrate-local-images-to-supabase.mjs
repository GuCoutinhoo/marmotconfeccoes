import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateImages() {
  console.log('=== INICIANDO MIGRAÇÃO DE IMAGENS LOCAIS PARA SUPABASE STORAGE ===');
  
  // 1. Obter produtos com imagens locais
  const { data: products, error } = await supabase.from('products').select('id, slug, title, image, images');
  if (error) {
    console.error('Erro ao consultar produtos:', error.message);
    return;
  }

  let migratedCount = 0;
  for (const prod of products) {
    let changed = false;
    let newImage = prod.image;
    let newImages = Array.isArray(prod.images) ? [...prod.images] : [];

    const checkAndUpload = async (imgPath) => {
      if (!imgPath || typeof imgPath !== 'string') return imgPath;
      if (!imgPath.startsWith('/uploads/') && !imgPath.startsWith('uploads/')) return imgPath;

      const relPath = imgPath.replace(/^\//, '');
      const possibleLocalPaths = [
        path.join(process.cwd(), 'public', relPath),
        path.join(process.cwd(), relPath),
      ];

      let foundLocalPath = null;
      for (const p of possibleLocalPaths) {
        if (fs.existsSync(p)) {
          foundLocalPath = p;
          break;
        }
      }

      if (foundLocalPath) {
        const fileBuffer = fs.readFileSync(foundLocalPath);
        const fileName = path.basename(foundLocalPath);
        const ext = path.extname(fileName).toLowerCase().replace('.', '') || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const storagePath = `migrated/${prod.id || 'general'}/${fileName}`;

        try {
          const { data: upData, error: upErr } = await supabase.storage
            .from('product-images')
            .upload(storagePath, fileBuffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!upErr && upData) {
            const { data: pubData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
            if (pubData && pubData.publicUrl) {
              console.log(`[MIGRATED] ${prod.title}: ${imgPath} -> ${pubData.publicUrl}`);
              return pubData.publicUrl;
            }
          } else if (upErr) {
            console.warn(`[UPLOAD NOTICE] ${prod.title}: ${upErr.message}`);
          }
        } catch (e) {
          console.warn(`[UPLOAD EXCEPTION] ${prod.title}:`, e.message);
        }
      }

      return imgPath;
    };

    if (newImage && (newImage.startsWith('/uploads/') || newImage.startsWith('uploads/'))) {
      const up = await checkAndUpload(newImage);
      if (up !== newImage) {
        newImage = up;
        changed = true;
      }
    }

    const updatedImagesList = [];
    for (const item of newImages) {
      if (item && (item.startsWith('/uploads/') || item.startsWith('uploads/'))) {
        const up = await checkAndUpload(item);
        updatedImagesList.push(up);
        if (up !== item) changed = true;
      } else {
        updatedImagesList.push(item);
      }
    }
    newImages = updatedImagesList;

    if (changed) {
      const { error: updateErr } = await supabase.from('products').update({
        image: newImage,
        images: newImages,
        updated_at: new Date().toISOString(),
      }).eq('id', prod.id);

      if (!updateErr) {
        migratedCount++;
        console.log(`[PRODUTO ATUALIZADO] ${prod.title} (${prod.id})`);
      }
    }
  }

  console.log(`=== MIGRAÇÃO CONCLUÍDA: ${migratedCount} produtos atualizados com URLs do Supabase Storage. ===`);
}

migrateImages().catch(console.error);
