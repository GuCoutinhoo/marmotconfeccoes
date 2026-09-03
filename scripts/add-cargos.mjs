import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const CARGO_IMAGES = [
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1584865288642-42078afe6942?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80'
];

const CARGOS_DATA = [
  {
    name: 'Calça Cargo Baggy',
    slug: 'calca-cargo-baggy',
    sku: 'MM-CRG-001',
    price: 319.90,
    features: [
      'Modelagem ampla e solta',
      'Pernas largas',
      'Bolsos cargo laterais grandes',
      'Cintura confortável',
      'Caimento pesado e relaxado',
      'Visual streetwear clássico'
    ]
  },
  {
    name: 'Calça Cargo Balloon',
    slug: 'calca-cargo-balloon',
    sku: 'MM-CRG-002',
    price: 329.90,
    features: [
      'Volume acentuado nas coxas',
      'Pernas arredondadas',
      'Barra levemente afunilada',
      'Bolsos cargo grandes',
      'Silhueta volumosa',
      'Visual moderno e marcante'
    ]
  },
  {
    name: 'Calça Cargo Convertible',
    slug: 'calca-cargo-convertible',
    sku: 'MM-CRG-003',
    price: 349.90,
    features: [
      'Partes removíveis nas pernas',
      'Zíperes horizontais de conversão',
      'Pode ser transformada em bermuda',
      'Bolsos cargo laterais',
      'Construção modular',
      'Visual técnico e funcional'
    ]
  },
  {
    name: 'Calça Cargo Distressed',
    slug: 'calca-cargo-distressed',
    sku: 'MM-CRG-004',
    price: 329.90,
    features: [
      'Áreas propositalmente desgastadas',
      'Bordas e detalhes puídos',
      'Costuras aparentes',
      'Bolsos cargo grandes',
      'Lavagem envelhecida',
      'Estética grunge e streetwear'
    ]
  },
  {
    name: 'Calça Cargo Multi Pocket',
    slug: 'calca-cargo-multi-pocket',
    sku: 'MM-CRG-005',
    price: 359.90,
    features: [
      'Grande quantidade de bolsos',
      'Bolsos laterais, frontais e sobrepostos',
      'Compartimentos utilitários',
      'Modelagem oversized',
      'Construção robusta',
      'Visual funcional e técnico'
    ]
  },
  {
    name: 'Calça Cargo Nylon',
    slug: 'calca-cargo-nylon',
    sku: 'MM-CRG-006',
    price: 319.90,
    features: [
      'Nylon leve e técnico',
      'Bolsos cargo com fechamento',
      'Cintura ajustável',
      'Reguladores nas barras',
      'Modelagem ampla',
      'Visual esportivo e funcional'
    ]
  },
  {
    name: 'Calça Cargo Panel',
    slug: 'calca-cargo-panel',
    sku: 'MM-CRG-007',
    price: 339.90,
    features: [
      'Recortes geométricos',
      'Painéis sobrepostos',
      'Bolsos integrados aos recortes',
      'Costuras aparentes',
      'Modelagem ampla',
      'Visual experimental e arquitetônico'
    ]
  },
  {
    name: 'Calça Cargo Parachute',
    slug: 'calca-cargo-parachute',
    sku: 'MM-CRG-008',
    price: 339.90,
    features: [
      'Modelagem extremamente ampla',
      'Tecido leve e fluido',
      'Bolsos cargo volumosos',
      'Cordões de ajuste nas barras',
      'Volume acentuado nas pernas',
      'Visual inspirado nos anos 2000'
    ]
  },
  {
    name: 'Calça Cargo Strap',
    slug: 'calca-cargo-strap',
    sku: 'MM-CRG-009',
    price: 349.90,
    features: [
      'Straps pendentes',
      'Fivelas ajustáveis',
      'Bolsos cargo grandes',
      'Modelagem oversized',
      'Detalhes técnicos aparentes',
      'Visual agressivo e utilitário'
    ]
  },
  {
    name: 'Calça Cargo Tactical',
    slug: 'calca-cargo-tactical',
    sku: 'MM-CRG-010',
    price: 359.90,
    features: [
      'Bolsos modulares',
      'Fivelas e reguladores',
      'Straps funcionais',
      'Tecido resistente',
      'Modelagem ampla',
      'Visual inspirado em equipamentos militares'
    ]
  },
  {
    name: 'Calça Cargo Washed',
    slug: 'calca-cargo-washed',
    sku: 'MM-CRG-011',
    price: 329.90,
    features: [
      'Lavagem envelhecida',
      'Efeito desbotado e irregular',
      'Bolsos cargo amplos',
      'Modelagem baggy',
      'Aparência propositalmente usada',
      'Visual vintage e streetwear'
    ]
  },
  {
    name: 'Calça Cargo Zip',
    slug: 'calca-cargo-zip',
    sku: 'MM-CRG-012',
    price: 339.90,
    features: [
      'Bolsos com fechamento por zíper',
      'Zíperes decorativos ou funcionais nas pernas',
      'Modelagem ampla',
      'Recortes técnicos',
      'Construção moderna',
      'Visual futurista e streetwear'
    ]
  }
];

