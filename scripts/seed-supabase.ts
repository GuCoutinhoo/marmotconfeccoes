import { createClient } from '@supabase/supabase-js';
import { INITIAL_8_CATEGORIES } from '../src/data/categories';
import { MOCK_PRODUCTS } from '../src/data/mockProducts';
import { INITIAL_COUPONS } from '../src/data/coupons';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedData() {
  console.log('--- POVOANDO DADOS DO CATÁLOGO NO SUPABASE ---');

  // 1. Categories
  console.log(`Sincronizando ${INITIAL_8_CATEGORIES.length} categorias...`);
  for (const cat of INITIAL_8_CATEGORIES) {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      tagline: cat.tagline || '',
      description: cat.description || '',
      image: cat.image || '',
      subcategories: cat.subcategories || [],
      product_count: cat.productCount || 0,
      order: cat.order ?? 0,
      active: cat.active ?? true,
      data: cat,
    });
    if (error) {
      console.error(`Erro ao inserir categoria ${cat.name}:`, error.message);
    }
  }
  console.log('✅ Categorias sincronizadas no Supabase!');

  // 2. Products
  console.log(`Sincronizando ${MOCK_PRODUCTS.length} produtos...`);
  for (const prod of MOCK_PRODUCTS) {
    const { error } = await supabase.from('products').upsert({
      id: prod.id,
      slug: prod.slug,
      title: prod.title,
      subtitle: prod.subtitle || '',
      description: prod.description || '',
      price: prod.price,
      promo_price: prod.promoPrice || null,
      category: prod.category,
      subcategory: prod.subcategory || '',
      collection: prod.collection || '',
      tags: prod.tags || [],
      rating: prod.rating || 5.0,
      review_count: prod.reviewCount || 0,
      stock_count: prod.stockCount ?? 20,
      sku: prod.sku || '',
      sizes: prod.sizes || [],
      colors: prod.colors || [],
      image: prod.image || '',
      images: prod.images || [],
      details: prod.details || [],
      care_instructions: prod.careInstructions || [],
      composition: prod.composition || [],
      weight: prod.weight || 0.35,
      height: prod.height || 4.0,
      width: prod.width || 20.0,
      length: prod.length || 25.0,
      is_new_release: prod.isNewRelease || false,
      is_best_seller: prod.isBestSeller || false,
      featured: prod.featured || false,
      status: prod.status || 'active',
      data: prod,
    });
    if (error) {
      console.error(`Erro ao inserir produto ${prod.title}:`, error.message);
    }
  }
  console.log('✅ Produtos sincronizados no Supabase!');

  // 3. Coupons
  console.log(`Sincronizando ${INITIAL_COUPONS.length} cupons...`);
  for (const coup of INITIAL_COUPONS) {
    const { error } = await supabase.from('coupons').upsert({
      code: coup.code,
      discount_percentage: coup.discountValue || 10,
      discount_value: coup.discountValue || 10,
      discount_type: coup.discountType || 'percentage',
      min_order_value: coup.minOrderValue || 0,
      description: coup.description || '',
      active: true,
      data: coup,
    });
    if (error) {
      console.error(`Erro ao inserir cupom ${coup.code}:`, error.message);
    }
  }
  console.log('✅ Cupons sincronizados no Supabase!');

  console.log('--- SINCRONIZAÇÃO INICIAL FINALIZADA COM SUCESSO ---');
}

seedData();
