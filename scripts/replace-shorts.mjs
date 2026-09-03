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
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'sand_beige',
        colorName: 'Bege areia',
        colorHex: '#D2B48C',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
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
    name: 'Shorts Carpenter',
    slug: 'shorts-carpenter',
    sku: 'MM-SHO-002',
    price: 259.90,
    promoPrice: null,
    colors: [
      {
        color: 'brown',
        colorName: 'Marrom',
        colorHex: '#5C4033',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Modelagem reta e ampla',
      'Bolsos utilitários',
      'Alça lateral inspirada em ferramentas',
      'Costuras reforçadas',
      'Tecido resistente',
      'Estética workwear'
    ]
  },
  {
    name: 'Shorts Double Knee',
    slug: 'shorts-double-knee',
    sku: 'MM-SHO-003',
    price: 269.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'beige',
        colorName: 'Bege',
        colorHex: '#C8AD7F',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Painéis reforçados na parte frontal',
      'Costuras aparentes',
      'Tecido encorpado',
      'Modelagem larga',
      'Construção robusta',
      'Inspiração em roupas de trabalho'
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
        color: 'washed_blue',
        colorName: 'Azul lavado',
        colorHex: '#4B6B94',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'washed_black',
        colorName: 'Preto lavado',
        colorHex: '#2B2B2B',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Jeans pesado',
      'Lavagem envelhecida',
      'Efeito desbotado',
      'Modelagem baggy',
      'Barra ampla',
      'Visual vintage e streetwear'
    ]
  },
  {
    name: 'Shorts Denim Distressed',
    slug: 'shorts-denim-distressed',
    sku: 'MM-SHO-005',
    price: 269.90,
    promoPrice: null,
    colors: [
      {
        color: 'acid_black',
        colorName: 'Preto estonado',
        colorHex: '#333333',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'light_blue',
        colorName: 'Azul claro lavado',
        colorHex: '#7B9EB8',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Jeans com áreas desgastadas',
      'Rasgos e pontos propositalmente puídos',
      'Barra com acabamento bruto',
      'Lavagem irregular',
      'Modelagem ampla',
      'Estética grunge'
    ]
  },
  {
    name: 'Shorts Parachute',
    slug: 'shorts-parachute',
    sku: 'MM-SHO-006',
    price: 249.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'olive_green',
        colorName: 'Verde oliva',
        colorHex: '#4A5340',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Modelagem muito ampla',
      'Tecido leve e técnico',
      'Bolsos funcionais',
      'Cintura ajustável',
      'Cordões ou reguladores',
      'Visual inspirado nos anos 2000'
    ]
  },
  {
    name: 'Shorts Nylon Utility',
    slug: 'shorts-nylon-utility',
    sku: 'MM-SHO-007',
    price: 239.90,
    promoPrice: null,
    colors: [
      {
        color: 'graphite',
        colorName: 'Grafite',
        colorHex: '#3E424B',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Nylon leve',
      'Bolsos utilitários',
      'Cintura com ajuste',
      'Construção funcional',
      'Modelagem relaxada',
      'Visual esportivo e técnico'
    ]
  },
  {
    name: 'Shorts Tactical',
    slug: 'shorts-tactical',
    sku: 'MM-SHO-008',
    price: 279.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'lead',
        colorName: 'Chumbo',
        colorHex: '#2E3440',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Bolsos modulares',
      'Fivelas e straps',
      'Tecido resistente',
      'Modelagem ampla',
      'Detalhes inspirados em equipamento militar',
      'Visual técnico e agressivo'
    ]
  },
  {
    name: 'Shorts Multi Pocket',
    slug: 'shorts-multi-pocket',
    sku: 'MM-SHO-009',
    price: 269.90,
    promoPrice: null,
    colors: [
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'military_green',
        colorName: 'Verde militar',
        colorHex: '#3F4839',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Grande quantidade de bolsos',
      'Compartimentos frontais e laterais',
      'Bolsos sobrepostos',
      'Modelagem baggy',
      'Construção utilitária',
      'Visual streetwear maximalista'
    ]
  },
  {
    name: 'Shorts Panel Construction',
    slug: 'shorts-panel-construction',
    sku: 'MM-SHO-010',
    price: 279.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_graphite',
        colorName: 'Preto + Grafite',
        colorHex: '#1A1D20',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'beige_brown',
        colorName: 'Bege + Marrom',
        colorHex: '#8B6D53',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Recortes geométricos',
      'Painéis sobrepostos',
      'Costuras aparentes',
      'Construção arquitetônica',
      'Modelagem ampla',
      'Visual experimental'
    ]
  },
  {
    name: 'Shorts Patchwork',
    slug: 'shorts-patchwork',
    sku: 'MM-SHO-011',
    price: 289.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_grey',
        colorName: 'Preto + Cinza',
        colorHex: '#2A2D34',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'brown_beige',
        colorName: 'Marrom + Bege',
        colorHex: '#7A5C43',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Painéis de tecidos diferentes',
      'Variação de textura',
      'Recortes irregulares',
      'Costuras visíveis',
      'Modelagem relaxada',
      'Estética artesanal e experimental'
    ]
  },
  {
    name: 'Shorts Raw Hem',
    slug: 'shorts-raw-hem',
    sku: 'MM-SHO-012',
    price: 239.90,
    promoPrice: null,
    colors: [
      {
        color: 'washed_black',
        colorName: 'Preto lavado',
        colorHex: '#2E2E2E',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'washed_grey',
        colorName: 'Cinza lavado',
        colorHex: '#5A5A5A',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Barra propositalmente sem acabamento tradicional',
      'Fios e bordas aparentes',
      'Costuras expostas',
      'Modelagem larga',
      'Visual desconstruído',
      'Estética grunge e streetwear'
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
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'charcoal',
        colorName: 'Cinza chumbo',
        colorHex: '#333842',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Pregas frontais',
      'Pernas extremamente largas',
      'Cintura estruturada',
      'Caimento fluido',
      'Comprimento próximo aos joelhos',
      'Visual sofisticado com influência streetwear'
    ]
  },
  {
    name: 'Shorts Track Oversized',
    slug: 'shorts-track-oversized',
    sku: 'MM-SHO-014',
    price: 229.90,
    promoPrice: null,
    colors: [
      {
        color: 'black_offwhite',
        colorName: 'Preto + Off White',
        colorHex: '#181818',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'brown_beige',
        colorName: 'Marrom + Bege',
        colorHex: '#6A4E36',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ],
    features: [
      'Inspiração em roupas esportivas',
      'Modelagem oversized',
      'Tecido leve',
      'Faixas ou recortes laterais',
      'Cintura elástica',
      'Visual retrô esportivo'
    ]
  },
  {
    name: 'Shorts Corduroy Baggy',
    slug: 'shorts-corduroy-baggy',
    sku: 'MM-SHO-015',
    price: 269.90,
    promoPrice: null,
    colors: [
      {
        color: 'dark_brown',
        colorName: 'Marrom escuro',
        colorHex: '#422E1E',
        featuredImage: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        color: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80'
        ]
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
    console.error('Falha de autenticação Admin:', authRes.error);
    process.exit(1);
  }
  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: 'Bearer ' + authRes.data.session.access_token } }
  });

  console.log('=== 2. REMOVENDO REGISTROS ANTIGOS DA CATEGORIA SHORTS ===');
  await sbAdmin.from('products').delete().eq('category', 'shorts');
  const { data: countBefore } = await sbAdmin.from('products').select('id').eq('category', 'shorts');
  console.log('Shorts restantes após limpeza:', countBefore?.length || 0);

  console.log('=== 3. CADASTRANDO OS 15 SHORTS NO SUPABASE COM 2 CORES CADA (30 VARIANTES) ===');
  const insertedShorts = [];

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
      console.error(`Erro ao inserir ${item.name}:`, insErr);
    } else {
      console.log(`   ✓ [${i + 1}/${SHORTS_DATA.length}] Cadastrado: ${item.name} (ID: ${id}) -> Cores: ${item.colors.map(c => c.colorName).join(' / ')}`);
      insertedShorts.push(fullProductObj);
    }
  }

  console.log('=== 4. ATUALIZANDO CATEGORIA SHORTS NO SUPABASE ===');
  const { data: catSho } = await sbAdmin.from('categories').select('*').eq('id', 'shorts').single();
  if (catSho) {
    const updatedData = { ...catSho.data, productCount: 15 };
    await sbAdmin.from('categories').update({
      product_count: 15,
      data: updatedData,
      updated_at: new Date().toISOString()
    }).eq('id', 'shorts');
    console.log('Categoria Shorts atualizada para product_count = 15 no Supabase.');
  }

  console.log('=== 5. SINCRONIZANDO ARQUIVOS LOCAIS E CATÁLOGO ===');
  const { data: allDbProds } = await sbAdmin.from('products').select('*').order('created_at', { ascending: true });
  console.log('Total de produtos no banco após inserção dos shorts:', allDbProds?.length);

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
      subcategory: p.subcategory || 'Shorts',
      collection: p.collection || 'Coleção Marmot Atelier',
      tags: p.tags || ['Streetwear'],
      rating: p.rating || 5.0,
      reviewCount: p.review_count || 0,
      stockCount: p.stock_count || 20,
      sku: p.sku,
      sizes: p.sizes || ['P', 'M', 'G', 'GG', 'XG'],
      colors: p.colors || [],
      image: p.image,
      images: p.images || [p.image],
      details: p.details || [],
      careInstructions: p.care_instructions || [],
      composition: p.composition || ['Algodão / Ripstop'],
      weight: p.weight || 0.45,
      height: p.height || 4,
      width: p.width || 26,
      length: p.length || 32,
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
      if (c.id === 'shorts' || c.slug === 'shorts') {
        c.productCount = 15;
      }
    });
    fs.writeFileSync('data/store_categories.json', JSON.stringify(cats, null, 2), 'utf8');
  }

  console.log('=== 6. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: shortsInDb } = await sbAdmin.from('products').select('id, title, slug, price, colors').eq('category', 'shorts');
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA SHORTS NO BANCO: ${shortsInDb?.length}`);
  let totalColorVariants = 0;
  shortsInDb?.forEach((s, idx) => {
    const colorNames = s.colors?.map(c => c.colorName).join(' / ') || 'N/A';
    totalColorVariants += (s.colors?.length || 0);
    console.log(`${idx + 1}. ${s.title} | ID: ${s.id} | Slug: ${s.slug} | Cores: [${colorNames}]`);
  });
  console.log(`TOTAL DE OPÇÕES DE CORES PERSISTIDAS: ${totalColorVariants}`);

  const { data: allTotals } = await sbAdmin.from('products').select('category');
  const summary = {};
  allTotals?.forEach(p => { summary[p.category] = (summary[p.category] || 0) + 1; });
  console.log('DISTRIBUIÇÃO GERAL POR CATEGORIA NO BANCO:', summary);
  console.log('TOTAL GERAL NO BANCO:', allTotals?.length);
}

run();
