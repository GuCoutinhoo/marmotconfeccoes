import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const SHORTS_DATA = [
  {
    "name": "Shorts Baggy Denim",
    "slug": "shorts-baggy-denim",
    "sku": "MM-SHO-001",
    "price": 259.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "bege",
        "colorName": "Bege",
        "colorHex": "#C8AD7F",
        "featuredImage": "/Shorts Baggy Denim - cor bege.png",
        "images": [
          "/Shorts Baggy Denim - cor bege.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Baggy Denim - cor preto.png",
        "images": [
          "/Shorts Baggy Denim - cor preto.png"
        ]
      }
    ],
    "features": [
      "Modelagem baggy streetwear autêntica",
      "Jeans heavyweight 100% algodão premium",
      "Cós estruturado com passantes reforçados",
      "Bolsos frontais e traseiros fundos",
      "Caimento amplo na altura dos joelhos"
    ]
  },
  {
    "name": "Shorts Cargo Baggy",
    "slug": "shorts-cargo-baggy",
    "sku": "MM-SHO-002",
    "price": 249.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "verde-oliva",
        "colorName": "Verde Oliva",
        "colorHex": "#4A5340",
        "featuredImage": "/Shorts Cargo Baggy - cor verde oliva.png",
        "images": [
          "/Shorts Cargo Baggy - cor verde oliva.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Cargo Baggy - cor preto.png",
        "images": [
          "/Shorts Cargo Baggy - cor preto.png"
        ]
      }
    ],
    "features": [
      "Bolsos cargo laterais fole com fechamento por lapela",
      "Modelagem baggy com corte reto ultra confortável",
      "Sarja peletizada encorpada 100% algodão",
      "Cós com elástico anatômico e cordão interno",
      "Pespontos duplos em áreas de atrito"
    ]
  },
  {
    "name": "Shorts Denim Washed",
    "slug": "shorts-denim-washed",
    "sku": "MM-SHO-003",
    "price": 259.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "azul-claro",
        "colorName": "Azul Claro",
        "colorHex": "#5E84A6",
        "featuredImage": "/Shorts Denim Washed - cor azul claro.png",
        "images": [
          "/Shorts Denim Washed - cor azul claro.png"
        ]
      },
      {
        "color": "preto-lavado",
        "colorName": "Preto Lavado",
        "colorHex": "#2B2B2B",
        "featuredImage": "/Shorts Denim Washed - cor preto lavado.png",
        "images": [
          "/Shorts Denim Washed - cor preto lavado.png"
        ]
      }
    ],
    "features": [
      "Lavagem vintage com efeitos de amaciamento exclusivo",
      "Jeans 12oz encorpado com caimento solto",
      "Bolsos funcionais com forro em algodão",
      "Barra clássica com pesponto contrastante",
      "Etiqueta em couro ecológico Marmot Atelier"
    ]
  },
  {
    "name": "Shorts Distressed",
    "slug": "shorts-distressed",
    "sku": "MM-SHO-004",
    "price": 269.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "jeans-claro",
        "colorName": "Jeans Claro",
        "colorHex": "#7898B5",
        "featuredImage": "/Shorts Distressed - cor jeans claro.png",
        "images": [
          "/Shorts Distressed - cor jeans claro.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#181818",
        "featuredImage": "/Shorts Distressed - cor preto.png",
        "images": [
          "/Shorts Distressed - cor preto.png"
        ]
      }
    ],
    "features": [
      "Puídos e rasgos manuais feitos artesanalmente",
      "Barra desfiada com acabamento em travete de proteção",
      "Jeans denim premium 100% algodão",
      "Modelagem desconstruída com inspiração grunge",
      "Botão e rebites personalizados em metal envelhecido"
    ]
  },
  {
    "name": "Shorts Flame",
    "slug": "shorts-flame",
    "sku": "MM-SHO-005",
    "price": 249.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "off-white",
        "colorName": "Off White",
        "colorHex": "#F0EEE9",
        "featuredImage": "/Shorts Flame - cor off white.png",
        "images": [
          "/Shorts Flame - cor off white.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Flame - cor preto.png",
        "images": [
          "/Shorts Flame - cor preto.png"
        ]
      }
    ],
    "features": [
      "Estampa Flame autoral em silk-screen de alta densidade",
      "Moletom careca pesado 320g com toque aveludado",
      "Cintura com elástico largo e cordão em algodão trançado",
      "Bolsos faca laterais e bolso traseiro embutido",
      "Comprimento acima dos joelhos com excelente mobilidade"
    ]
  },
  {
    "name": "Shorts Graphic",
    "slug": "shorts-graphic",
    "sku": "MM-SHO-006",
    "price": 239.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "marrom",
        "colorName": "Marrom",
        "colorHex": "#523624",
        "featuredImage": "/Shorts Graphic - cor marrom.png",
        "images": [
          "/Shorts Graphic - cor marrom.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Graphic - cor preto.png",
        "images": [
          "/Shorts Graphic - cor preto.png"
        ]
      }
    ],
    "features": [
      "Tipografia e artes conceituais exclusivas Marmot Atelier",
      "Algodão heavyweight respirável de toque macio",
      "Corte reto com fendas laterais para caimento perfeito",
      "Cós ajustável com ponteiras metálicas escovadas",
      "Bolsos laterais com profundidade ideal para smartphone"
    ]
  },
  {
    "name": "Shorts Mesh Sport",
    "slug": "shorts-mesh-sport",
    "sku": "MM-SHO-007",
    "price": 229.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "off-white",
        "colorName": "Off White",
        "colorHex": "#F2EFE8",
        "featuredImage": "/Shorts Mesh Sport - cor off white.png",
        "images": [
          "/Shorts Mesh Sport - cor off white.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Mesh Sport - cor preto.png",
        "images": [
          "/Shorts Mesh Sport - cor preto.png"
        ]
      }
    ],
    "features": [
      "Mesh esportivo premium com camada dupla forrada (zero transparência)",
      "Modelagem inspirada nas bermudas clássicas de basquete dos anos 90",
      "Cós canelado elástico reforçado com cordão de alta resistência",
      "Bolsos com zíper discreto para segurança de itens essenciais",
      "Secagem ultra rápida e respirabilidade incomparável"
    ]
  },
  {
    "name": "Shorts Minimal",
    "slug": "shorts-minimal",
    "sku": "MM-SHO-008",
    "price": 229.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "bege",
        "colorName": "Bege",
        "colorHex": "#C4AA84",
        "featuredImage": "/Shorts Minimal - cor bege.png",
        "images": [
          "/Shorts Minimal - cor bege.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Minimal - cor preto.png",
        "images": [
          "/Shorts Minimal - cor preto.png"
        ]
      }
    ],
    "features": [
      "Design clean e monocromático sem estampas ou excessos",
      "Tecido encorpado com toque acetinado e estrutura fluida",
      "Bolsos laterais invisíveis com fecho discreto",
      "Cintura elástica anatômica interna sem marcação",
      "Comprimento equilibrado ideal para looks elegantes do streetwear"
    ]
  },
  {
    "name": "Shorts Panel",
    "slug": "shorts-panel",
    "sku": "MM-SHO-009",
    "price": 269.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "caqui",
        "colorName": "Caqui",
        "colorHex": "#9A8264",
        "featuredImage": "/Shorts Panel - cor caqui.png",
        "images": [
          "/Shorts Panel - cor caqui.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Panel - cor preto.png",
        "images": [
          "/Shorts Panel - cor preto.png"
        ]
      }
    ],
    "features": [
      "Construção com recortes geométricos em blocos de tecido contrastantes",
      "Painéis em sarja peletizada e ripstop técnico",
      "Costuras duplas aparentes em linha especial reforçada",
      "Modelagem ampla e estruturada de impacto visual marcante",
      "Bolsos ergonômicos integrados aos recortes"
    ]
  },
  {
    "name": "Shorts Parachute",
    "slug": "shorts-parachute",
    "sku": "MM-SHO-010",
    "price": 249.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "verde-oliva",
        "colorName": "Verde Oliva",
        "colorHex": "#44513B",
        "featuredImage": "/Shorts Parachute - cor verde oliva.png",
        "images": [
          "/Shorts Parachute - cor verde oliva.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Parachute - cor preto.png",
        "images": [
          "/Shorts Parachute - cor preto.png"
        ]
      }
    ],
    "features": [
      "Tecido parachute ripstop ultraleve resistente a rasgos e água",
      "Modelagem oversized com reguladores e stoppers metálicos na barra",
      "Cintura com elástico franzido e cordão reforçado",
      "Bolsos laterais amplos e bolsos utilitários com fechamento seguro",
      "Visual técnico com referências à cultura clubber e Y2K"
    ]
  },
  {
    "name": "Shorts Tech Nylon",
    "slug": "shorts-tech-nylon",
    "sku": "MM-SHO-011",
    "price": 259.9,
    "promoPrice": null,
    "colors": [
      {
        "color": "cinza",
        "colorName": "Cinza",
        "colorHex": "#575E6B",
        "featuredImage": "/Shorts Tech Nylon - cor cinza.png",
        "images": [
          "/Shorts Tech Nylon - cor cinza.png"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "featuredImage": "/Shorts Tech Nylon - cor preto.png",
        "images": [
          "/Shorts Tech Nylon - cor preto.png"
        ]
      }
    ],
    "features": [
      "Nylon fosco 4-way stretch de alta mobilidade e durabilidade",
      "Tratamento impermeabilizante DWR repelente a água e líquidos",
      "Zíperes selados térmicos à prova de chuva nos bolsos",
      "Fita de fechamento rápido na cintura com fivela magnética Fidlock style",
      "Caimento atlético relaxado ideal para outdoor e cidade"
    ]
  }
];

export { SHORTS_DATA };
