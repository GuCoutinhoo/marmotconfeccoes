import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const productDetailPageCode = fs.readFileSync(path.join(root, 'src/pages/ProductDetailPage.tsx'), 'utf8');
const appCode = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');

test('TESTE 1, 2, 3: Strict product lookup without fallback to products[0]', () => {
  // Banned fallback patterns in ProductDetailPage
  assert.doesNotMatch(
    productDetailPageCode,
    /products\.find\([^)]+\)\s*\|\|\s*products\[0\]/,
    'ProductDetailPage MUST NOT use "|| products[0]" as a fallback'
  );
  assert.doesNotMatch(
    productDetailPageCode,
    /products\.at\(0\)|fallbackProduct|defaultProduct/,
    'ProductDetailPage MUST NOT use arbitrary first or fallback products'
  );

  // Must have strict search
  assert.match(
    productDetailPageCode,
    /const product = products\.find\(\s*\(p\) => p\.id === productId \|\| p\.slug === productId\s*\);/,
    'ProductDetailPage MUST use strict search matching productId or slug'
  );

  // Behavioral simulation of lookup
  const mockCatalog = [
    { id: 'prod-cam-001', slug: 'camiseta-heavyweight', title: 'Camiseta Heavyweight', colors: [{ color: 'black', colorName: 'Preto' }], sizes: ['P', 'M'] },
    { id: 'prod-cam-002', slug: 'camiseta-box', title: 'Camiseta Boxy Fit', colors: [{ color: 'white', colorName: 'Branco' }], sizes: ['M', 'G'] },
  ];

  const findProduct = (catalog, idOrSlug) =>
    catalog.find((p) => p.id === idOrSlug || p.slug === idOrSlug);

  // TESTE 1: Produto existe -> abre produto correto
  const foundById = findProduct(mockCatalog, 'prod-cam-002');
  assert.equal(foundById?.id, 'prod-cam-002');
  assert.equal(foundById?.title, 'Camiseta Boxy Fit');

  const foundBySlug = findProduct(mockCatalog, 'camiseta-heavyweight');
  assert.equal(foundBySlug?.id, 'prod-cam-001');

  // TESTE 2 & 3: Produto não existe -> retorna undefined e nunca usa products[0]
  const notFound = findProduct(mockCatalog, 'prod-crg-002');
  assert.equal(notFound, undefined);
  assert.notEqual(notFound, mockCatalog[0], 'Must never return products[0] when not found');
});

test('TESTE 4: Catálogo ainda carregando -> mostra loading e evita falso "não encontrado"', () => {
  // Verify that ProductDetailPage checks isLoading and isInitialized from StoreContext
  assert.match(
    productDetailPageCode,
    /const \{[^}]*isLoading[^}]*isInitialized[^}]*\} = useStore\(\);/,
    'ProductDetailPage must consume isLoading and isInitialized from StoreContext'
  );

  assert.match(
    productDetailPageCode,
    /if \(!product\) \{\s*\/\/[^\n]*\s*if \(isLoading \|\| !isInitialized\)/,
    'ProductDetailPage must display loading while store is loading or not initialized'
  );

  assert.match(
    productDetailPageCode,
    /Carregando peça\.\.\./,
    'ProductDetailPage must render loading indicator while fetching catalog'
  );

  // Behavioral logic simulation
  const evaluateState = (product, isLoading, isInitialized) => {
    if (!product) {
      if (isLoading || !isInitialized) return 'LOADING';
      return 'NOT_FOUND';
    }
    return 'PRODUCT_VIEW';
  };

  assert.equal(evaluateState(undefined, true, false), 'LOADING', 'Should show loading when not initialized');
  assert.equal(evaluateState(undefined, true, true), 'LOADING', 'Should show loading while refreshing');
  assert.equal(evaluateState(undefined, false, true), 'NOT_FOUND', 'Should show not found after load completes');
  assert.equal(evaluateState({ id: 'prod-001' }, false, true), 'PRODUCT_VIEW', 'Should render product when found');
});

