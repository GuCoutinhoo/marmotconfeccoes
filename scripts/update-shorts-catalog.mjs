import fs from 'fs';
import path from 'path';

// Authoritative mapping for shorts
const SHORTS_MODELS = [
  {
    id: 'prod-sho-001',
    title: 'Shorts Cargo Baggy',
    slug: 'shorts-cargo-baggy',
    price: 249.90,
    defaultImage: '/Shorts Cargo Baggy - cor preto.png',
    images: [
      '/Shorts Cargo Baggy - cor preto.png',
      '/Shorts Cargo Baggy - cor verde oliva.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Cargo Baggy - cor preto.png',
      },
      {
        color: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#556B2F',
        image: '/Shorts Cargo Baggy - cor verde oliva.png',
      },
    ],
  },
  {
    id: 'prod-sho-002',
    title: 'Shorts Mesh Sport',
    slug: 'shorts-mesh-sport',
    price: 229.90,
    defaultImage: '/Shorts Mesh Sport - cor preto.png',
    images: [
      '/Shorts Mesh Sport - cor preto.png',
      '/Shorts Mesh Sport - cor off white.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Mesh Sport - cor preto.png',
      },
      {
        color: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        image: '/Shorts Mesh Sport - cor off white.png',
      },
    ],
  },
  {
    id: 'prod-sho-003',
    title: 'Shorts Baggy Denim',
    slug: 'shorts-baggy-denim',
    price: 269.90,
    defaultImage: '/Shorts Baggy Denim - cor preto.png',
    images: [
      '/Shorts Baggy Denim - cor preto.png',
      '/Shorts Baggy Denim - cor bege.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Baggy Denim - cor preto.png',
      },
      {
        color: 'bege',
        colorName: 'Bege',
        colorHex: '#D2B48C',
        image: '/Shorts Baggy Denim - cor bege.png',
      },
    ],
  },
  {
    id: 'prod-sho-004',
    title: 'Shorts Denim Washed',
    slug: 'shorts-denim-washed',
    price: 259.90,
    defaultImage: '/Shorts Denim Washed - cor preto lavado.png',
    images: [
      '/Shorts Denim Washed - cor preto lavado.png',
      '/Shorts Denim Washed - cor azul claro.png',
    ],
    variants: [
      {
        color: 'preto-lavado',
        colorName: 'Preto Lavado',
        colorHex: '#2B2B2B',
        image: '/Shorts Denim Washed - cor preto lavado.png',
      },
      {
        color: 'azul-claro',
        colorName: 'Azul Claro',
        colorHex: '#87CEEB',
        image: '/Shorts Denim Washed - cor azul claro.png',
      },
    ],
  },
  {
    id: 'prod-sho-005',
    title: 'Shorts Distressed',
    slug: 'shorts-distressed',
    price: 269.90,
    defaultImage: '/Shorts Distressed - cor preto.png',
    images: [
      '/Shorts Distressed - cor preto.png',
      '/Shorts Distressed - cor jeans claro.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Distressed - cor preto.png',
      },
      {
        color: 'jeans-claro',
        colorName: 'Jeans Claro',
        colorHex: '#99BADD',
        image: '/Shorts Distressed - cor jeans claro.png',
      },
    ],
  },
  {
    id: 'prod-sho-006',
    title: 'Shorts Parachute',
    slug: 'shorts-parachute',
    price: 239.90,
    defaultImage: '/Shorts Parachute - cor preto.png',
    images: [
      '/Shorts Parachute - cor preto.png',
      '/Shorts Parachute - cor verde oliva.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Parachute - cor preto.png',
      },
      {
        color: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#556B2F',
        image: '/Shorts Parachute - cor verde oliva.png',
      },
    ],
  },
  {
    id: 'prod-sho-007',
    title: 'Shorts Tech Nylon',
    slug: 'shorts-tech-nylon',
    price: 249.90,
    defaultImage: '/Shorts Tech Nylon - cor preto.png',
    images: [
      '/Shorts Tech Nylon - cor preto.png',
      '/Shorts Tech Nylon - cor cinza.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Tech Nylon - cor preto.png',
      },
      {
        color: 'cinza',
        colorName: 'Cinza',
        colorHex: '#708090',
        image: '/Shorts Tech Nylon - cor cinza.png',
      },
    ],
  },
  {
    id: 'prod-sho-008',
    title: 'Shorts Flame',
    slug: 'shorts-flame',
    price: 259.90,
    defaultImage: '/Shorts Flame - cor preto.png',
    images: [
      '/Shorts Flame - cor preto.png',
      '/Shorts Flame - cor off white.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Flame - cor preto.png',
      },
      {
        color: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        image: '/Shorts Flame - cor off white.png',
      },
    ],
  },
  {
    id: 'prod-sho-009',
    title: 'Shorts Minimal',
    slug: 'shorts-minimal',
    price: 219.90,
    defaultImage: '/Shorts Minimal - cor preto.png',
    images: [
      '/Shorts Minimal - cor preto.png',
      '/Shorts Minimal - cor bege.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Minimal - cor preto.png',
      },
      {
        color: 'bege',
        colorName: 'Bege',
        colorHex: '#D2B48C',
        image: '/Shorts Minimal - cor bege.png',
      },
    ],
  },
  {
    id: 'prod-sho-010',
    title: 'Shorts Panel',
    slug: 'shorts-panel',
    price: 259.90,
    defaultImage: '/Shorts Panel - cor preto.png',
    images: [
      '/Shorts Panel - cor preto.png',
      '/Shorts Panel - cor caqui.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Panel - cor preto.png',
      },
      {
        color: 'caqui',
        colorName: 'Caqui',
        colorHex: '#C3B091',
        image: '/Shorts Panel - cor caqui.png',
      },
    ],
  },
  {
    id: 'prod-sho-011',
    title: 'Shorts Graphic',
    slug: 'shorts-graphic',
    price: 249.90,
    defaultImage: '/Shorts Graphic - cor preto.png',
    images: [
      '/Shorts Graphic - cor preto.png',
      '/Shorts Graphic - cor marrom.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Graphic - cor preto.png',
      },
      {
        color: 'marrom',
        colorName: 'Marrom',
        colorHex: '#5C4033',
        image: '/Shorts Graphic - cor marrom.png',
      },
    ],
  },
  {
    id: 'prod-sho-012',
    title: 'Shorts Side Stripe',
    slug: 'shorts-side-stripe',
    price: 239.90,
    defaultImage: '/Shorts Side Stripe - cor preto.png',
    images: [
      '/Shorts Side Stripe - cor preto.png',
      '/Shorts Side Stripe - cor off white.png',
    ],
    variants: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Side Stripe - cor preto.png',
      },
      {
        color: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        image: '/Shorts Side Stripe - cor off white.png',
      },
    ],
  },
];

