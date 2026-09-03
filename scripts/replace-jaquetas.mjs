import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const JAQUETAS_DATA = [
  {
    name: 'Jaqueta Anorak',
    slug: 'jaqueta-anorak',
    sku: 'MM-JAQ-001',
    price: 429.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Meio zíper frontal',
      'Capuz amplo e ajustável',
      'Bolso frontal grande',
      'Modelagem solta',
      'Ajustes na barra',
      'Visual técnico inspirado em outdoor'
    ]
  },
  {
    name: 'Jaqueta Bomber Oversized',
    slug: 'jaqueta-bomber-oversized',
    sku: 'MM-JAQ-002',
    price: 459.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Modelagem ampla e volumosa',
      'Punhos e barra com elástico',
      'Gola curta estruturada',
      'Fechamento frontal por zíper',
      'Ombros levemente caídos',
      'Visual inspirado em jaquetas militares'
    ]
  },
  {
    name: 'Jaqueta Cargo',
    slug: 'jaqueta-cargo',
    sku: 'MM-JAQ-003',
    price: 449.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Bolsos cargo grandes',
      'Vários compartimentos funcionais',
      'Modelagem ampla',
      'Construção robusta',
      'Detalhes utilitários',
      'Visual streetwear funcional'
    ]
  },
  {
    name: 'Jaqueta Coach',
    slug: 'jaqueta-coach',
    sku: 'MM-JAQ-004',
    price: 389.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Gola simples dobrável',
      'Fechamento por botões de pressão',
      'Tecido leve',
      'Modelagem reta e relaxada',
      'Barra com ajuste',
      'Visual esportivo e minimalista'
    ]
  },
  {
    name: 'Jaqueta Cropped Puffer',
    slug: 'jaqueta-cropped-puffer',
    sku: 'MM-JAQ-005',
    price: 469.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Comprimento mais curto',
      'Construção acolchoada',
      'Corpo volumoso',
      'Gola alta',
      'Barra ajustável',
      'Visual moderno e estruturado'
    ]
  },
  {
    name: 'Jaqueta Denim Distressed',
    slug: 'jaqueta-denim-distressed',
    sku: 'MM-JAQ-006',
    price: 439.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Jeans pesado',
      'Áreas propositalmente desgastadas',
      'Bordas puídas',
      'Lavagem irregular',
      'Modelagem ampla',
      'Estética grunge e vintage'
    ]
  },
  {
    name: 'Jaqueta Denim Washed',
    slug: 'jaqueta-denim-washed',
    sku: 'MM-JAQ-007',
    price: 429.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Jeans encorpado',
      'Lavagem envelhecida',
      'Efeito desbotado',
      'Modelagem oversized',
      'Costuras tradicionais aparentes',
      'Visual vintage e streetwear'
    ]
  },
  {
    name: 'Jaqueta Harrington',
    slug: 'jaqueta-harrington',
    sku: 'MM-JAQ-008',
    price: 419.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Comprimento curto',
      'Gola dobrável característica',
      'Fechamento frontal por zíper',
      'Modelagem levemente boxy',
      'Construção limpa',
      'Visual retrô e minimalista'
    ]
  },
  {
    name: 'Jaqueta Nylon Tech',
    slug: 'jaqueta-nylon-tech',
    sku: 'MM-JAQ-009',
    price: 449.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Nylon de aparência técnica',
      'Gola alta',
      'Bolsos com zíper',
      'Ajustes na cintura ou barra',
      'Construção leve',
      'Visual futurista e funcional'
    ]
  },
  {
    name: 'Jaqueta Panel Construction',
    slug: 'jaqueta-panel-construction',
    sku: 'MM-JAQ-010',
    price: 469.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Recortes geométricos',
      'Painéis sobrepostos',
      'Costuras aparentes',
      'Mistura visual de diferentes áreas',
      'Construção arquitetônica',
      'Visual experimental e moderno'
    ]
  },
  {
    name: 'Jaqueta Puffer Oversized',
    slug: 'jaqueta-puffer-oversized',
    sku: 'MM-JAQ-011',
    price: 499.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Construção fortemente acolchoada',
      'Volume acentuado',
      'Modelagem oversized',
      'Gola alta e estruturada',
      'Ombros amplos',
      'Visual pesado de inverno'
    ]
  },
  {
    name: 'Jaqueta Sherpa',
    slug: 'jaqueta-sherpa',
    sku: 'MM-JAQ-012',
    price: 479.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Forro ou painéis em sherpa',
      'Textura felpuda aparente',
      'Construção volumosa',
      'Modelagem ampla',
      'Aparência quente e pesada',
      'Visual de inverno com inspiração vintage'
    ]
  },
  {
    name: 'Jaqueta Tactical',
    slug: 'jaqueta-tactical',
    sku: 'MM-JAQ-013',
    price: 469.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Bolsos modulares',
      'Fivelas e straps',
      'Gola alta',
      'Recortes funcionais',
      'Construção robusta',
      'Visual inspirado em equipamentos militares'
    ]
  },
  {
    name: 'Jaqueta Track',
    slug: 'jaqueta-track',
    sku: 'MM-JAQ-014',
    price: 399.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Inspiração esportiva',
      'Tecido leve',
      'Faixas ou recortes laterais',
      'Gola alta',
      'Modelagem relaxada',
      'Visual retrô esportivo'
    ]
  },
  {
    name: 'Jaqueta Two Tone',
    slug: 'jaqueta-two-tone',
    sku: 'MM-JAQ-015',
    price: 439.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Combinação de duas cores',
      'Grandes áreas contrastantes',
      'Recortes gráficos',
      'Modelagem ampla',
      'Divisão visual marcada',
      'Estética streetwear moderna'
    ]
  },
  {
    name: 'Jaqueta Utility',
    slug: 'jaqueta-utility',
    sku: 'MM-JAQ-016',
    price: 459.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Vários bolsos funcionais',
      'Recortes técnicos',
      'Compartimentos utilitários',
      'Modelagem oversized',
      'Construção resistente',
      'Visual inspirado em roupas de trabalho'
    ]
  },
  {
    name: 'Jaqueta Varsity Oversized',
    slug: 'jaqueta-varsity-oversized',
    sku: 'MM-JAQ-017',
    price: 489.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Inspiração universitária',
      'Mangas contrastantes',
      'Punhos e barra listrados',
      'Aplicações, patches ou lettering',
      'Modelagem oversized',
      'Visual esportivo retrô'
    ]
  },
  {
    name: 'Jaqueta Windbreaker',
    slug: 'jaqueta-windbreaker',
    sku: 'MM-JAQ-018',
    price: 399.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Tecido leve e técnico',
      'Capuz ajustável',
      'Recortes esportivos',
      'Proteção contra vento',
      'Modelagem relaxada',
      'Visual inspirado em roupas outdoor'
    ]
  },
  {
    name: 'Jaqueta Workwear',
    slug: 'jaqueta-workwear',
    sku: 'MM-JAQ-019',
    price: 469.90,
    promoPrice: null,
    images: {
      black: {
        featured: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      olive: {
        featured: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    features: [
      'Corte boxy',
      'Tecido pesado e resistente',
      'Bolsos frontais grandes',
      'Construção simples e robusta',
      'Modelagem ampla',
      'Inspiração em uniformes e roupas de trabalho'
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

  console.log('=== 2. REMOVENDO REGISTROS ANTIGOS DA CATEGORIA JAQUETAS ===');
  await sbAdmin.from('products').delete().eq('category', 'jaquetas');
  const { data: countBefore } = await sbAdmin.from('products').select('id').eq('category', 'jaquetas');
  console.log('Jaquetas restantes após limpeza:', countBefore?.length || 0);

  console.log('=== 3. CADASTRANDO AS 19 JAQUETAS NO SUPABASE ===');
  const insertedJaquetas = [];

  for (let i = 0; i < JAQUETAS_DATA.length; i++) {
    const item = JAQUETAS_DATA[i];
    const id = `prod-jaq-${String(i + 1).padStart(3, '0')}`;
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
        color: 'olive',
        colorName: 'Military Olive',
        colorHex: '#4A5340',
        featuredImage: item.images.olive.featured,
        images: item.images.olive.gallery,
        image: item.images.olive.featured
      }
    ];

    const fullProductObj = {
      id,
      slug: item.slug,
      title: item.name,
      subtitle: item.features[0] || 'Outerwear Streetwear',
      description: descriptionText,
      price: item.price,
      promoPrice: item.promoPrice,
      category: 'jaquetas',
      subcategory: 'Jaquetas',
      collection: 'Coleção Marmot Outerwear 2026',
      tags: ['Jaqueta', 'Outerwear', 'Streetwear', 'Destaque'],
      rating: 5.0,
      reviewCount: 14 + (i % 20),
      stockCount: 15 + (i % 10),
      sku: item.sku,
      sizes: ['P', 'M', 'G', 'GG', 'XG'],
      colors: colorsPayload,
      image: item.images.black.featured,
      images: item.images.black.gallery,
      details: item.features,
      careInstructions: [
        'Lavar em ciclo delicado com água fria',
        'Não alvejar nem centrifugar em alta rotação',
        'Secar à sombra em varal'
      ],
      composition: ['100% Poliamida / Algodão Estruturado'],
      weight: 0.85,
      height: 10,
      width: 30,
      length: 40,
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
      category: 'jaquetas',
      subcategory: 'Jaquetas',
      collection: 'Coleção Marmot Outerwear 2026',
      tags: ['Jaqueta', 'Outerwear', 'Streetwear'],
      rating: 5.0,
      review_count: 14 + (i % 20),
      stock_count: 15 + (i % 10),
      sku: item.sku,
      sizes: ['P', 'M', 'G', 'GG', 'XG'],
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
      console.log(`   ✓ [${i + 1}/${JAQUETAS_DATA.length}] Cadastrado: ${item.name} (ID: ${id})`);
      insertedJaquetas.push(fullProductObj);
    }
  }

  console.log('=== 4. ATUALIZANDO CATEGORIA JAQUETAS NO SUPABASE ===');
  const { data: catJaq } = await sbAdmin.from('categories').select('*').eq('id', 'jaquetas').single();
  if (catJaq) {
    const updatedData = { ...catJaq.data, productCount: 19 };
    await sbAdmin.from('categories').update({
      product_count: 19,
      data: updatedData,
      updated_at: new Date().toISOString()
    }).eq('id', 'jaquetas');
    console.log('Categoria Jaquetas atualizada para product_count = 19 no Supabase.');
  }

  console.log('=== 5. SINCRONIZANDO ARQUIVOS LOCAIS E CATÁLOGO ===');
  const { data: allDbProds } = await sbAdmin.from('products').select('*').order('created_at', { ascending: true });
  console.log('Total de produtos no banco após inserção das jaquetas:', allDbProds?.length);

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
      subcategory: p.subcategory || 'Jaquetas',
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
      composition: p.composition || ['Algodão / Poliéster'],
      weight: p.weight || 0.85,
      height: p.height || 10,
      width: p.width || 30,
      length: p.length || 40,
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
      if (c.id === 'jaquetas' || c.slug === 'jaquetas') {
        c.productCount = 19;
      }
    });
    fs.writeFileSync('data/store_categories.json', JSON.stringify(cats, null, 2), 'utf8');
  }

  console.log('=== 6. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: jaquetasInDb } = await sbAdmin.from('products').select('id, title, slug, price').eq('category', 'jaquetas');
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA JAQUETAS NO BANCO: ${jaquetasInDb?.length}`);
  jaquetasInDb?.forEach((j, idx) => {
    console.log(`${idx + 1}. ${j.title} | ID: ${j.id} | Slug: ${j.slug} | R$ ${j.price}`);
  });

  const { data: allTotals } = await sbAdmin.from('products').select('category');
  const summary = {};
  allTotals?.forEach(p => { summary[p.category] = (summary[p.category] || 0) + 1; });
  console.log('DISTRIBUIÇÃO GERAL POR CATEGORIA NO BANCO:', summary);
  console.log('TOTAL GERAL NO BANCO:', allTotals?.length);
}

run();
