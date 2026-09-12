import fs from 'fs';
import path from 'path';

// Authoritative mapping
const CAMISETA_IMAGE_MAPPINGS = {
  'prod-cam-001': {
    defaultImage: '/Camiseta Contrast Stitch - Preto.png',
    images: [
      '/Camiseta Contrast Stitch - Preto.png',
      '/Camiseta Contrast Stitch - Bege.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        image: '/Camiseta Contrast Stitch - Preto.png',
      },
      {
        colorKey: 'bege',
        colorName: 'Bege',
        image: '/Camiseta Contrast Stitch - Bege.png',
      },
    ],
  },
  'prod-cam-002': {
    defaultImage: '/Camiseta Double Layer - Bege e Marrom.png',
    images: [
      '/Camiseta Double Layer - Bege e Marrom.png',
      '/Camiseta Double Layer - Cinza e Preto.png',
    ],
    variants: [
      {
        colorKey: 'bege-marrom',
        colorName: 'Bege + Marrom',
        image: '/Camiseta Double Layer - Bege e Marrom.png',
      },
      {
        colorKey: 'preto-cinza',
        colorName: 'Preto + Cinza',
        image: '/Camiseta Double Layer - Cinza e Preto.png',
      },
    ],
  },
  'prod-cam-003': {
    defaultImage: '/Camiseta Drop Shoulder - Marrom.png',
    images: [
      '/Camiseta Drop Shoulder - Marrom.png',
      '/Camiseta Drop Shoulder - Cinza.png',
    ],
    variants: [
      {
        colorKey: 'marrom',
        colorName: 'Marrom',
        image: '/Camiseta Drop Shoulder - Marrom.png',
      },
      {
        colorKey: 'cinza',
        colorName: 'Cinza',
        image: '/Camiseta Drop Shoulder - Cinza.png',
      },
    ],
  },
  'prod-cam-004': {
    defaultImage: '/Camiseta Heavy Boxy - Preto.png',
    images: [
      '/Camiseta Heavy Boxy - Preto.png',
      '/Camiseta Heavy Boxy - Branco.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        image: '/Camiseta Heavy Boxy - Preto.png',
      },
      {
        colorKey: 'offwhite',
        colorName: 'Off White',
        image: '/Camiseta Heavy Boxy - Branco.png',
      },
    ],
  },
  'prod-cam-005': {
    defaultImage: '/Camiseta Panel - Bege e Marrom.png',
    images: [
      '/Camiseta Panel - Bege e Marrom.png',
      '/Camiseta Panel - Preto e Cinza.png',
    ],
    variants: [
      {
        colorKey: 'bege-marrom',
        colorName: 'Bege + Marrom',
        image: '/Camiseta Panel - Bege e Marrom.png',
      },
      {
        colorKey: 'preto-cinza',
        colorName: 'Preto + Cinza',
        image: '/Camiseta Panel - Preto e Cinza.png',
      },
    ],
  },
  'prod-cam-006': {
    defaultImage: '/Camiseta Pocket Utility - Verde.png',
    images: [
      '/Camiseta Pocket Utility - Verde.png',
      '/Camiseta Pocket Utility - Preto.png',
    ],
    variants: [
      {
        colorKey: 'verde',
        colorName: 'Verde',
        image: '/Camiseta Pocket Utility - Verde.png',
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        image: '/Camiseta Pocket Utility - Preto.png',
      },
    ],
  },
  'prod-cam-007': {
    defaultImage: '/Camiseta Raglan Oversized - Branco e Preto.png',
    images: [
      '/Camiseta Raglan Oversized - Branco e Preto.png',
      '/Camiseta Raglan Oversized - Preto e Cinza.png',
    ],
    variants: [
      {
        colorKey: 'preto-branco',
        colorName: 'Preto + Branco',
        image: '/Camiseta Raglan Oversized - Branco e Preto.png',
      },
      {
        colorKey: 'preto-cinza',
        colorName: 'Preto + Cinza',
        image: '/Camiseta Raglan Oversized - Preto e Cinza.png',
      },
    ],
  },
  'prod-cam-008': {
    defaultImage: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
    images: [
      '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
    ],
    variants: [
      {
        colorKey: 'Preto',
        colorName: 'Off-Black',
        image: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
      },
    ],
  },
  'prod-cam-009': {
    defaultImage: '/Camiseta Striped Heavy - Preto e Branco.png',
    images: [
      '/Camiseta Striped Heavy - Preto e Branco.png',
      '/Camiseta Striped Heavy - Bege e Marrom.png',
    ],
    variants: [
      {
        colorKey: 'branco-e-preto',
        colorName: 'Branco e Preto',
        image: '/Camiseta Striped Heavy - Preto e Branco.png',
      },
      {
        colorKey: 'marrom-e-bege',
        colorName: 'Marrom e Bege',
        image: '/Camiseta Striped Heavy - Bege e Marrom.png',
      },
    ],
  },
  'prod-cam-010': {
    defaultImage: '/Camiseta Washed Vintage - Cinza escuro.png',
    images: [
      '/Camiseta Washed Vintage - Cinza escuro.png',
      '/Camiseta Washed Vintage - Cinza Claro.png',
    ],
    variants: [
      {
        colorKey: 'cinza-escuro',
        colorName: 'Cinza Escuro',
        image: '/Camiseta Washed Vintage - Cinza escuro.png',
      },
      {
        colorKey: 'cinza',
        colorName: 'Cinza',
        image: '/Camiseta Washed Vintage - Cinza Claro.png',
      },
    ],
  },
};