function updateProductsCatalog(products) {
  let updatedCount = 0;

  // Process all products
  const updatedProducts = products.map((product) => {
    if (product.category !== 'shorts') return product;

    // Find matching model by ID or slug or title
    const match = SHORTS_MODELS.find(
      (m) =>
        m.id === product.id ||
        m.slug === product.slug ||
        m.title.toLowerCase() === (product.title || product.name || '').toLowerCase()
    );

    if (!match) return product;

    updatedCount++;

    const updatedColors = match.variants.map((v) => ({
      color: v.color,
      colorName: v.colorName,
      colorHex: v.colorHex,
      image: v.image,
      featuredImage: v.image,
      images: [v.image],
    }));

    return {
      ...product,
      title: match.title,
      name: match.title,
      slug: match.slug,
      price: match.price || product.price,
      image: match.defaultImage,
      images: match.images,
      colors: updatedColors,
    };
  });

  return { updatedProducts, updatedCount };
}

// 1. Update data/store_products.json
const storeProductsPath = path.resolve('data/store_products.json');
if (fs.existsSync(storeProductsPath)) {
  const prods = JSON.parse(fs.readFileSync(storeProductsPath, 'utf8'));
  const { updatedProducts, updatedCount } = updateProductsCatalog(prods);
  fs.writeFileSync(storeProductsPath, JSON.stringify(updatedProducts, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedCount} shorts in ${storeProductsPath}`);
}

// 2. Update data/products.json
const productsJsonPath = path.resolve('data/products.json');
if (fs.existsSync(productsJsonPath)) {
  const prods = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
  const { updatedProducts, updatedCount } = updateProductsCatalog(prods);
  fs.writeFileSync(productsJsonPath, JSON.stringify(updatedProducts, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedCount} shorts in ${productsJsonPath}`);
}

// 3. Update src/data/catalog90ProductsPart1.ts
const catalogPart1Path = path.resolve('src/data/catalog90ProductsPart1.ts');
if (fs.existsSync(catalogPart1Path)) {
  const prods = JSON.parse(fs.readFileSync(storeProductsPath, 'utf8'));
  const fileContent = `import { Product } from '../types';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ${JSON.stringify(prods, null, 2)};\n`;
  fs.writeFileSync(catalogPart1Path, fileContent, 'utf8');
  console.log(`✓ Updated catalog90ProductsPart1.ts with ${prods.length} products`);
}

console.log('Update script completed successfully.');
