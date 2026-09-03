import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const ACESSORIOS_DATA = [
  {
    name: 'Boné Trucker',
    slug: 'bone-trucker',
    sku: 'MM-ACS-001',
    price: 149.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'brown_beige',
        colorName: 'Marrom + Bege',
        colorHex: '#6E4D38',
        featuredImage: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Aba curva ou levemente reta',
      'Parte traseira em tela',
      'Ajuste regulável',
      'Visual retrô',
      'Estética streetwear casual'
    ]
  },
  {
    name: 'Boné 5 Panel',
    slug: 'bone-5-panel',
    sku: 'MM-ACS-002',
    price: 149.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'olive_green',
        colorName: 'Verde oliva',
        colorHex: '#4E5742',
        featuredImage: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Construção em cinco painéis',
      'Perfil baixo',
      'Aba reta',
      'Design minimalista',
      'Visual urbano'
    ]
  },
  {
    name: 'Gorro Beanie',
    slug: 'gorro-beanie',
    sku: 'MM-ACS-003',
    price: 129.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'lead_grey',
        colorName: 'Cinza chumbo',
        colorHex: '#353942',
        featuredImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Tricô encorpado',
      'Ajuste rente à cabeça',
      'Barra dobrável',
      'Visual minimalista',
      'Estética streetwear de inverno'
    ]
  },
  {
    name: 'Bucket Hat',
    slug: 'bucket-hat',
    sku: 'MM-ACS-004',
    price: 159.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'sand_beige',
        colorName: 'Bege areia',
        colorHex: '#D5C4A1',
        featuredImage: 'https://images.unsplash.com/photo-1572495532056-85e3a1ca5582?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1572495532056-85e3a1ca5582?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Aba circular',
      'Estrutura flexível',
      'Modelagem confortável',
      'Visual inspirado nos anos 90',
      'Pode possuir bolsos ou detalhes utilitários'
    ]
  },
  {
    name: 'Shoulder Bag',
    slug: 'shoulder-bag',
    sku: 'MM-ACS-005',
    price: 189.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'graphite',
        colorName: 'Grafite',
        colorHex: '#3E424B',
        featuredImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Bolsa compacta transversal',
      'Alça ajustável',
      'Compartimentos com zíper',
      'Construção funcional',
      'Visual urbano e utilitário'
    ]
  },
  {
    name: 'Crossbody Utility Bag',
    slug: 'crossbody-utility-bag',
    sku: 'MM-ACS-006',
    price: 219.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'military_green',
        colorName: 'Verde militar',
        colorHex: '#414B3B',
        featuredImage: 'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Diversos compartimentos',
      'Bolsos externos',
      'Fivelas e reguladores',
      'Alça larga',
      'Inspiração em equipamentos táticos'
    ]
  },
  {
    name: 'Mochila Tactical',
    slug: 'mochila-tactical',
    sku: 'MM-ACS-007',
    price: 349.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'lead',
        colorName: 'Chumbo',
        colorHex: '#2D333D',
        featuredImage: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Estrutura robusta',
      'Bolsos modulares',
      'Straps externos',
      'Compartimentos organizadores',
      'Visual técnico e militar'
    ]
  },
  {
    name: 'Cinto Webbing',
    slug: 'cinto-webbing',
    sku: 'MM-ACS-008',
    price: 129.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'grey',
        colorName: 'Cinza',
        colorHex: '#5B626C',
        featuredImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Fita larga em nylon',
      'Fivela metálica ou técnica',
      'Comprimento ajustável',
      'Ponta alongada',
      'Visual utilitário'
    ]
  },
  {
    name: 'Cinto Studded',
    slug: 'cinto-studded',
    sku: 'MM-ACS-009',
    price: 179.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black_silver',
        colorName: 'Preto + Prata',
        colorHex: '#1A1A1A',
        featuredImage: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'dark_brown_silver',
        colorName: 'Marrom escuro + Prata',
        colorHex: '#4A3525',
        featuredImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Aplicações metálicas',
      'Construção robusta',
      'Fivela marcante',
      'Inspiração punk e grunge',
      'Visual mais agressivo'
    ]
  },
  {
    name: 'Carteira Chain',
    slug: 'carteira-chain',
    sku: 'MM-ACS-010',
    price: 149.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black_silver',
        colorName: 'Preto + Prata',
        colorHex: '#181818',
        featuredImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'brown_silver',
        colorName: 'Marrom + Prata',
        colorHex: '#5A3D2A',
        featuredImage: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Carteira compacta',
      'Corrente metálica lateral',
      'Construção em couro ou material semelhante',
      'Visual inspirado em skate e punk',
      'Detalhe metálico marcante'
    ]
  },
  {
    name: 'Óculos Wraparound',
    slug: 'oculos-wraparound',
    sku: 'MM-ACS-011',
    price: 229.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'silver_darklens',
        colorName: 'Prata + Lente escura',
        colorHex: '#A2AAB4',
        featuredImage: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Lentes curvas',
      'Formato esportivo',
      'Armação envolvente',
      'Visual futurista',
      'Inspiração Y2K'
    ]
  },
  {
    name: 'Óculos Retangular',
    slug: 'oculos-retangular',
    sku: 'MM-ACS-012',
    price: 219.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'tortoise_brown',
        colorName: 'Tartaruga marrom',
        colorHex: '#654321',
        featuredImage: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Armação estreita',
      'Linhas retas',
      'Design minimalista',
      'Visual retrô e contemporâneo',
      'Fácil combinação com looks oversized'
    ]
  },
  {
    name: 'Corrente Necklace',
    slug: 'corrente-necklace',
    sku: 'MM-ACS-013',
    price: 169.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'silver',
        colorName: 'Prata',
        colorHex: '#C5CCD6',
        featuredImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'metallic_black',
        colorName: 'Preto metálico',
        colorHex: '#25272B',
        featuredImage: 'https://images.unsplash.com/photo-1611591475152-4c83136ab5b6?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1611591475152-4c83136ab5b6?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Corrente metálica de espessura média',
      'Design simples ou industrial',
      'Pode receber pingentes',
      'Visual urbano',
      'Acabamento robusto'
    ]
  },
  {
    name: 'Pulseira Chain',
    slug: 'pulseira-chain',
    sku: 'MM-ACS-014',
    price: 149.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'silver',
        colorName: 'Prata',
        colorHex: '#C5CCD6',
        featuredImage: 'https://images.unsplash.com/photo-1611591475152-4c83136ab5b6?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1611591475152-4c83136ab5b6?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'metallic_black',
        colorName: 'Preto metálico',
        colorHex: '#25272B',
        featuredImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Elos metálicos',
      'Construção pesada',
      'Fecho aparente',
      'Visual industrial',
      'Estética streetwear minimalista'
    ]
  },
  {
    name: 'Luva Fingerless',
    slug: 'luva-fingerless',
    sku: 'MM-ACS-015',
    price: 139.90,
    promoPrice: null,
    sizes: ['Único'],
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'lead_grey',
        colorName: 'Cinza chumbo',
        colorHex: '#353942',
        featuredImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Dedos parcialmente expostos',
      'Construção em tecido, couro ou material técnico',
      'Ajuste firme',
      'Detalhes utilitários',
      'Visual grunge e experimental'
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

  console.log('=== 2. REMOVENDO REGISTROS ANTIGOS DA CATEGORIA ACESSÓRIOS ===');
  await sbAdmin.from('products').delete().eq('category', 'acessorios');
  const { data: countBefore } = await sbAdmin.from('products').select('id').eq('category', 'acessorios');
  console.log('Acessórios restantes após limpeza:', countBefore?.length || 0);

  console.log('=== 3. CADASTRANDO OS 15 ACESSÓRIOS NO SUPABASE COM 2 CORES CADA (30 VARIANTES) ===');
  const insertedAcs = [];

  for (let i = 0; i < ACESSORIOS_DATA.length; i++) {
    const item = ACESSORIOS_DATA[i];
    const id = `prod-acs-${String(i + 1).padStart(3, '0')}`;
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
      subtitle: item.features[0] || 'Acessório Streetwear',
      description: descriptionText,
      price: item.price,
      promoPrice: item.promoPrice,
      category: 'acessorios',
      subcategory: 'Acessórios',
      collection: 'Coleção Marmot Accessories Atelier 2026',
      tags: ['Acessórios', 'Streetwear', 'Utilitário', 'Destaque'],
      rating: 5.0,
      reviewCount: 15 + (i % 12),
      stockCount: 25 + (i % 10),
      sku: item.sku,
      sizes: item.sizes || ['Único'],
      colors: colorsPayload,
      image: defaultImg,
      images: allImages,
      details: item.features,
      careInstructions: [
        'Limpar com pano macio e seco',
        'Evitar contato com produtos químicos agressivos',
        'Guardar em local arejado e protegido da umidade'
      ],
      composition: ['Materiais Premium / Aço Inoxidável 316L / Nylon de Alta Resistência'],
      weight: 0.3,
      height: 8,
      width: 18,
      length: 22,
      isNewRelease: true,
      isBestSeller: i < 4,
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
      category: 'acessorios',
      subcategory: 'Acessórios',
      collection: 'Coleção Marmot Accessories Atelier 2026',
      tags: ['Acessórios', 'Streetwear', 'Utilitário'],
      rating: 5.0,
      review_count: 15 + (i % 12),
      stock_count: 25 + (i % 10),
      sku: item.sku,
      sizes: item.sizes || ['Único'],
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
      is_best_seller: i < 4,
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
      console.log(`   ✓ [${i + 1}/${ACESSORIOS_DATA.length}] Cadastrado: ${item.name} (ID: ${id}) -> Cores: ${item.colors.map(c => c.colorName).join(' / ')}`);
      insertedAcs.push(fullProductObj);
    }
  }

  console.log('=== 4. ATUALIZANDO CATEGORIA ACESSÓRIOS NO SUPABASE ===');
  const { data: catAcs } = await sbAdmin.from('categories').select('*').eq('id', 'acessorios').single();
  if (catAcs) {
    const updatedData = { ...catAcs.data, productCount: 15 };
    await sbAdmin.from('categories').update({
      product_count: 15,
      data: updatedData,
      updated_at: new Date().toISOString()
    }).eq('id', 'acessorios');
    console.log('Categoria Acessórios atualizada para product_count = 15 no Supabase.');
  }

  console.log('=== 5. SINCRONIZANDO ARQUIVOS LOCAIS E CATÁLOGO ===');
  const { data: allDbProds } = await sbAdmin.from('products').select('*').order('created_at', { ascending: true });
  console.log('Total de produtos no banco após inserção dos acessórios:', allDbProds?.length);

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
      subcategory: p.subcategory || 'Acessórios',
      collection: p.collection || 'Coleção Marmot Atelier',
      tags: p.tags || ['Streetwear'],
      rating: p.rating || 5.0,
      reviewCount: p.review_count || 0,
      stockCount: p.stock_count || 20,
      sku: p.sku,
      sizes: p.sizes || ['Único'],
      colors: p.colors || [],
      image: p.image,
      images: p.images || [p.image],
      details: p.details || [],
      careInstructions: p.care_instructions || [],
      composition: p.composition || ['Materiais Premium'],
      weight: p.weight || 0.3,
      height: p.height || 8,
      width: p.width || 18,
      length: p.length || 22,
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
      if (c.id === 'acessorios' || c.slug === 'acessorios') {
        c.productCount = 15;
      }
    });
    fs.writeFileSync('data/store_categories.json', JSON.stringify(cats, null, 2), 'utf8');
  }

  console.log('=== 6. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: acsInDb } = await sbAdmin.from('products').select('id, title, slug, price, colors').eq('category', 'acessorios');
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA ACESSÓRIOS NO BANCO: ${acsInDb?.length}`);
  let totalColorVariants = 0;
  acsInDb?.forEach((t, idx) => {
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
