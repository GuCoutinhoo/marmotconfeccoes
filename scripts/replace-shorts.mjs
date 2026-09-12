import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const SHORTS_DATA = [
  {
    name: 'Shorts Cargo Baggy',
    slug: 'shorts-cargo-baggy',
    sku: 'MM-SHO-001',
    price: 249.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Cargo Baggy - cor preto.png',
        images: ['/Shorts Cargo Baggy - cor preto.png']
      },
      {
        color: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#556B2F',
        featuredImage: '/Shorts Cargo Baggy - cor verde oliva.png',
        images: ['/Shorts Cargo Baggy - cor verde oliva.png']
      }
    ],
    features: [
      'Modelagem ampla e solta',
      'Bolsos cargo laterais grandes',
      'Pernas largas',
      'Cintura confortável',
      'Detalhes utilitários',
      'Visual streetwear funcional'
    ]
  },
  {
    name: 'Shorts Mesh Sport',
    slug: 'shorts-mesh-sport',
    sku: 'MM-SHO-002',
    price: 229.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Mesh Sport - cor preto.png',
        images: ['/Shorts Mesh Sport - cor preto.png']
      },
      {
        color: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        featuredImage: '/Shorts Mesh Sport - cor off white.png',
        images: ['/Shorts Mesh Sport - cor off white.png']
      }
    ],
    features: [
      'Mesh duplo premium respirável',
      'Cós elástico com cordão ajustável',
      'Modelagem esportiva oversized',
      'Toque macio e leveza extrema',
      'Perfeito para o dia a dia e lifestyle'
    ]
  },
  {
    name: 'Shorts Baggy Denim',
    slug: 'shorts-baggy-denim',
    sku: 'MM-SHO-003',
    price: 269.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Baggy Denim - cor preto.png',
        images: ['/Shorts Baggy Denim - cor preto.png']
      },
      {
        color: 'bege',
        colorName: 'Bege',
        colorHex: '#D2B48C',
        featuredImage: '/Shorts Baggy Denim - cor bege.png',
        images: ['/Shorts Baggy Denim - cor bege.png']
      }
    ],
    features: [
      'Denim 100% algodão 13oz encorpado',
      'Modelagem ultra baggy autêntica',
      'Passantes reforçados para cinto',
      'Bolsos profundos utilitários',
      'Acabamento premium Marmot Atelier'
    ]
  },
  {
    name: 'Shorts Denim Washed',
    slug: 'shorts-denim-washed',
    sku: 'MM-SHO-004',
    price: 259.90,
    promoPrice: null,
    colors: [
      {
        color: 'preto-lavado',
        colorName: 'Preto Lavado',
        colorHex: '#2B2B2B',
        featuredImage: '/Shorts Denim Washed - cor preto lavado.png',
        images: ['/Shorts Denim Washed - cor preto lavado.png']
      },
      {
        color: 'azul-claro',
        colorName: 'Azul Claro',
        colorHex: '#87CEEB',
        featuredImage: '/Shorts Denim Washed - cor azul claro.png',
        images: ['/Shorts Denim Washed - cor azul claro.png']
      }
    ],
    features: [
      'Denim com lavagem estonada artesanal',
      'Toque macio pré-encolhido',
      'Corte reto streetwear relaxado',
      'Costuras reforçadas em linha contrastante',
      'Visual vintage atemporal'
    ]
  },
  {
    name: 'Shorts Distressed',
    slug: 'shorts-distressed',
    sku: 'MM-SHO-005',
    price: 269.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Distressed - cor preto.png',
        images: ['/Shorts Distressed - cor preto.png']
      },
      {
        color: 'jeans-claro',
        colorName: 'Jeans Claro',
        colorHex: '#99BADD',
        featuredImage: '/Shorts Distressed - cor jeans claro.png',
        images: ['/Shorts Distressed - cor jeans claro.png']
      }
    ],
    features: [
      'Jeans com detalhes puídos e desfiados manuais',
      'Barra desfiada com acabamento seguro',
      'Lavagem irregular de alto contraste',
      'Modelagem ampla urbana',
      'Estética grunge contemporânea'
    ]
  },
  {
    name: 'Shorts Parachute',
    slug: 'shorts-parachute',
    sku: 'MM-SHO-006',
    price: 239.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Parachute - cor preto.png',
        images: ['/Shorts Parachute - cor preto.png']
      },
      {
        color: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#556B2F',
        featuredImage: '/Shorts Parachute - cor verde oliva.png',
        images: ['/Shorts Parachute - cor verde oliva.png']
      }
    ],
    features: [
      'Tecido parachute leve e resistente ao vento',
      'Ajustadores elásticos elásticos e tankas',
      'Modelagem volumosa funcional',
      'Bolsos embutidos com zíper invertido',
      'Secagem ultra rápida'
    ]
  },
  {
    name: 'Shorts Tech Nylon',
    slug: 'shorts-tech-nylon',
    sku: 'MM-SHO-007',
    price: 249.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Tech Nylon - cor preto.png',
        images: ['/Shorts Tech Nylon - cor preto.png']
      },
      {
        color: 'cinza',
        colorName: 'Cinza',
        colorHex: '#708090',
        featuredImage: '/Shorts Tech Nylon - cor cinza.png',
        images: ['/Shorts Tech Nylon - cor cinza.png']
      }
    ],
    features: [
      'Nylon ripstop técnico hidro-repelente',
      'Bolsos laterais com puxadores em cordão',
      'Construção anatômica ergonômica',
      'Cós em ribana elástica com cordão',
      'Visual techwear refinado'
    ]
  },
  {
    name: 'Shorts Flame',
    slug: 'shorts-flame',
    sku: 'MM-SHO-008',
    price: 259.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Flame - cor preto.png',
        images: ['/Shorts Flame - cor preto.png']
      },
      {
        color: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        featuredImage: '/Shorts Flame - cor off white.png',
        images: ['/Shorts Flame - cor off white.png']
      }
    ],
    features: [
      'Estampa gráfica lateral exclusiva Flame motif',
      'Tecido encorpado de alta gramatura',
      'Caimento estruturado baggy',
      'Bolsos laterais reforçados',
      'Destaque no streetwear internacional'
    ]
  },
  {
    name: 'Shorts Minimal',
    slug: 'shorts-minimal',
    sku: 'MM-SHO-009',
    price: 219.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Minimal - cor preto.png',
        images: ['/Shorts Minimal - cor preto.png']
      },
      {
        color: 'bege',
        colorName: 'Bege',
        colorHex: '#D2B48C',
        featuredImage: '/Shorts Minimal - cor bege.png',
        images: ['/Shorts Minimal - cor bege.png']
      }
    ],
    features: [
      'Design clean sem detalhes excessivos',
      'Silhueta minimalista elegante',
      'Algodão peletizado com toque aveludado',
      'Cós discreto com acabamento embutido',
      'Peça coringa para composição de looks'
    ]
  },
  {
    name: 'Shorts Panel',
    slug: 'shorts-panel',
    sku: 'MM-SHO-010',
    price: 259.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Panel - cor preto.png',
        images: ['/Shorts Panel - cor preto.png']
      },
      {
        color: 'caqui',
        colorName: 'Caqui',
        colorHex: '#C3B091',
        featuredImage: '/Shorts Panel - cor caqui.png',
        images: ['/Shorts Panel - cor caqui.png']
      }
    ],
    features: [
      'Painéis geométricos recortados e costurados',
      'Blocos de tecido contrastantes sutis',
      'Modelagem intermediária confortável',
      'Pespontos pesados resistentes',
      'Identidade arquitetônica streetwear'
    ]
  },
  {
    name: 'Shorts Graphic',
    slug: 'shorts-graphic',
    sku: 'MM-SHO-011',
    price: 249.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Graphic - cor preto.png',
        images: ['/Shorts Graphic - cor preto.png']
      },
      {
        color: 'marrom',
        colorName: 'Marrom',
        colorHex: '#5C4033',
        featuredImage: '/Shorts Graphic - cor marrom.png',
        images: ['/Shorts Graphic - cor marrom.png']
      }
    ],
    features: [
      'Grafismos tipográficos em silk de alto relevo',
      'Composição equilibrada editorial',
      'Tecido moletom leve não felpado',
      'Cintura alta confortável',
      'Edição limitada de lançamento'
    ]
  },
  {
    name: 'Shorts Side Stripe',
    slug: 'shorts-side-stripe',
    sku: 'MM-SHO-012',
    price: 239.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: '/Shorts Side Stripe - cor preto.png',
        images: ['/Shorts Side Stripe - cor preto.png']
      },
      {
        color: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        featuredImage: '/Shorts Side Stripe - cor off white.png',
        images: ['/Shorts Side Stripe - cor off white.png']
      }
    ],
    features: [
      'Faixa lateral contrastante costurada',
      'Inspiração nos clássicos track shorts',
      'Fendas laterais para mobilidade',
      'Bolsos frontais com forro em mesh',
      'Visual retrô esportivo'
    ]
  },
  {
    name: 'Shorts Pleated Wide',
    slug: 'shorts-pleated-wide',
    sku: 'MM-SHO-013',
    price: 269.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
      },
      {
        color: 'charcoal',
        colorName: 'Cinza chumbo',
        colorHex: '#36454F',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80']
      }
    ],
    features: [
      'Prega frontal dupla elegante',
      'Alfaiataria desconstruída streetwear',
      'Pernas super amplas',
      'Caimento fluído estruturado',
      'Bolsos faca refinados'
    ]
  },
  {
    name: 'Shorts Track Oversized',
    slug: 'shorts-track-oversized',
    sku: 'MM-SHO-014',
    price: 249.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_white',
        colorName: 'Preto + Off White',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
      },
      {
        color: 'brown_beige',
        colorName: 'Marrom + Bege',
        colorHex: '#5C4033',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80']
      }
    ],
    features: [
      'Nylon acetinado com brilho suave',
      'Recortes geométricos laterais',
      'Bolsos com zíper invisível',
      'Elástico largo na cintura',
      'Visual athleisure contemporâneo'
    ]
  },
  {
    name: 'Shorts Corduroy Baggy',
    slug: 'shorts-corduroy-baggy',
    sku: 'MM-SHO-015',
    price: 279.90,
    promoPrice: null,
    colors: [
      {
        color: 'dark_brown',
        colorName: 'Marrom escuro',
        colorHex: '#4A3525',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80']
      },
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
      }
    ],
    features: [
      'Veludo cotelê encorpado',
      'Textura marcada por linhas verticais',
      'Modelagem baggy',
      'Pernas largas',
      'Caimento pesado e confortável',
      'Visual retrô'
    ]
  }
];