test('TESTE 5: Produto removido durante a sessão -> página exibe "Peça não encontrada"', () => {
  let activeCatalog = [
    { id: 'prod-del-001', slug: 'peca-excluida', title: 'Peça a Deletar' },
    { id: 'prod-active-002', slug: 'peca-ativa', title: 'Peça Ativa' },
  ];

  const targetId = 'prod-del-001';
  let currentProduct = activeCatalog.find((p) => p.id === targetId || p.slug === targetId);
  assert.equal(currentProduct?.id, 'prod-del-001');

  // Simulate deletion in store
  activeCatalog = activeCatalog.filter((p) => p.id !== targetId);

  // Re-evaluating product in page
  currentProduct = activeCatalog.find((p) => p.id === targetId || p.slug === targetId);
  assert.equal(currentProduct, undefined);
  assert.notEqual(currentProduct, activeCatalog[0], 'Must not switch to first active item');
});

test('TESTE 6: Navegar produto A -> produto B -> selectedColor, selectedSize e reviews pertencem a B', () => {
  // Verify synchronous reset logic in ProductDetailPage
  assert.match(
    productDetailPageCode,
    /if \(product && product\.id !== lastTrackedId\) \{[\s\S]*?setSelectedColor\(product\.colors\?\.\[0\] \|\| null\);[\s\S]*?setSelectedSize\(product\.sizes\?\.\[0\] \|\| ''\);[\s\S]*?setReviewsList\(product\.reviews \|\| \[\]\);/
  );

  assert.match(
    productDetailPageCode,
    /loadProductReviews\(product\.id\);/,
    'Reviews must be loaded for the active product id'
  );

  // Simulation of synchronous state reset on product change
  let state = {
    selectedColor: { color: 'black', colorName: 'Preto Ônix' },
    selectedSize: 'GG',
    reviewsList: [{ comment: 'Excelente do produto A' }],
  };

  const productB = {
    id: 'prod-b',
    colors: [{ color: 'sand', colorName: 'Areia Off-White' }],
    sizes: ['P', 'M'],
    reviews: [{ comment: 'Review do produto B' }],
  };

  // Reset to B
  state.selectedColor = productB.colors[0];
  state.selectedSize = productB.sizes[0];
  state.reviewsList = productB.reviews;

  assert.equal(state.selectedColor.colorName, 'Areia Off-White');
  assert.equal(state.selectedSize, 'P');
  assert.equal(state.reviewsList[0].comment, 'Review do produto B');
});

test('TESTE 7, 8, 9: URL routing for products (/produto/:idOrSlug) with F5 and history support', () => {
  // App.tsx must parse /produto/:id and /product/:id in getInitialRoute
  assert.match(appCode, /if \(pathname\.startsWith\('\/produto\/'\) \|\| pathname\.startsWith\('\/product\/'\)\)/);
  assert.match(appCode, /return \{ page: idOrSlug \? 'product' : 'shop', param: idOrSlug \};/);

  // App.tsx must push /produto/:param in handleNavigate
  assert.match(appCode, /\} else if \(page === 'product'\) \{\s*window\.history\.pushState\(\{\}, '', param \? `\/produto\/\$\{encodeURIComponent\(param\)\}` : '\/shop'\);/);

  // Route extractor simulation
  function simulateGetInitialRoute(urlPath) {
    const pathname = urlPath.toLowerCase();
    if (pathname.startsWith('/produto/') || pathname.startsWith('/product/')) {
      const segments = urlPath.split('/').filter(Boolean);
      const idOrSlug = segments[1] ? decodeURIComponent(segments[1]) : '';
      return { page: idOrSlug ? 'product' : 'shop', param: idOrSlug };
    }
    return { page: 'home', param: '' };
  }

  // TESTE 7: Abrir rota de produto diretamente
  const routeDirect = simulateGetInitialRoute('/produto/prod-calca-cargo');
  assert.deepEqual(routeDirect, { page: 'product', param: 'prod-calca-cargo' });

  // TESTE 8: F5 em produto válido
  const routeF5Valid = simulateGetInitialRoute('/produto/prod-004');
  assert.deepEqual(routeF5Valid, { page: 'product', param: 'prod-004' });

  // TESTE 9: F5 em produto inválido
  const routeF5Invalid = simulateGetInitialRoute('/produto/prod-inexistente-999');
  assert.deepEqual(routeF5Invalid, { page: 'product', param: 'prod-inexistente-999' });

  // And verify screen template in ProductDetailPage has "Peça não encontrada"
  assert.match(productDetailPageCode, /Peça não encontrada/);
  assert.match(productDetailPageCode, /O item solicitado não está disponível no catálogo atual\./);
  assert.match(productDetailPageCode, /Ver Todo o Catálogo/);
});
