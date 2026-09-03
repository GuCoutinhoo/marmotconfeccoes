import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const CALCAS_DATA = [
  {
    name: 'Calça Balloon',
    slug: 'calca-balloon',
    sku: 'MM-CAL-001',
    price: 319.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Volume amplo no quadril e nas coxas',
      'Pernas arredondadas com afunilamento na barra',
      'Silhueta volumosa e marcante',
      'Cintura estruturada',
      'Caimento solto',
      'Visual streetwear contemporâneo'
    ]
  },
  {
    name: 'Calça Cargo Baggy',
    slug: 'calca-cargo-baggy',
    sku: 'MM-CAL-002',
    price: 339.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Modelagem baggy e ampla',
      'Bolsos cargo laterais grandes',
      'Pernas largas',
      'Cintura confortável',
      'Detalhes utilitários',
      'Visual streetwear funcional'
    ]
  },
  {
    name: 'Calça Cargo Multi Pocket',
    slug: 'calca-cargo-multi-pocket',
    sku: 'MM-CAL-003',
    price: 359.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Grande quantidade de bolsos',
      'Bolsos laterais, frontais e traseiros',
      'Compartimentos utilitários',
      'Modelagem ampla',
      'Construção robusta',
      'Visual técnico e funcional'
    ]
  },
  {
    name: 'Calça Carpenter',
    slug: 'calca-carpenter',
    sku: 'MM-CAL-004',
    price: 329.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Modelagem reta ou levemente ampla',
      'Bolsos utilitários',
      'Alça lateral para ferramentas',
      'Costuras reforçadas',
      'Tecido resistente',
      'Visual inspirado em roupas de trabalho'
    ]
  },
  {
    name: 'Calça Corduroy Baggy',
    slug: 'calca-corduroy-baggy',
    sku: 'MM-CAL-005',
    price: 349.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Tecido de veludo cotelê',
      'Textura marcada por linhas verticais',
      'Modelagem baggy',
      'Pernas largas',
      'Caimento pesado e confortável',
      'Visual retrô e streetwear'
    ]
  },
  {
    name: 'Calça Distressed Denim',
    slug: 'calca-distressed-denim',
    sku: 'MM-CAL-006',
    price: 339.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Jeans com áreas desgastadas',
      'Rasgos ou pontos propositalmente puídos',
      'Lavagem irregular',
      'Bordas com acabamento bruto',
      'Modelagem ampla',
      'Estética grunge e vintage'
    ]
  },
  {
    name: 'Calça Double Knee',
    slug: 'calca-double-knee',
    sku: 'MM-CAL-007',
    price: 349.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Reforço duplo na região dos joelhos',
      'Painéis adicionais frontais',
      'Tecido resistente',
      'Modelagem ampla ou reta',
      'Construção inspirada em workwear',
      'Visual robusto e utilitário'
    ]
  },
  {
    name: 'Calça Nylon Utility',
    slug: 'calca-nylon-utility',
    sku: 'MM-CAL-008',
    price: 329.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Nylon leve e técnico',
      'Bolsos funcionais',
      'Ajustes na cintura ou nas barras',
      'Modelagem ampla',
      'Construção prática',
      'Visual esportivo e utilitário'
    ]
  },
  {
    name: 'Calça Panel Construction',
    slug: 'calca-panel-construction',
    sku: 'MM-CAL-009',
    price: 359.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Recortes geométricos nas pernas',
      'Painéis sobrepostos',
      'Costuras visíveis',
      'Construção arquitetônica',
      'Modelagem ampla',
      'Visual experimental e moderno'
    ]
  },
  {
    name: 'Calça Parachute',
    slug: 'calca-parachute',
    sku: 'MM-CAL-010',
    price: 339.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Modelagem extremamente ampla',
      'Tecido leve',
      'Cordões ou ajustes na barra',
      'Volume acentuado nas pernas',
      'Cintura ajustável',
      'Visual inspirado em roupas técnicas dos anos 2000'
    ]
  },
  {
    name: 'Calça Patchwork',
    slug: 'calca-patchwork',
    sku: 'MM-CAL-011',
    price: 369.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Painéis de tecidos diferentes',
      'Mistura de cores ou lavagens',
      'Costuras aparentes',
      'Construção assimétrica',
      'Modelagem ampla',
      'Visual artesanal e experimental'
    ]
  },
  {
    name: 'Calça Pleated Wide',
    slug: 'calca-pleated-wide',
    sku: 'MM-CAL-012',
    price: 349.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Pregas frontais na cintura',
      'Pernas bem largas',
      'Caimento fluido',
      'Cintura mais estruturada',
      'Volume elegante',
      'Mistura de alfaiataria com streetwear'
    ]
  },
  {
    name: 'Calça Raw Seam',
    slug: 'calca-raw-seam',
    sku: 'MM-CAL-013',
    price: 329.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Costuras propositalmente aparentes',
      'Acabamentos crus',
      'Bordas ou junções sem acabamento tradicional',
      'Modelagem ampla',
      'Construção desconstruída',
      'Visual experimental e streetwear'
    ]
  },
  {
    name: 'Calça Tactical',
    slug: 'calca-tactical',
    sku: 'MM-CAL-014',
    price: 369.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Bolsos funcionais',
      'Fivelas e ajustes',
      'Straps ou detalhes modulares',
      'Tecido resistente',
      'Modelagem ampla',
      'Visual inspirado em equipamentos militares'
    ]
  },
  {
    name: 'Calça Track Oversized',
    slug: 'calca-track-oversized',
    sku: 'MM-CAL-015',
    price: 299.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Inspiração esportiva',
      'Modelagem oversized',
      'Pernas largas',
      'Tecido leve',
      'Faixas ou recortes laterais',
      'Visual retrô esportivo'
    ]
  },
  {
    name: 'Calça Washed Baggy',
    slug: 'calca-washed-baggy',
    sku: 'MM-CAL-016',
    price: 339.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Lavagem envelhecida',
      'Efeito desbotado',
      'Modelagem baggy',
      'Pernas amplas',
      'Tecido com aparência usada',
      'Visual vintage e streetwear'
    ]
  },
  {
    name: 'Calça Wide Leg',
    slug: 'calca-wide-leg',
    sku: 'MM-CAL-017',
    price: 329.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Pernas largas do quadril até a barra',
      'Modelagem ampla e reta',
      'Caimento solto',
      'Silhueta alongada',
      'Construção minimalista',
      'Visual moderno e streetwear'
    ]
  },
  {
    name: 'Calça Zip Off',
    slug: 'calca-zip-off',
    sku: 'MM-CAL-018',
    price: 369.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      khaki: {
        featured: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Zíper horizontal nas pernas',
      'Partes inferiores removíveis',
      'Possibilidade de transformar em bermuda',
      'Construção modular',
      'Detalhes técnicos',
      'Visual funcional e utilitário'
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

  console.log('=== 2. REMOVENDO REGISTROS ANTIGOS DA CATEGORIA CALÇAS ===');
  await sbAdmin.from('products').delete().eq('category', 'calcas');
  const { data: countBefore } = await sbAdmin.from('products').select('id').eq('category', 'calcas');
  console.log('Calças restantes após limpeza:', countBefore?.length || 0);

  console.log('=== 3. CADASTRANDO AS 18 CALÇAS NO SUPABASE ===');
  const insertedCalcas = [];

  for (let i = 0; i < CALCAS_DATA.length; i++) {
    const item = CALCAS_DATA[i];
    const id = `prod-cal-${String(i + 1).padStart(3, '0')}`;
    const descriptionText = item.features.join('\n');

    const colorsPayload = [
      {
        color: 'black',
        colorName: 'Pitch Black',
        colorHex: '#121212',
        featuredImage: item.images.black.featured,
        images: item.images.black.gallery,
        image: item.images.black.featured
      },
      {
        color: 'khaki',
        colorName: 'Desert Khaki / Raw Denim',
        colorHex: '#8C7A6B',
        featuredImage: item.images.khaki.featured,
        images: item.images.khaki.gallery,
        image: item.images.khaki.featured
      }
    ];

    const fullProductObj = {
      id,
      slug: item.slug,
      title: item.name,
      subtitle: item.features[0] || 'Calça Streetwear',
      description: descriptionText,
      price: item.price,
      promoPrice: item.promoPrice,
      category: 'calcas',
      subcategory: 'Calças',
      collection: 'Coleção Marmot Denim & Cargo 2026',
      tags: ['Calça', 'Streetwear', 'Destaque'],
      rating: 5.0,
      reviewCount: 16 + (i % 15),
      stockCount: 20 + (i % 10),
      sku: item.sku,
      sizes: ['38', '40', '42', '44', '46'],
      colors: colorsPayload,
      image: item.images.black.featured,
      images: item.images.black.gallery,
      details: item.features,
      careInstructions: [
        'Lavar do avesso com água fria',
        'Não alvejar nem centrifugar em alta rotação',
        'Secar à sombra em varal'
      ],
      composition: ['100% Algodão Premium / Ripstop Encorpado'],
      weight: 0.65,
      height: 6,
      width: 28,
      length: 36,
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
      category: 'calcas',
      subcategory: 'Calças',
      collection: 'Coleção Marmot Denim & Cargo 2026',
      tags: ['Calça', 'Streetwear'],
      rating: 5.0,
      review_count: 16 + (i % 15),
      stock_count: 20 + (i % 10),
      sku: item.sku,
      sizes: ['38', '40', '42', '44', '46'],
      colors: colorsPayload,
      image: item.images.black.featured,
      images: item.images.black.gallery,
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
      console.log(`   ✓ [${i + 1}/${CALCAS_DATA.length}] Cadastrado: ${item.name} (ID: ${id})`);
      insertedCalcas.push(fullProductObj);
    }
  }

  console.log('=== 4. ATUALIZANDO CATEGORIA CALÇAS NO SUPABASE ===');
  const { data: catCal } = await sbAdmin.from('categories').select('*').eq('id', 'calcas').single();
  if (catCal) {
    const updatedData = { ...catCal.data, productCount: 18 };
    await sbAdmin.from('categories').update({
      product_count: 18,
      data: updatedData,
      updated_at: new Date().toISOString()
    }).eq('id', 'calcas');
    console.log('Categoria Calças atualizada para product_count = 18 no Supabase.');
  }

  console.log('=== 5. SINCRONIZANDO ARQUIVOS LOCAIS E CATÁLOGO ===');
  const { data: allDbProds } = await sbAdmin.from('products').select('*').order('created_at', { ascending: true });
  console.log('Total de produtos no banco após inserção das calças:', allDbProds?.length);

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
      subcategory: p.subcategory || 'Calças',
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

  // Part 1
  const part1Code = 'import { Product } from \'../types\';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ' + JSON.stringify(formattedAll, null, 2) + ';\n';
  fs.writeFileSync('src/data/catalog90ProductsPart1.ts', part1Code, 'utf8');

  // Update store_categories.json
  if (fs.existsSync('data/store_categories.json')) {
    const cats = JSON.parse(fs.readFileSync('data/store_categories.json', 'utf8'));
    cats.forEach(c => {
      if (c.id === 'calcas' || c.slug === 'calcas') {
        c.productCount = 18;
      }
    });
    fs.writeFileSync('data/store_categories.json', JSON.stringify(cats, null, 2), 'utf8');
  }

  console.log('=== 6. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: calcasInDb } = await sbAdmin.from('products').select('id, title, slug, price').eq('category', 'calcas');
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA CALÇAS NO BANCO: ${calcasInDb?.length}`);
  calcasInDb?.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.title} | ID: ${c.id} | Slug: ${c.slug} | R$ ${c.price}`);
  });

  const { data: allTotals } = await sbAdmin.from('products').select('category');
  const summary = {};
  allTotals?.forEach(p => { summary[p.category] = (summary[p.category] || 0) + 1; });
  console.log('DISTRIBUIÇÃO GERAL POR CATEGORIA NO BANCO:', summary);
  console.log('TOTAL GERAL NO BANCO:', allTotals?.length);
}

run();
