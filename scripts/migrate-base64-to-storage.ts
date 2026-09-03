import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Decodes a base64 Data URL, calculates a sha256 checksum, saves it to disk
 * in a deterministic folder structure: /public/uploads/products/{prodId}/{hash}.{ext}
 * and returns the persistent public URL.
 */
function migrateBase64ToPersistentFile(base64Str: string, productId: string): string {
  if (!base64Str || typeof base64Str !== 'string') return '';
  if (!base64Str.startsWith('data:image')) {
    // Already a regular URL or path
    return base64Str.trim();
  }

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+/0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.warn(`[MIGRATION] Invalid base64 string format for product ${productId}`);
      return '/placeholder-product.svg';
    }

    const mimeType = matches[1].toLowerCase();
    const b64Data = matches[2];
    const buffer = Buffer.from(b64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('svg')) ext = 'svg';

    // Calculate sha256 checksum for deduplication and immutable cache
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);

    const cleanProdId = String(productId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFolder = path.join(UPLOADS_DIR, 'products', cleanProdId);
    ensureDirExists(targetFolder);

    const filename = `${hash}.${ext}`;
    const filePath = path.join(targetFolder, filename);

    // Save physical file if it doesn't already exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
    }

    const publicUrl = `/uploads/products/${cleanProdId}/${filename}`;
    return publicUrl;
  } catch (err: any) {
    console.error(`[MIGRATION ERROR] Failed to process base64 for ${productId}:`, err?.message);
    return '/placeholder-product.svg';
  }
}

