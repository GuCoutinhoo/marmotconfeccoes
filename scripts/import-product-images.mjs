import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const IMPORT_DIR = path.resolve(process.cwd(), 'product-images-import');
const REPORT_PATH = path.join(IMPORT_DIR, 'import-report.json');
const BUCKET = 'product-images';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const DRY_RUN = process.argv.includes('--dry-run');
const ALLOWED_EXTENSIONS = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
]);

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, '-');
}

function titleCaseColor(value) {
  const normalized = normalizeText(value)
    .replace(/\bpreta\b/g, 'preto')
    .replace(/\bcinza\b/g, 'cinza');
  return normalized
    .split(' ')
    .map((word) => (word === 'e' || word === 'de') ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = saved;
    }
  }
  return previous[b.length];
}

function similarity(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  return 1 - (levenshtein(left, right) / Math.max(left.length, right.length));
}

function parseFilename(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return { error: 'INVALID_EXTENSION', reason: 'Formato não aceito. Use PNG, JPG/JPEG ou WEBP.' };
  }

  const base = path.basename(filename, extension);
  const canonical = base.match(/^(.+?)__(.+?)__(\d{2,})$/);
  if (canonical) {
    const order = Number(canonical[3]);
    if (!Number.isSafeInteger(order) || order < 1) {
      return { error: 'INVALID_ORDER', reason: 'A ordem deve ser um número inteiro positivo.' };
    }
    return {
      productToken: canonical[1],
      colorToken: canonical[2],
      colorName: titleCaseColor(canonical[2]),
      order,
      extension: extension === '.jpeg' ? '.jpg' : extension,
      legacy: false,
    };
  }

  // One-time compatibility for the human-readable files initially dropped in
  // the repository root. They are renamed to the canonical convention before upload.
  const legacy = base.match(/^(.*?)\s+-\s*([^-]+)$/);
  if (legacy) {
    return {
      productToken: legacy[1].trim(),
      colorToken: legacy[2].trim(),
      colorName: titleCaseColor(legacy[2]),
      order: 1,
      extension: extension === '.jpeg' ? '.jpg' : extension,
      legacy: true,
    };
  }

  return {
    error: 'INVALID_FILENAME',
    reason: 'Nome inválido. Use produto__cor__ordem.ext, por exemplo camiseta-heavy-boxy__preto__01.png.',
  };
}

