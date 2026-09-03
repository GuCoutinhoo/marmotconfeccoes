import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const TENIS_DATA = [
  {
    name: 'Tênis Chunky',
    slug: 'tenis-chunky',
    sku: 'MM-TEN-001',
    price: 549.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'grey_white',
        colorName: 'Cinza + Branco',
        colorHex: '#8A909A',
        featuredImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Solado alto e volumoso',
      'Construção robusta',
      'Painéis sobrepostos',
      'Visual inspirado nos anos 2000',
      'Silhueta pesada'
    ]
  },
  {
    name: 'Tênis Skate',
    slug: 'tenis-skate',
    sku: 'MM-TEN-002',
    price: 499.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_white',
        colorName: 'Preto + Branco',
        colorHex: '#181818',
        featuredImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'brown_beige',
        colorName: 'Marrom + Bege',
        colorHex: '#634832',
        featuredImage: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Silhueta larga',
      'Língua acolchoada',
      'Solado reto',
      'Cabedal reforçado',
      'Visual inspirado no skate dos anos 2000'
    ]
  },
  {
    name: 'Tênis Retro Runner',
    slug: 'tenis-retro-runner',
    sku: 'MM-TEN-003',
    price: 529.90,
    promoPrice: null,
    colors: [
      {
        color: 'grey_silver',
        colorName: 'Cinza + Prata',
        colorHex: '#9EA4AD',
        featuredImage: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'black_grey',
        colorName: 'Preto + Cinza',
        colorHex: '#262626',
        featuredImage: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Inspiração em tênis de corrida antigos',
      'Mistura de mesh e camurça',
      'Solado intermediário volumoso',
      'Painéis contrastantes',
      'Visual retrô e esportivo'
    ]
  },
  {
    name: 'Tênis High Top',
    slug: 'tenis-high-top',
    sku: 'MM-TEN-004',
    price: 569.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F0EFEA',
        featuredImage: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Cano alto',
      'Estrutura reforçada no tornozelo',
      'Solado robusto',
      'Visual urbano',
      'Silhueta marcante'
    ]
  },
  {
    name: 'Tênis Low Profile',
    slug: 'tenis-low-profile',
    sku: 'MM-TEN-005',
    price: 479.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_white',
        colorName: 'Preto + Branco',
        colorHex: '#181818',
        featuredImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'brown_cream',
        colorName: 'Marrom + Creme',
        colorHex: '#5C4033',
        featuredImage: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Silhueta baixa e fina',
      'Solado discreto',
      'Construção minimalista',
      'Visual retrô',
      'Formato alongado'
    ]
  },
  {
    name: 'Tênis Tech Runner',
    slug: 'tenis-tech-runner',
    sku: 'MM-TEN-006',
    price: 579.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_graphite',
        colorName: 'Preto + Grafite',
        colorHex: '#1F2124',
        featuredImage: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'grey_silver',
        colorName: 'Cinza + Prata',
        colorHex: '#A0A5AC',
        featuredImage: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Mesh respirável',
      'Recortes técnicos',
      'Solado com aparência futurista',
      'Estrutura leve',
      'Visual esportivo e tecnológico'
    ]
  },
  {
    name: 'Tênis Distressed',
    slug: 'tenis-distressed',
    sku: 'MM-TEN-007',
    price: 539.90,
    promoPrice: null,
    colors: [
      {
        color: 'washed_black',
        colorName: 'Preto lavado',
        colorHex: '#2B2B2B',
        featuredImage: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'aged_beige',
        colorName: 'Bege envelhecido',
        colorHex: '#BFAC8E',
        featuredImage: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Acabamento propositalmente envelhecido',
      'Áreas desgastadas',
      'Solado com aparência usada',
      'Construção robusta',
      'Estética grunge'
    ]
  },
  {
    name: 'Tênis Platform',
    slug: 'tenis-platform',
    sku: 'MM-TEN-008',
    price: 589.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'charcoal',
        colorName: 'Cinza chumbo',
        colorHex: '#383D48',
        featuredImage: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Solado extremamente alto',
      'Base larga',
      'Cabedal estruturado',
      'Silhueta pesada',
      'Visual streetwear experimental'
    ]
  },
  {
    name: 'Tênis Trail Street',
    slug: 'tenis-trail-street',
    sku: 'MM-TEN-009',
    price: 569.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_grey',
        colorName: 'Preto + Cinza',
        colorHex: '#202226',
        featuredImage: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'beige_olive',
        colorName: 'Bege + Verde oliva',
        colorHex: '#606852',
        featuredImage: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Solado tratorado',
      'Cabedal com mesh e painéis reforçados',
      'Amarração técnica',
      'Estrutura robusta',
      'Inspiração em tênis de trilha e outdoor'
    ]
  },
  {
    name: 'Tênis Panel Layered',
    slug: 'tenis-panel-layered',
    sku: 'MM-TEN-010',
    price: 579.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_lead',
        colorName: 'Preto + Chumbo',
        colorHex: '#1A1D24',
        featuredImage: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'grey_offwhite',
        colorName: 'Cinza + Off White',
        colorHex: '#B0B5BD',
        featuredImage: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Vários painéis sobrepostos no cabedal',
      'Mistura de texturas e materiais',
      'Solado médio e estruturado',
      'Construção visualmente complexa',
      'Estética experimental e contemporânea'
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

  console.log('=== 2. REMOVENDO REGISTROS ANTIGOS DA CATEGORIA TÊNIS ===');
  await sbAdmin.from('products').delete().eq('category', 'tenis');
  const { data: countBefore } = await sbAdmin.from('products').select('id').eq('category', 'tenis');
  console.log('Tênis restantes após limpeza:', countBefore?.length || 0);

  console.log('=== 3. CADASTRANDO OS 10 TÊNIS NO SUPABASE COM 2 CORES CADA (20 VARIANTES) ===');
  const insertedTenis = [];

  for (let i = 0; i < TENIS_DATA.length; i++) {
    const item = TENIS_DATA[i];
    const id = `prod-ten-${String(i + 1).padStart(3, '0')}`;
    const descriptionText = item.features.join('\n');

    const colorsPayload = item.colors.map(c => ({
      color: c.color,
      colorName: c.colorName,
      colorHex: c.colorHex,
      featuredImage: c.featuredImage,
      images: c.images,
      image: c.featuredImage
    }));

    const defaultImg = colorsPayload[0].featuredImage;
    const allImages = [...new Set(colorsPayload.flatMap(c => c.images))];

    const fullProductObj = {
      id,
      slug: item.slug,
      title: item.name,
      subtitle: item.features[0] || 'Sneaker Streetwear',
      description: descriptionText,
      price: item.price,
      promoPrice: item.promoPrice,
      category: 'tenis',
      subcategory: 'Tênis',
      collection: 'Coleção Marmot Footwear Atelier 2026',
      tags: ['Tênis', 'Sneakers', 'Streetwear', 'Destaque'],
      rating: 5.0,
      reviewCount: 22 + (i % 10),
      stockCount: 18 + (i % 8),
      sku: item.sku,
      sizes: ['38', '39', '40', '41', '42', '43'],
      colors: colorsPayload,
      image: defaultImg,
      images: allImages,
      details: item.features,
      careInstructions: [
        'Limpar com pano levemente umedecido e sabão neutro',
        'Não lavar na máquina nem mergulhar em água',
        'Secar à sombra em local ventilado'
      ],
      composition: ['Couro Premium, Camurça e Mesh Respirável / Solado em Borracha Termoplástica Vulcanizada'],
      weight: 1.1,
      height: 14,
      width: 24,
      length: 34,
      isNewRelease: true,
      isBestSeller: i < 3,
      featured: true,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const row = {
      id,
      slug: item.slug,
      title: item.name,
      subtitle: item.features[0],
      description: descriptionText,
      price: item.price,
      promo_price: item.promoPrice,
      category: 'tenis',
      subcategory: 'Tênis',
      collection: 'Coleção Marmot Footwear Atelier 2026',
      tags: ['Tênis', 'Sneakers', 'Streetwear'],
      rating: 5.0,
      review_count: 22 + (i % 10),
      stock_count: 18 + (i % 8),
      sku: item.sku,
      sizes: ['38', '39', '40', '41', '42', '43'],
      colors: colorsPayload,
      image: defaultImg,
      images: allImages,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insErr } = await sbAdmin.from('products').insert(row);
    if (insErr) {
      console.error(`Erro ao inserir ${item.name}:`, insErr);
    } else {
      console.log(`   ✓ [${i + 1}/${TENIS_DATA.length}] Cadastrado: ${item.name} (ID: ${id}) -> Cores: ${item.colors.map(c => c.colorName).join(' / ')}`);
      insertedTenis.push(fullProductObj);
    }
  }

  console.log('=== 4. ATUALIZANDO CATEGORIA TÊNIS NO SUPABASE ===');
  const { data: catTen } = await sbAdmin.from('categories').select('*').eq('id', 'tenis').single();
  if (catTen) {
    const updatedData = { ...catTen.data, productCount: 10 };
    await sbAdmin.from('categories').update({
      product_count: 10,
      data: updatedData,
      updated_at: new Date().toISOString()
    }).eq('id', 'tenis');
    console.log('Categoria Tênis atualizada para product_count = 10 no Supabase.');
  }

  console.log('=== 5. SINCRONIZANDO ARQUIVOS LOCAIS E CATÁLOGO ===');
  const { data: allDbProds } = await sbAdmin.from('products').select('*').order('created_at', { ascending: true });
  console.log('Total de produtos no banco após inserção dos tênis:', allDbProds?.length);

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
      subcategory: p.subcategory || 'Tênis',
      collection: p.collection || 'Coleção Marmot Atelier',
      tags: p.tags || ['Streetwear'],
      rating: p.rating || 5.0,
      reviewCount: p.review_count || 0,
      stockCount: p.stock_count || 20,
      sku: p.sku,
      sizes: p.sizes || ['38', '39', '40', '41', '42', '43'],
      colors: p.colors || [],
      image: p.image,
      images: p.images || [p.image],
      details: p.details || [],
      careInstructions: p.care_instructions || [],
      composition: p.composition || ['Couro / Borracha Vulcanizada'],
      weight: p.weight || 1.1,
      height: p.height || 14,
      width: p.width || 24,
      length: p.length || 34,
      isNewRelease: p.is_new_release ?? true,
      isBestSeller: p.is_best_seller ?? false,
      featured: p.featured ?? true,
      status: p.status || 'active',
      createdAt: p.created_at
    };
  });

  fs.writeFileSync('data/store_products.json', JSON.stringify(formattedAll, null, 2), 'utf8');
  fs.writeFileSync('data/products.json', JSON.stringify(formattedAll, null, 2), 'utf8');

  // Part 1
  const part1Code = 'import { Product } from \'../types\';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ' + JSON.stringify(formattedAll, null, 2) + ';\n';
  fs.writeFileSync('src/data/catalog90ProductsPart1.ts', part1Code, 'utf8');

  // Update store_categories.json
  if (fs.existsSync('data/store_categories.json')) {
    const cats = JSON.parse(fs.readFileSync('data/store_categories.json', 'utf8'));
    cats.forEach(c => {
      if (c.id === 'tenis' || c.slug === 'tenis') {
        c.productCount = 10;
      }
    });
    fs.writeFileSync('data/store_categories.json', JSON.stringify(cats, null, 2), 'utf8');
  }

  console.log('=== 6. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: tenisInDb } = await sbAdmin.from('products').select('id, title, slug, price, colors').eq('category', 'tenis');
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA TÊNIS NO BANCO: ${tenisInDb?.length}`);
  let totalColorVariants = 0;
  tenisInDb?.forEach((t, idx) => {
    const colorNames = t.colors?.map(c => c.colorName).join(' / ') || 'N/A';
    totalColorVariants += (t.colors?.length || 0);
    console.log(`${idx + 1}. ${t.title} | ID: ${t.id} | Slug: ${t.slug} | Cores: [${colorNames}]`);
  });
  console.log(`TOTAL DE OPÇÕES DE CORES PERSISTIDAS: ${totalColorVariants}`);

  const { data: allTotals } = await sbAdmin.from('products').select('category');
  const summary = {};
  allTotals?.forEach(p => { summary[p.category] = (summary[p.category] || 0) + 1; });
  console.log('DISTRIBUIÇÃO GERAL POR CATEGORIA NO BANCO:', summary);
  console.log('TOTAL GERAL NO BANCO:', allTotals?.length);
}

run();