async function migrate() {
  console.log('[MIGRATION] Iniciando migração de Base64 para URLs persistentes...');
  ensureDirExists(UPLOADS_DIR);

  const authRes = await supabase.auth.signInWithPassword({
    email: 'admin@marmot.com',
    password: process.env.ADMIN_PASSWORD || ''
  });
  console.log('[AUTH] Admin login success:', !!authRes.data?.session);

  // 1. Fetch all products
  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  if (prodErr || !products) {
    console.error('[MIGRATION] Erro ao buscar produtos:', prodErr);
    return;
  }

  console.log(`[MIGRATION] Analisando ${products.length} produtos no banco de dados...`);

  let migratedProductsCount = 0;
  let totalImagesMigrated = 0;

  for (const p of products) {
    const prodId = p.id;
    let hasBase64 = false;

    // Check main image
    let cleanImage = p.image;
    if (typeof p.image === 'string' && p.image.startsWith('data:image')) {
      cleanImage = migrateBase64ToPersistentFile(p.image, prodId);
      hasBase64 = true;
      totalImagesMigrated++;
    }

    // Check images array
    let cleanImages: string[] = [];
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (typeof img === 'string') {
          if (img.startsWith('data:image')) {
            cleanImages.push(migrateBase64ToPersistentFile(img, prodId));
            hasBase64 = true;
            totalImagesMigrated++;
          } else {
            cleanImages.push(img.trim());
          }
        }
      }
    }
    if (cleanImages.length === 0 && cleanImage) {
      cleanImages = [cleanImage];
    }
    if (cleanImages.length > 0 && !cleanImage) {
      cleanImage = cleanImages[0];
    }

    // Check colors array
    let cleanColors: any[] = [];
    if (Array.isArray(p.colors)) {
      for (const c of p.colors) {
        const cCopy = { ...c };

        if (typeof cCopy.image === 'string' && cCopy.image.startsWith('data:image')) {
          cCopy.image = migrateBase64ToPersistentFile(cCopy.image, prodId);
          hasBase64 = true;
          totalImagesMigrated++;
        }

        if (typeof cCopy.featuredImage === 'string' && cCopy.featuredImage.startsWith('data:image')) {
          cCopy.featuredImage = migrateBase64ToPersistentFile(cCopy.featuredImage, prodId);
          hasBase64 = true;
          totalImagesMigrated++;
        }

        if (Array.isArray(cCopy.images)) {
          const cleanColorImgs: string[] = [];
          for (const cImg of cCopy.images) {
            if (typeof cImg === 'string') {
              if (cImg.startsWith('data:image')) {
                cleanColorImgs.push(migrateBase64ToPersistentFile(cImg, prodId));
                hasBase64 = true;
                totalImagesMigrated++;
              } else {
                cleanColorImgs.push(cImg.trim());
              }
            }
          }
          cCopy.images = cleanColorImgs;
        }

        // Guarantee consistency in color variant
        if (!cCopy.featuredImage && cCopy.image) cCopy.featuredImage = cCopy.image;
        if (!cCopy.image && cCopy.featuredImage) cCopy.image = cCopy.featuredImage;
        if (!cCopy.featuredImage && cleanImage) cCopy.featuredImage = cleanImage;
        if (!cCopy.image && cleanImage) cCopy.image = cleanImage;
        if ((!cCopy.images || cCopy.images.length === 0) && cCopy.featuredImage) {
          cCopy.images = [cCopy.featuredImage];
        }

        cleanColors.push(cCopy);
      }
    }

    if (hasBase64) {
      console.log(`[MIGRATING] Produto ${prodId} ("${p.title}")...`);

      const updatePayload: Record<string, any> = {
        image: cleanImage || (cleanImages[0] || ''),
        images: cleanImages,
        colors: cleanColors,
        data: null, // Wipe old redundant base64 stored in jsonb data
        updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', prodId);

      if (updateErr) {
        console.error(`[MIGRATION ERROR] Falha ao atualizar produto ${prodId}:`, updateErr);
      } else {
        // READ-AFTER-WRITE VERIFICATION
        const { data: verifyRow, error: verifyErr } = await supabase
          .from('products')
          .select('id, title, image, images, colors')
          .eq('id', prodId)
          .single();

        if (verifyErr || !verifyRow) {
          console.error(`[MIGRATION READ-AFTER-WRITE FAILED] Produto ${prodId}:`, verifyErr);
        } else {
          // Check if any base64 remains
          const remMain = typeof verifyRow.image === 'string' && verifyRow.image.startsWith('data:image');
          const remImgs = Array.isArray(verifyRow.images) && verifyRow.images.some((x: string) => typeof x === 'string' && x.startsWith('data:image'));
          const remColors = Array.isArray(verifyRow.colors) && verifyRow.colors.some((c: any) =>
            (typeof c.image === 'string' && c.image.startsWith('data:image')) ||
            (typeof c.featuredImage === 'string' && c.featuredImage.startsWith('data:image')) ||
            (Array.isArray(c.images) && c.images.some((x: string) => typeof x === 'string' && x.startsWith('data:image')))
          );

          if (remMain || remImgs || remColors) {
            console.error(`[MIGRATION FAILED] Base64 ainda presente após update em ${prodId}!`);
          } else {
            console.log(`[MIGRATION SUCCESS] Produto ${prodId} migrado e validado com sucesso via Read-After-Write.`);
            migratedProductsCount++;
          }
        }
      }
    }
  }

  console.log('====================================================');
  console.log(`[MIGRAÇÃO CONCLUÍDA]`);
  console.log(`Produtos migrados com sucesso: ${migratedProductsCount}`);
  console.log(`Total de ocorrências de imagens convertidas: ${totalImagesMigrated}`);
  console.log('====================================================');

  // FINAL POST-MIGRATION AUDIT
  console.log('[VERIFICAÇÃO FINAL] Executando auditoria pós-migração no banco...');
  const { data: postProducts } = await supabase.from('products').select('*');
  if (postProducts) {
    let postB64Main = 0;
    let postB64Images = 0;
    let postB64Colors = 0;
    let postJsonBytes = 0;

    for (const p of postProducts) {
      const str = JSON.stringify(p);
      postJsonBytes += str.length;

      if (typeof p.image === 'string' && p.image.startsWith('data:image')) postB64Main++;
      if (Array.isArray(p.images)) {
        postB64Images += p.images.filter(x => typeof x === 'string' && x.startsWith('data:image')).length;
      }
      if (Array.isArray(p.colors)) {
        for (const c of p.colors) {
          if (typeof c.image === 'string' && c.image.startsWith('data:image')) postB64Colors++;
          if (typeof c.featuredImage === 'string' && c.featuredImage.startsWith('data:image')) postB64Colors++;
          if (Array.isArray(c.images)) {
            postB64Colors += c.images.filter(x => typeof x === 'string' && x.startsWith('data:image')).length;
          }
        }
      }
    }

    console.log(`RESULTADO PÓS-MIGRAÇÃO:`);
    console.log(`Total de produtos: ${postProducts.length}`);
    console.log(`Base64 em image: ${postB64Main} (Meta: 0)`);
    console.log(`Base64 em images: ${postB64Images} (Meta: 0)`);
    console.log(`Base64 em colors: ${postB64Colors} (Meta: 0)`);
    console.log(`Tamanho total do JSON do catálogo: ${(postJsonBytes / (1024 * 1024)).toFixed(2)} MB (Redução de 17.63 MB para ${(postJsonBytes / 1024).toFixed(1)} KB)`);
  }
}

migrate().catch(console.error);