async function run() {
  console.log('=== 1. CONECTANDO AO SUPABASE COMO ADMIN ===');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const authRes = await sb.auth.signInWithPassword({ email: 'admin@marmot.com', password: process.env.ADMIN_PASSWORD || '' });
  if (authRes.error || !authRes.data.session) {
    console.error('Falha de autenticação Admin:', authRes.error);
    process.exit(1);
  }
  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: 'Bearer ' + authRes.data.session.access_token } }
  });

  console.log('=== 2. REMOVENDO REGISTROS ANTIGOS DA CATEGORIA CARGOS (SE HOUVER) ===');
  await sbAdmin.from('products').delete().eq('category', 'cargos');
  const { data: countBefore } = await sbAdmin.from('products').select('id').eq('category', 'cargos');
  console.log('Cargos restantes após limpeza preventiva:', countBefore?.length || 0);

  console.log('=== 3. CADASTRANDO / ATUALIZANDO OS 12 MODELOS DE CALÇA CARGO NO SUPABASE ===');
  const insertedCargos = [];

  for (let i = 0; i < CARGOS_DATA.length; i++) {
    const item = CARGOS_DATA[i];
    const descriptionText = item.features.join('\n');
    const imgUrl = CARGO_IMAGES[i % CARGO_IMAGES.length];

    // Check if product with this slug already exists in DB
    const { data: existingBySlug } = await sbAdmin.from('products').select('*').eq('slug', item.slug).single();
    
    let id = existingBySlug?.id || `prod-crg-${String(i + 1).padStart(3, '0')}`;

    const defaultColors = existingBySlug?.colors?.length ? existingBySlug.colors : [
      {
        color: 'black',
        colorName: 'Pitch Black',
        colorHex: '#121212',
        featuredImage: imgUrl,
        images: [imgUrl],
        image: imgUrl
      }
    ];

    const fullProductObj = {
      id,
      slug: item.slug,
      title: item.name,
      subtitle: item.features[0] || 'Calça Cargo Streetwear',
      description: descriptionText,
      price: existingBySlug?.price || item.price,
      promoPrice: existingBySlug?.promo_price ?? null,
      category: 'cargos',
      subcategory: 'Cargos',
      collection: 'Coleção Marmot Cargo & Utilitário 2026',
      tags: ['Cargos', 'Calças', 'Streetwear', 'Utilitário'],
      rating: 5.0,
      reviewCount: existingBySlug?.review_count || (10 + (i % 8)),
      stockCount: existingBySlug?.stock_count || (20 + (i % 6)),
      sku: existingBySlug?.sku || item.sku,
      sizes: existingBySlug?.sizes?.length ? existingBySlug.sizes : ['38', '40', '42', '44', '46'],
      colors: defaultColors,
      image: existingBySlug?.image || imgUrl,
      images: existingBySlug?.images?.length ? existingBySlug.images : [imgUrl],
      details: item.features,
      careInstructions: [
        'Lavar do avesso com água fria',
        'Não alvejar nem centrifugar em alta rotação',
        'Secar à sombra em varal'
      ],
      composition: ['100% Algodão Ripstop Encorpado / Tecido Técnico de Alta Resistência'],
      weight: 0.65,
      height: 6,
      width: 28,
      length: 36,
      isNewRelease: true,
      isBestSeller: i < 3,
      featured: true,
      status: 'active',
      createdAt: existingBySlug?.created_at || new Date().toISOString()
    };

    const row = {
      id,
      slug: item.slug,
      title: item.name,
      subtitle: item.features[0],
      description: descriptionText,
      price: fullProductObj.price,
      promo_price: fullProductObj.promoPrice,
      category: 'cargos',
      subcategory: 'Cargos',
      collection: 'Coleção Marmot Cargo & Utilitário 2026',
      tags: ['Cargos', 'Calças', 'Streetwear', 'Utilitário'],
      rating: 5.0,
      review_count: fullProductObj.reviewCount,
      stock_count: fullProductObj.stockCount,
      sku: fullProductObj.sku,
      sizes: fullProductObj.sizes,
      colors: defaultColors,
      image: fullProductObj.image,
      images: fullProductObj.images,
      details: item.features,
      care_instructions: fullProductObj.careInstructions,
      composition: fullProductObj.composition,
      weight: fullProductObj.weight,
      height: fullProductObj.height,
      width: fullProductObj.width,
      length: fullProductObj.length,
      is_new_release: true,
      is_best_seller: i < 3,
      featured: true,
      status: 'active',
      data: fullProductObj,
      updated_at: new Date().toISOString()
    };

    if (existingBySlug) {
      console.log(`   ↻ Reutilizando registro existente para ${item.name} (ID: ${id})`);
      const { error: upErr } = await sbAdmin.from('products').update(row).eq('id', id);
      if (upErr) console.error(`Erro ao atualizar ${item.name}:`, upErr);
      else insertedCargos.push(fullProductObj);
    } else {
      row.created_at = new Date().toISOString();
      const { error: insErr } = await sbAdmin.from('products').insert(row);
      if (insErr) {
        console.error(`Erro ao inserir ${item.name}:`, insErr);
      } else {
        console.log(`   ✓ [${i + 1}/${CARGOS_DATA.length}] Inserido novo produto: ${item.name} (ID: ${id} | Slug: ${item.slug})`);
        insertedCargos.push(fullProductObj);
      }
    }
  }

  console.log('=== 4. ATUALIZANDO CATEGORIA CARGOS NO SUPABASE ===');
  const { data: catCargos } = await sbAdmin.from('categories').select('*').eq('id', 'cargos').single();
  if (catCargos) {
    const updatedData = { ...catCargos.data, productCount: 12 };
    await sbAdmin.from('categories').update({
      product_count: 12,
      data: updatedData,
      updated_at: new Date().toISOString()
    }).eq('id', 'cargos');
    console.log('Categoria Cargos atualizada para product_count = 12 no Supabase.');
  }

  console.log('=== 5. SINCRONIZANDO ARQUIVOS LOCAIS E CATÁLOGO ===');
  const { data: allDbProds } = await sbAdmin.from('products').select('*').order('created_at', { ascending: true });
  console.log('Total de produtos no banco após inserção das cargos:', allDbProds?.length);

  const formattedAll = allDbProds.map(p => {
    if (p.data) return p.data;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle || '',
      description: p.description,
      price: p.price,
      promoPrice: p.promo_price,
      category: p.category,
      subcategory: p.subcategory || 'Cargos',
      collection: p.collection || 'Coleção Marmot Atelier',
      tags: p.tags || ['Streetwear'],
      rating: p.rating || 5.0,
      reviewCount: p.review_count || 0,
      stockCount: p.stock_count || 20,
      sku: p.sku,
      sizes: p.sizes || ['38', '40', '42', '44', '46'],
      colors: p.colors || [],
      image: p.image,
      images: p.images || [p.image],
      details: p.details || [],
      careInstructions: p.care_instructions || [],
      composition: p.composition || ['100% Algodão Ripstop'],
      weight: p.weight || 0.65,
      height: p.height || 6,
      width: p.width || 28,
      length: p.length || 36,
      isNewRelease: p.is_new_release ?? true,
      isBestSeller: p.is_best_seller ?? false,
      featured: p.featured ?? true,
      status: p.status || 'active',
      createdAt: p.created_at
    };
  });

  fs.writeFileSync('data/store_products.json', JSON.stringify(formattedAll, null, 2), 'utf8');
  fs.writeFileSync('data/products.json', JSON.stringify(formattedAll, null, 2), 'utf8');

  // Part 1 catalog
  const part1Code = 'import { Product } from \'../types\';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ' + JSON.stringify(formattedAll, null, 2) + ';\n';
  fs.writeFileSync('src/data/catalog90ProductsPart1.ts', part1Code, 'utf8');

  // Update store_categories.json
  if (fs.existsSync('data/store_categories.json')) {
    const cats = JSON.parse(fs.readFileSync('data/store_categories.json', 'utf8'));
    cats.forEach(c => {
      if (c.id === 'cargos' || c.slug === 'cargos') {
        c.productCount = 12;
      }
    });
    fs.writeFileSync('data/store_categories.json', JSON.stringify(cats, null, 2), 'utf8');
  }

  console.log('=== 6. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: crgInDb } = await sbAdmin.from('products').select('id, title, slug, price, category, subcategory').eq('category', 'cargos');
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA CARGOS NO BANCO: ${crgInDb?.length}`);
  crgInDb?.forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.title} | ID: ${t.id} | Slug: ${t.slug} | Cat: ${t.category} | Sub: ${t.subcategory}`);
  });

  const { data: allTotals } = await sbAdmin.from('products').select('category');
  const summary = {};
  allTotals?.forEach(p => { summary[p.category] = (summary[p.category] || 0) + 1; });
  console.log('DISTRIBUIÇÃO GERAL POR CATEGORIA NO BANCO:', summary);
  console.log('TOTAL GERAL NO BANCO:', allTotals?.length);
}

run();