function updateProductList(products) {
  let updatedCount = 0;
  const updatedProducts = products.map((product) => {
    const mapping = CAMISETA_IMAGE_MAPPINGS[product.id];
    if (!mapping) return product;

    updatedCount++;
    const updatedColors = (product.colors || []).map((c) => {
      const match = mapping.variants.find(
        (v) =>
          (c.color && v.colorKey.toLowerCase() === c.color.toLowerCase()) ||
          (c.colorName && v.colorName.toLowerCase() === c.colorName.toLowerCase())
      );
      if (match) {
        return {
          ...c,
          image: match.image,
          featuredImage: match.image,
          images: [match.image],
        };
      }
      return c;
    });

    return {
      ...product,
      image: mapping.defaultImage,
      images: mapping.images,
      colors: updatedColors,
    };
  });

  return { updatedProducts, updatedCount };
}

// 1. Update data/store_products.json
const storeProductsPath = path.resolve('data/store_products.json');
if (fs.existsSync(storeProductsPath)) {
  const prods = JSON.parse(fs.readFileSync(storeProductsPath, 'utf8'));
  const { updatedProducts, updatedCount } = updateProductList(prods);
  fs.writeFileSync(storeProductsPath, JSON.stringify(updatedProducts, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedCount} products in ${storeProductsPath}`);
}

// 2. Update data/products.json
const productsJsonPath = path.resolve('data/products.json');
if (fs.existsSync(productsJsonPath)) {
  const prods = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
  const { updatedProducts, updatedCount } = updateProductList(prods);
  fs.writeFileSync(productsJsonPath, JSON.stringify(updatedProducts, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedCount} products in ${productsJsonPath}`);
}

// 3. Update src/data/catalog90ProductsPart1.ts
const catalogPart1Path = path.resolve('src/data/catalog90ProductsPart1.ts');
if (fs.existsSync(catalogPart1Path)) {
  const prods = JSON.parse(fs.readFileSync(storeProductsPath, 'utf8'));
  const fileContent = `import { Product } from '../types';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ${JSON.stringify(prods, null, 2)};\n`;
  fs.writeFileSync(catalogPart1Path, fileContent, 'utf8');
  console.log(`✓ Updated catalog90ProductsPart1.ts with ${prods.length} products`);
}

console.log('Done!');