function findProduct(products, token, allowFuzzy) {
  const normalized = normalizeText(token);
  const exact = products.filter((product) => [product.id, product.slug, product.title]
    .some((value) => normalizeText(value) === normalized));
  if (exact.length === 1) return { product: exact[0], match: 'exact' };
  if (exact.length > 1) return { error: 'AMBIGUOUS_PRODUCT', reason: `Mais de um produto corresponde a "${token}".` };
  if (!allowFuzzy) return { error: 'PRODUCT_NOT_FOUND', reason: `Produto "${token}" não encontrado por ID, slug ou título.` };

  const ranked = products
    .map((product) => ({ product, score: Math.max(similarity(token, product.title), similarity(token, product.slug)) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < 0.82 || (second && best.score - second.score < 0.08)) {
    return { error: 'PRODUCT_NOT_FOUND', reason: `Produto "${token}" não possui correspondência única e segura.` };
  }
  return { product: best.product, match: 'fuzzy', score: best.score };
}

function colorTokens(value) {
  const tokens = new Set(normalizeText(value).split(' ').filter((token) => token && token !== 'e' && token !== 'de'));
  if (tokens.has('black') || tokens.has('pitch')) tokens.add('preto');
  if (tokens.has('preta')) tokens.add('preto');
  if (tokens.has('khaki') || tokens.has('desert')) tokens.add('bege');
  if (tokens.has('olive') || tokens.has('military')) {
    tokens.add('verde');
    tokens.add('militar');
  }
  if (tokens.has('grafite') || tokens.has('chumbo')) tokens.add('cinza');
  return tokens;
}

function colorMatchScore(inputColor, variant) {
  const input = normalizeText(inputColor);
  const values = [variant.color, variant.colorName].map(normalizeText).filter(Boolean);
  if (values.includes(input)) return 100;
  const inputTokens = colorTokens(inputColor);
  const variantTokens = new Set([...colorTokens(variant.color), ...colorTokens(variant.colorName)]);
  let score = 0;
  for (const token of inputTokens) {
    if (variantTokens.has(token)) score += 10;
  }
  if (inputTokens.has('preto') && variantTokens.has('preto')) score += 40;
  if (inputTokens.has('bege') && variantTokens.has('bege')) score += 30;
  return score;
}

function mapColorsForProduct(product, files) {
  const variants = Array.isArray(product.colors) ? product.colors : [];
  if (variants.length === 0) {
    return { error: 'COLOR_NOT_FOUND', reason: `O produto ${product.title} não possui variantes de cor cadastradas.` };
  }

  const incomingColors = [...new Map(files.map((file) => [normalizeText(file.colorName), file.colorName])).values()];
  const assignments = new Map();
  const usedVariants = new Set();

  const candidates = [];
  incomingColors.forEach((colorName) => {
    variants.forEach((variant, variantIndex) => {
      const score = colorMatchScore(colorName, variant);
      if (score > 0) candidates.push({ colorName, variantIndex, score });
    });
  });
  candidates.sort((a, b) => b.score - a.score);
  for (const candidate of candidates) {
    const colorKey = normalizeText(candidate.colorName);
    if (!assignments.has(colorKey) && !usedVariants.has(candidate.variantIndex)) {
      assignments.set(colorKey, candidate.variantIndex);
      usedVariants.add(candidate.variantIndex);
    }
  }

  const unmatchedColors = incomingColors.filter((color) => !assignments.has(normalizeText(color)));
  const unmatchedVariants = variants.map((_, index) => index).filter((index) => !usedVariants.has(index));

  // Legacy catalog rows used generic placeholder labels for the second variant.
  // Reconcile only a single remaining color/slot; multiple possibilities fail closed.
  if (unmatchedColors.length === 1 && unmatchedVariants.length === 1) {
    assignments.set(normalizeText(unmatchedColors[0]), unmatchedVariants[0]);
    usedVariants.add(unmatchedVariants[0]);
  } else if (unmatchedColors.length > 0) {
    return {
      error: 'COLOR_NOT_FOUND',
      reason: `Cor(es) sem correspondência única em ${product.title}: ${unmatchedColors.join(', ')}.`,
    };
  }

  return { assignments };
}

function detectColorHex(colorName, fallback) {
  const value = normalizeText(colorName);
  if (value.includes('preto lavado')) return '#303236';
  if (value.includes('preto')) return '#171717';
  if (value.includes('grafite')) return '#4B4F52';
  if (value.includes('chumbo')) return '#4A4E52';
  if (value.includes('cinza')) return '#7A7D80';
  if (value.includes('verde militar')) return '#4B5320';
  if (value.includes('verde')) return '#50633F';
  if (value.includes('marrom')) return '#6F513D';
  if (value.includes('bege')) return '#C8B596';
  if (value.includes('azul')) return '#355C8A';
  return fallback || '#71717A';
}

function validateMagicBytes(buffer, extension) {
  if (extension === '.png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === '.jpg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === '.webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function arraysEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function ensureCanonicalFilename(file, product, variantIndex) {
  const variant = product.colors[variantIndex];
  const colorName = file.colorName || variant.colorName || variant.color;
  const canonicalName = `${product.slug}__${slugify(colorName)}__${String(file.order).padStart(2, '0')}${file.extension}`;
  const canonicalPath = path.join(IMPORT_DIR, canonicalName);
  if (file.absolutePath === canonicalPath) return { ...file, filename: canonicalName };

  try {
    const existing = await fs.readFile(canonicalPath);
    const existingHash = crypto.createHash('sha256').update(existing).digest('hex');
    if (existingHash !== file.sha256) {
      throw new Error(`Já existe ${canonicalName} com conteúdo diferente.`);
    }
    await fs.unlink(file.absolutePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      await fs.rename(file.absolutePath, canonicalPath);
    } else {
      throw error;
    }
  }
  return { ...file, filename: canonicalName, absolutePath: canonicalPath };
}

async function uploadImage(supabase, file, product, variant) {
  const variantSlug = slugify(file.colorName || variant.colorName || variant.color);
  const storedFilename = `${String(file.order).padStart(2, '0')}-${file.sha256.slice(0, 16)}${file.extension}`;
  const storageFolder = `products/${product.slug}/${variantSlug}`;
  const storagePath = `${storageFolder}/${storedFilename}`;
  const storage = supabase.storage.from(BUCKET);

  const { data: existing, error: listError } = await storage.list(storageFolder, {
    limit: 10,
    search: storedFilename,
  });
  if (listError) throw new Error(`Falha ao consultar Storage: ${listError.message}`);

  let uploadStatus = 'already-present';
  if (!existing?.some((entry) => entry.name === storedFilename)) {
    const { error: uploadError } = await storage.upload(storagePath, file.buffer, {
      contentType: file.contentType,
      cacheControl: '31536000',
      upsert: false,
    });
    if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
    uploadStatus = 'uploaded';
  }

  const { data: publicData } = storage.getPublicUrl(storagePath);
  if (!publicData?.publicUrl || !publicData.publicUrl.startsWith('https://')) {
    throw new Error('O Supabase não retornou uma URL pública HTTPS válida.');
  }

  return { storagePath, publicUrl: publicData.publicUrl, uploadStatus };
}

async function main() {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias. O importador nunca usa chaves VITE_* ou anon.');
  }

  await fs.mkdir(IMPORT_DIR, { recursive: true });
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const report = {
    startedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    bucket: BUCKET,
    imported: [],
    failed: [],
    productsUpdated: [],
    summary: {},
  };

  const [{ data: products, error: productsError }, { data: buckets, error: bucketsError }] = await Promise.all([
    supabase.from('products').select('id,slug,title,colors,image,images,updated_at').order('title'),
    supabase.storage.listBuckets(),
  ]);
  if (productsError) throw new Error(`Falha ao consultar products: ${productsError.message}`);
  if (bucketsError) throw new Error(`Falha ao consultar buckets: ${bucketsError.message}`);
  const bucket = buckets?.find((item) => item.name === BUCKET);
  if (!bucket) throw new Error(`Bucket ${BUCKET} não encontrado.`);
  if (!bucket.public) throw new Error(`Bucket ${BUCKET} precisa ser público para imagens de catálogo persistentes.`);

  const directoryEntries = await fs.readdir(IMPORT_DIR, { withFileTypes: true });
  const imageNames = directoryEntries
    .filter((entry) => entry.isFile() && ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const accepted = [];
  const contentOwners = new Map();
  for (const filename of imageNames) {
    try {
      const parsed = parseFilename(filename);
      if (parsed.error) throw Object.assign(new Error(parsed.reason), { code: parsed.error });
      const absolutePath = path.join(IMPORT_DIR, filename);
      const stat = await fs.stat(absolutePath);
      if (stat.size <= 0 || stat.size > MAX_FILE_BYTES) {
        throw Object.assign(new Error('Arquivo vazio ou maior que 10 MB.'), { code: 'INVALID_FILE_SIZE' });
      }
      const buffer = await fs.readFile(absolutePath);
      if (!validateMagicBytes(buffer, parsed.extension)) {
        throw Object.assign(new Error('A assinatura binária não corresponde à extensão do arquivo.'), { code: 'INVALID_FILE_SIGNATURE' });
      }
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 100) {
        throw Object.assign(new Error('Imagem inválida ou com dimensões inferiores a 100x100.'), { code: 'INVALID_IMAGE_DIMENSIONS' });
      }
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      if (contentOwners.has(sha256)) {
        throw Object.assign(new Error(`Conteúdo duplicado de ${contentOwners.get(sha256)}.`), { code: 'DUPLICATE_CONTENT' });
      }
      contentOwners.set(sha256, filename);

      const productMatch = findProduct(products, parsed.productToken, parsed.legacy);
      if (!productMatch.product) throw Object.assign(new Error(productMatch.reason), { code: productMatch.error });
      accepted.push({
        ...parsed,
        filename,
        absolutePath,
        buffer,
        sha256,
        contentType: ALLOWED_EXTENSIONS.get(parsed.extension),
        width: metadata.width,
        height: metadata.height,
        product: productMatch.product,
        productMatch: productMatch.match,
      });
    } catch (error) {
      report.failed.push({ file: filename, code: error?.code || 'INVALID_FILE', reason: error?.message || String(error) });
    }
  }

  const byProduct = new Map();
  for (const file of accepted) {
    const group = byProduct.get(file.product.id) || [];
    group.push(file);
    byProduct.set(file.product.id, group);
  }

  for (const [productId, productFiles] of byProduct) {
    const product = productFiles[0].product;
    const colorMapping = mapColorsForProduct(product, productFiles);
    if (!colorMapping.assignments) {
      productFiles.forEach((file) => report.failed.push({ file: file.filename, code: colorMapping.error, reason: colorMapping.reason }));
      continue;
    }

    const mappedFiles = [];
    const orderKeys = new Set();
    let productInvalid = false;
    for (const file of productFiles) {
      const variantIndex = colorMapping.assignments.get(normalizeText(file.colorName));
      if (variantIndex === undefined) {
        report.failed.push({ file: file.filename, code: 'COLOR_NOT_FOUND', reason: `Cor ${file.colorName} não associada.` });
        productInvalid = true;
        continue;
      }
      const orderKey = `${variantIndex}:${file.order}`;
      if (orderKeys.has(orderKey)) {
        report.failed.push({ file: file.filename, code: 'DUPLICATE_ORDER', reason: `Ordem ${file.order} duplicada para ${product.title} / ${file.colorName}.` });
        productInvalid = true;
        continue;
      }
      orderKeys.add(orderKey);
      mappedFiles.push({ ...file, variantIndex });
    }
    if (productInvalid) continue;

    if (DRY_RUN) {
      mappedFiles.forEach((file) => report.imported.push({
        file: file.filename,
        productId,
        productSlug: product.slug,
        productTitle: product.title,
        color: file.colorName,
        order: file.order,
        status: 'planned',
      }));
      continue;
    }

    const uploaded = [];
    try {
      for (const originalFile of mappedFiles) {
        const file = await ensureCanonicalFilename(originalFile, product, originalFile.variantIndex);
        const variant = product.colors[originalFile.variantIndex];
        const storageResult = await uploadImage(supabase, file, product, variant);
        uploaded.push({ ...file, ...storageResult });
      }

      const nextColors = product.colors.map((variant) => ({ ...variant }));
      const uploadsByVariant = new Map();
      for (const file of uploaded) {
        const entries = uploadsByVariant.get(file.variantIndex) || [];
        entries.push(file);
        uploadsByVariant.set(file.variantIndex, entries);
      }

      for (const [variantIndex, variantFiles] of uploadsByVariant) {
        variantFiles.sort((a, b) => a.order - b.order);
        const variant = nextColors[variantIndex];
        const colorName = variantFiles[0].colorName;
        const urls = variantFiles.map((file) => file.publicUrl);
        nextColors[variantIndex] = {
          ...variant,
          color: slugify(colorName),
          colorName,
          colorHex: detectColorHex(colorName, variant.colorHex),
          image: urls[0],
          featuredImage: urls[0],
          images: urls,
        };
      }

      const nextImages = [];
      for (const variant of nextColors) {
        const variantImages = Array.isArray(variant.images) ? variant.images : [];
        for (const url of variantImages) {
          if (url && !nextImages.includes(url)) nextImages.push(url);
        }
      }
      const nextMainImage = nextColors[0]?.featuredImage || nextColors[0]?.image || nextImages[0] || product.image || '';
      const hasChanges = product.image !== nextMainImage || !arraysEqual(product.images || [], nextImages) || !arraysEqual(product.colors || [], nextColors);

      if (hasChanges) {
        const { data: updated, error: updateError } = await supabase
          .from('products')
          .update({
            image: nextMainImage,
            images: nextImages,
            colors: nextColors,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
          .select('id,image,images,colors')
          .single();
        if (updateError) throw new Error(`Falha ao atualizar products: ${updateError.message}`);
        if (!updated || updated.id !== productId) throw new Error('O Supabase não confirmou a atualização do produto.');
      }

      uploaded.forEach((file) => report.imported.push({
        file: file.filename,
        productId,
        productSlug: product.slug,
        productTitle: product.title,
        color: file.colorName,
        order: file.order,
        width: file.width,
        height: file.height,
        storagePath: file.storagePath,
        publicUrl: file.publicUrl,
        status: hasChanges ? file.uploadStatus : 'unchanged',
      }));
      report.productsUpdated.push({ productId, productSlug: product.slug, productTitle: product.title, status: hasChanges ? 'updated' : 'unchanged' });
    } catch (error) {
      mappedFiles.forEach((file) => report.failed.push({ file: file.filename, code: 'IMPORT_FAILED', reason: error?.message || String(error) }));
    }
  }

  report.finishedAt = new Date().toISOString();
  report.summary = {
    filesFound: imageNames.length,
    imported: report.imported.length,
    failed: report.failed.length,
    productsUpdated: report.productsUpdated.filter((item) => item.status === 'updated').length,
    productsUnchanged: report.productsUpdated.filter((item) => item.status === 'unchanged').length,
  };
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`\nImportação de imagens ${DRY_RUN ? '(simulação)' : ''}`);
  console.log(`Arquivos: ${report.summary.filesFound} | Importados: ${report.summary.imported} | Falhas: ${report.summary.failed}`);
  for (const item of report.imported) {
    console.log(`[${item.status}] ${item.file} -> ${item.productTitle} / ${item.color} / ordem ${String(item.order).padStart(2, '0')}`);
  }
  for (const item of report.failed) {
    console.error(`[FALHA:${item.code}] ${item.file}: ${item.reason}`);
  }
  console.log(`Relatório: ${REPORT_PATH}`);
  if (report.failed.length > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(`[IMPORTADOR] ${error?.message || error}`);
  process.exitCode = 1;
});