async function run() {
  console.log('=== 1. CONECTANDO AO SUPABASE COMO ADMIN ===');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const authRes = await sb.auth.signInWithPassword({ email: 'admin@marmot.com', password: process.env.ADMIN_PASSWORD || '' });
  if (authRes.error || !authRes.data.session) {
    console.error('Falha de autenticação Admin no Supabase (esperado se senha não fornecida no env):', authRes.error?.message);
    console.log('Procedendo com a sincronização do catálogo e arquivos locais...');
  } else {
    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: 'Bearer ' + authRes.data.session.access_token } }
    });

    console.log('=== 2. REMOVENDO REGISTROS ANTIGOS DA CATEGORIA SHORTS ===');
    await sbAdmin.from('products').delete().eq('category', 'shorts');

    console.log('=== 3. CADASTRANDO OS SHORTS NO SUPABASE ===');
    for (let i = 0; i < SHORTS_DATA.length; i++) {
      const item = SHORTS_DATA[i];
      const id = `prod-sho-${String(i + 1).padStart(3, '0')}`;
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
        subtitle: item.features[0] || 'Shorts Streetwear',
        description: descriptionText,
        price: item.price,
        promoPrice: item.promoPrice,
        category: 'shorts',
        subcategory: 'Shorts',
        collection: 'Coleção Marmot Summer & Cargo 2026',
        tags: ['Shorts', 'Bermudas', 'Streetwear', 'Destaque'],
        rating: 5.0,
        reviewCount: 12 + (i % 12),
        stockCount: 25 + (i % 10),
        sku: item.sku,
        sizes: ['P', 'M', 'G', 'GG', 'XG'],
        colors: colorsPayload,
        image: defaultImg,
        images: allImages,
        details: item.features,
        careInstructions: [
          'Lavar em água fria no ciclo delicado',
          'Não alvejar nem centrifugar em alta rotação',
          'Secar à sombra em varal'
        ],
        composition: ['100% Algodão Heavyweight / Ripstop Encorpado'],
        weight: 0.45,
        height: 4,
        width: 26,
        length: 32,
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
        category: 'shorts',
        subcategory: 'Shorts',
        collection: 'Coleção Marmot Summer & Cargo 2026',
        tags: ['Shorts', 'Bermudas', 'Streetwear'],
        rating: 5.0,
        review_count: 12 + (i % 12),
        stock_count: 25 + (i % 10),
        sku: item.sku,
        sizes: ['P', 'M', 'G', 'GG', 'XG'],
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
        console.error(`Erro ao inserir ${item.name}:`, insErr.message);
      } else {
        console.log(`   ✓ [${i + 1}/${SHORTS_DATA.length}] Cadastrado: ${item.name} (${id})`);
      }
    }
  }

  console.log('=== 4. SINCRONIZANDO ARQUIVOS LOCAIS ===');
  const storeProductsPath = 'data/store_products.json';
  if (fs.existsSync(storeProductsPath)) {
    const existing = JSON.parse(fs.readFileSync(storeProductsPath, 'utf8'));
    const others = existing.filter(p => p.category !== 'shorts');
    
    const formattedShorts = SHORTS_DATA.map((item, i) => {
      const id = `prod-sho-${String(i + 1).padStart(3, '0')}`;
      const colorsPayload = item.colors.map(c => ({
        color: c.color,
        colorName: c.colorName,
        colorHex: c.colorHex,
        featuredImage: c.featuredImage,
        images: c.images,
        image: c.featuredImage
      }));
      return {
        id,
        slug: item.slug,
        title: item.name,
        subtitle: item.features[0] || 'Shorts Streetwear',
        description: item.features.join('\n'),
        price: item.price,
        promoPrice: item.promoPrice,
        category: 'shorts',
        subcategory: 'Shorts',
        collection: 'Coleção Marmot Summer & Cargo 2026',
        tags: ['Shorts', 'Bermudas', 'Streetwear', 'Destaque'],
        rating: 5.0,
        reviewCount: 12 + (i % 12),
        stockCount: 25 + (i % 10),
        sku: item.sku,
        sizes: ['P', 'M', 'G', 'GG', 'XG'],
        colors: colorsPayload,
        image: colorsPayload[0].featuredImage,
        images: colorsPayload.map(c => c.featuredImage),
        details: item.features,
        careInstructions: [
          'Lavar em água fria no ciclo delicado',
          'Não alvejar nem centrifugar em alta rotação',
          'Secar à sombra em varal'
        ],
        composition: ['100% Algodão Heavyweight / Ripstop Encorpado'],
        weight: 0.45,
        height: 4,
        width: 26,
        length: 32,
        isNewRelease: true,
        isBestSeller: i < 3,
        featured: true,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    });

    const finalCatalog = [...others, ...formattedShorts];
    fs.writeFileSync(storeProductsPath, JSON.stringify(finalCatalog, null, 2), 'utf8');
    fs.writeFileSync('data/products.json', JSON.stringify(finalCatalog, null, 2), 'utf8');

    const part1Code = 'import { Product } from \'../types\';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ' + JSON.stringify(finalCatalog, null, 2) + ';\n';
    fs.writeFileSync('src/data/catalog90ProductsPart1.ts', part1Code, 'utf8');
    console.log(`✓ Sincronizados ${finalCatalog.length} produtos em store_products.json, products.json e catalog90ProductsPart1.ts`);
  }
}

run();
