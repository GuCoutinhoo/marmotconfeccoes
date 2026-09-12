import fs from 'fs';
import path from 'path';

// Complete 11 shorts products
const SHORTS_PRODUCTS = [
  {
    "id": "prod-sho-001",
    "slug": "shorts-baggy-denim",
    "title": "Shorts Baggy Denim",
    "subtitle": "Modelagem baggy streetwear autêntica",
    "description": "Modelagem baggy streetwear autêntica\nJeans heavyweight 100% algodão premium\nCós estruturado com passantes reforçados\nBolsos frontais e traseiros fundos\nCaimento amplo na altura dos joelhos\nPespontos reforçados para alta durabilidade",
    "price": 259.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Baggy Denim"
    ],
    "rating": 5,
    "reviewCount": 14,
    "stockCount": 22,
    "sku": "MM-SHO-001",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "bege",
        "colorName": "Bege",
        "colorHex": "#C8AD7F",
        "image": "/Shorts Baggy Denim - cor bege.png",
        "featuredImage": "/Shorts Baggy Denim - cor bege.png",
        "images": [
          "/Shorts Baggy Denim - cor bege.png"
        ],
        "sku": "MM-SHO-001-BEGE",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Baggy Denim - cor preto.png",
        "featuredImage": "/Shorts Baggy Denim - cor preto.png",
        "images": [
          "/Shorts Baggy Denim - cor preto.png"
        ],
        "sku": "MM-SHO-001-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Baggy Denim - cor bege.png",
    "images": [
      "/Shorts Baggy Denim - cor bege.png",
      "/Shorts Baggy Denim - cor preto.png"
    ],
    "details": [
      "Modelagem baggy streetwear autêntica",
      "Jeans heavyweight 100% algodão premium",
      "Cós estruturado com passantes reforçados",
      "Bolsos frontais e traseiros fundos",
      "Caimento amplo na altura dos joelhos",
      "Pespontos reforçados para alta durabilidade"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Denim Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": true,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-002",
    "slug": "shorts-cargo-baggy",
    "title": "Shorts Cargo Baggy",
    "subtitle": "Bolsos cargo laterais fole com fechamento por lapela",
    "description": "Bolsos cargo laterais fole com fechamento por lapela\nModelagem baggy com corte reto ultra confortável\nSarja peletizada encorpada 100% algodão\nCós com elástico anatômico e cordão interno\nPespontos duplos em áreas de atrito\nEstética utilitária e militar urbana",
    "price": 249.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Cargo Baggy"
    ],
    "rating": 5,
    "reviewCount": 15,
    "stockCount": 23,
    "sku": "MM-SHO-002",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "verde-oliva",
        "colorName": "Verde Oliva",
        "colorHex": "#4A5340",
        "image": "/Shorts Cargo Baggy - cor verde oliva.png",
        "featuredImage": "/Shorts Cargo Baggy - cor verde oliva.png",
        "images": [
          "/Shorts Cargo Baggy - cor verde oliva.png"
        ],
        "sku": "MM-SHO-002-VERDE-OLIVA",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Cargo Baggy - cor preto.png",
        "featuredImage": "/Shorts Cargo Baggy - cor preto.png",
        "images": [
          "/Shorts Cargo Baggy - cor preto.png"
        ],
        "sku": "MM-SHO-002-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Cargo Baggy - cor verde oliva.png",
    "images": [
      "/Shorts Cargo Baggy - cor verde oliva.png",
      "/Shorts Cargo Baggy - cor preto.png"
    ],
    "details": [
      "Bolsos cargo laterais fole com fechamento por lapela",
      "Modelagem baggy com corte reto ultra confortável",
      "Sarja peletizada encorpada 100% algodão",
      "Cós com elástico anatômico e cordão interno",
      "Pespontos duplos em áreas de atrito",
      "Estética utilitária e militar urbana"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Penteado Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": true,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-003",
    "slug": "shorts-denim-washed",
    "title": "Shorts Denim Washed",
    "subtitle": "Lavagem vintage com efeitos de amaciamento exclusivo",
    "description": "Lavagem vintage com efeitos de amaciamento exclusivo\nJeans 12oz encorpado com caimento solto\nBolsos funcionais com forro em algodão\nBarra clássica com pesponto contrastante\nEtiqueta em couro ecológico Marmot Atelier\nToque macio e visual retro dos anos 90",
    "price": 259.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Denim Washed"
    ],
    "rating": 5,
    "reviewCount": 16,
    "stockCount": 24,
    "sku": "MM-SHO-003",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "azul-claro",
        "colorName": "Azul Claro",
        "colorHex": "#5E84A6",
        "image": "/Shorts Denim Washed - cor azul claro.png",
        "featuredImage": "/Shorts Denim Washed - cor azul claro.png",
        "images": [
          "/Shorts Denim Washed - cor azul claro.png"
        ],
        "sku": "MM-SHO-003-AZUL-CLARO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto-lavado",
        "colorName": "Preto Lavado",
        "colorHex": "#2B2B2B",
        "image": "/Shorts Denim Washed - cor preto lavado.png",
        "featuredImage": "/Shorts Denim Washed - cor preto lavado.png",
        "images": [
          "/Shorts Denim Washed - cor preto lavado.png"
        ],
        "sku": "MM-SHO-003-PRETO-LAVADO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Denim Washed - cor azul claro.png",
    "images": [
      "/Shorts Denim Washed - cor azul claro.png",
      "/Shorts Denim Washed - cor preto lavado.png"
    ],
    "details": [
      "Lavagem vintage com efeitos de amaciamento exclusivo",
      "Jeans 12oz encorpado com caimento solto",
      "Bolsos funcionais com forro em algodão",
      "Barra clássica com pesponto contrastante",
      "Etiqueta em couro ecológico Marmot Atelier",
      "Toque macio e visual retro dos anos 90"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Denim Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": true,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-004",
    "slug": "shorts-distressed",
    "title": "Shorts Distressed",
    "subtitle": "Puídos e rasgos manuais feitos artesanalmente",
    "description": "Puídos e rasgos manuais feitos artesanalmente\nBarra desfiada com acabamento em travete de proteção\nJeans denim premium 100% algodão\nModelagem desconstruída com inspiração grunge\nBotão e rebites personalizados em metal envelhecido\nCaimento solto e atitude streetwear",
    "price": 269.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Distressed"
    ],
    "rating": 5,
    "reviewCount": 17,
    "stockCount": 25,
    "sku": "MM-SHO-004",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "jeans-claro",
        "colorName": "Jeans Claro",
        "colorHex": "#7898B5",
        "image": "/Shorts Distressed - cor jeans claro.png",
        "featuredImage": "/Shorts Distressed - cor jeans claro.png",
        "images": [
          "/Shorts Distressed - cor jeans claro.png"
        ],
        "sku": "MM-SHO-004-JEANS-CLARO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#181818",
        "image": "/Shorts Distressed - cor preto.png",
        "featuredImage": "/Shorts Distressed - cor preto.png",
        "images": [
          "/Shorts Distressed - cor preto.png"
        ],
        "sku": "MM-SHO-004-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Distressed - cor jeans claro.png",
    "images": [
      "/Shorts Distressed - cor jeans claro.png",
      "/Shorts Distressed - cor preto.png"
    ],
    "details": [
      "Puídos e rasgos manuais feitos artesanalmente",
      "Barra desfiada com acabamento em travete de proteção",
      "Jeans denim premium 100% algodão",
      "Modelagem desconstruída com inspiração grunge",
      "Botão e rebites personalizados em metal envelhecido",
      "Caimento solto e atitude streetwear"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Denim Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-005",
    "slug": "shorts-flame",
    "title": "Shorts Flame",
    "subtitle": "Estampa Flame autoral em silk-screen de alta densidade",
    "description": "Estampa Flame autoral em silk-screen de alta densidade\nMoletom careca pesado 320g com toque aveludado\nCintura com elástico largo e cordão em algodão trançado\nBolsos faca laterais e bolso traseiro embutido\nComprimento acima dos joelhos com excelente mobilidade\nDesign gráfico com DNA contemporâneo Marmot",
    "price": 249.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Flame"
    ],
    "rating": 5,
    "reviewCount": 18,
    "stockCount": 26,
    "sku": "MM-SHO-005",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "off-white",
        "colorName": "Off White",
        "colorHex": "#F0EEE9",
        "image": "/Shorts Flame - cor off white.png",
        "featuredImage": "/Shorts Flame - cor off white.png",
        "images": [
          "/Shorts Flame - cor off white.png"
        ],
        "sku": "MM-SHO-005-OFF-WHITE",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Flame - cor preto.png",
        "featuredImage": "/Shorts Flame - cor preto.png",
        "images": [
          "/Shorts Flame - cor preto.png"
        ],
        "sku": "MM-SHO-005-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Flame - cor off white.png",
    "images": [
      "/Shorts Flame - cor off white.png",
      "/Shorts Flame - cor preto.png"
    ],
    "details": [
      "Estampa Flame autoral em silk-screen de alta densidade",
      "Moletom careca pesado 320g com toque aveludado",
      "Cintura com elástico largo e cordão em algodão trançado",
      "Bolsos faca laterais e bolso traseiro embutido",
      "Comprimento acima dos joelhos com excelente mobilidade",
      "Design gráfico com DNA contemporâneo Marmot"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Penteado Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-006",
    "slug": "shorts-graphic",
    "title": "Shorts Graphic",
    "subtitle": "Tipografia e artes conceituais exclusivas Marmot Atelier",
    "description": "Tipografia e artes conceituais exclusivas Marmot Atelier\nAlgodão heavyweight respirável de toque macio\nCorte reto com fendas laterais para caimento perfeito\nCós ajustável com ponteiras metálicas escovadas\nBolsos laterais com profundidade ideal para smartphone\nVisual moderno para compor com sneakers e camisetas oversized",
    "price": 239.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Graphic"
    ],
    "rating": 5,
    "reviewCount": 19,
    "stockCount": 27,
    "sku": "MM-SHO-006",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "marrom",
        "colorName": "Marrom",
        "colorHex": "#523624",
        "image": "/Shorts Graphic - cor marrom.png",
        "featuredImage": "/Shorts Graphic - cor marrom.png",
        "images": [
          "/Shorts Graphic - cor marrom.png"
        ],
        "sku": "MM-SHO-006-MARROM",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Graphic - cor preto.png",
        "featuredImage": "/Shorts Graphic - cor preto.png",
        "images": [
          "/Shorts Graphic - cor preto.png"
        ],
        "sku": "MM-SHO-006-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Graphic - cor marrom.png",
    "images": [
      "/Shorts Graphic - cor marrom.png",
      "/Shorts Graphic - cor preto.png"
    ],
    "details": [
      "Tipografia e artes conceituais exclusivas Marmot Atelier",
      "Algodão heavyweight respirável de toque macio",
      "Corte reto com fendas laterais para caimento perfeito",
      "Cós ajustável com ponteiras metálicas escovadas",
      "Bolsos laterais com profundidade ideal para smartphone",
      "Visual moderno para compor com sneakers e camisetas oversized"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Penteado Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-007",
    "slug": "shorts-mesh-sport",
    "title": "Shorts Mesh Sport",
    "subtitle": "Mesh esportivo premium com camada dupla forrada (zero transparência)",
    "description": "Mesh esportivo premium com camada dupla forrada (zero transparência)\nModelagem inspirada nas bermudas clássicas de basquete dos anos 90\nCós canelado elástico reforçado com cordão de alta resistência\nBolsos com zíper discreto para segurança de itens essenciais\nSecagem ultra rápida e respirabilidade incomparável\nPatch emborrachado Marmot Athletics na barra",
    "price": 229.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Mesh Sport"
    ],
    "rating": 5,
    "reviewCount": 20,
    "stockCount": 28,
    "sku": "MM-SHO-007",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "off-white",
        "colorName": "Off White",
        "colorHex": "#F2EFE8",
        "image": "/Shorts Mesh Sport - cor off white.png",
        "featuredImage": "/Shorts Mesh Sport - cor off white.png",
        "images": [
          "/Shorts Mesh Sport - cor off white.png"
        ],
        "sku": "MM-SHO-007-OFF-WHITE",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Mesh Sport - cor preto.png",
        "featuredImage": "/Shorts Mesh Sport - cor preto.png",
        "images": [
          "/Shorts Mesh Sport - cor preto.png"
        ],
        "sku": "MM-SHO-007-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Mesh Sport - cor off white.png",
    "images": [
      "/Shorts Mesh Sport - cor off white.png",
      "/Shorts Mesh Sport - cor preto.png"
    ],
    "details": [
      "Mesh esportivo premium com camada dupla forrada (zero transparência)",
      "Modelagem inspirada nas bermudas clássicas de basquete dos anos 90",
      "Cós canelado elástico reforçado com cordão de alta resistência",
      "Bolsos com zíper discreto para segurança de itens essenciais",
      "Secagem ultra rápida e respirabilidade incomparável",
      "Patch emborrachado Marmot Athletics na barra"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Poliéster Mesh Dupla Camada"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-008",
    "slug": "shorts-minimal",
    "title": "Shorts Minimal",
    "subtitle": "Design clean e monocromático sem estampas ou excessos",
    "description": "Design clean e monocromático sem estampas ou excessos\nTecido encorpado com toque acetinado e estrutura fluida\nBolsos laterais invisíveis com fecho discreto\nCintura elástica anatômica interna sem marcação\nComprimento equilibrado ideal para looks elegantes do streetwear\nVersatilidade extrema para qualquer estação do ano",
    "price": 229.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Minimal"
    ],
    "rating": 5,
    "reviewCount": 21,
    "stockCount": 29,
    "sku": "MM-SHO-008",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "bege",
        "colorName": "Bege",
        "colorHex": "#C4AA84",
        "image": "/Shorts Minimal - cor bege.png",
        "featuredImage": "/Shorts Minimal - cor bege.png",
        "images": [
          "/Shorts Minimal - cor bege.png"
        ],
        "sku": "MM-SHO-008-BEGE",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Minimal - cor preto.png",
        "featuredImage": "/Shorts Minimal - cor preto.png",
        "images": [
          "/Shorts Minimal - cor preto.png"
        ],
        "sku": "MM-SHO-008-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Minimal - cor bege.png",
    "images": [
      "/Shorts Minimal - cor bege.png",
      "/Shorts Minimal - cor preto.png"
    ],
    "details": [
      "Design clean e monocromático sem estampas ou excessos",
      "Tecido encorpado com toque acetinado e estrutura fluida",
      "Bolsos laterais invisíveis com fecho discreto",
      "Cintura elástica anatômica interna sem marcação",
      "Comprimento equilibrado ideal para looks elegantes do streetwear",
      "Versatilidade extrema para qualquer estação do ano"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Penteado Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-009",
    "slug": "shorts-panel",
    "title": "Shorts Panel",
    "subtitle": "Construção com recortes geométricos em blocos de tecido contrastantes",
    "description": "Construção com recortes geométricos em blocos de tecido contrastantes\nPainéis em sarja peletizada e ripstop técnico\nCosturas duplas aparentes em linha especial reforçada\nModelagem ampla e estruturada de impacto visual marcante\nBolsos ergonômicos integrados aos recortes\nEstética arquitetônica avant-garde",
    "price": 269.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Panel"
    ],
    "rating": 5,
    "reviewCount": 14,
    "stockCount": 30,
    "sku": "MM-SHO-009",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "caqui",
        "colorName": "Caqui",
        "colorHex": "#9A8264",
        "image": "/Shorts Panel - cor caqui.png",
        "featuredImage": "/Shorts Panel - cor caqui.png",
        "images": [
          "/Shorts Panel - cor caqui.png"
        ],
        "sku": "MM-SHO-009-CAQUI",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Panel - cor preto.png",
        "featuredImage": "/Shorts Panel - cor preto.png",
        "images": [
          "/Shorts Panel - cor preto.png"
        ],
        "sku": "MM-SHO-009-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Panel - cor caqui.png",
    "images": [
      "/Shorts Panel - cor caqui.png",
      "/Shorts Panel - cor preto.png"
    ],
    "details": [
      "Construção com recortes geométricos em blocos de tecido contrastantes",
      "Painéis em sarja peletizada e ripstop técnico",
      "Costuras duplas aparentes em linha especial reforçada",
      "Modelagem ampla e estruturada de impacto visual marcante",
      "Bolsos ergonômicos integrados aos recortes",
      "Estética arquitetônica avant-garde"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Algodão Penteado Heavyweight"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-010",
    "slug": "shorts-parachute",
    "title": "Shorts Parachute",
    "subtitle": "Tecido parachute ripstop ultraleve resistente a rasgos e água",
    "description": "Tecido parachute ripstop ultraleve resistente a rasgos e água\nModelagem oversized com reguladores e stoppers metálicos na barra\nCintura com elástico franzido e cordão reforçado\nBolsos laterais amplos e bolsos utilitários com fechamento seguro\nVisual técnico com referências à cultura clubber e Y2K\nLeveza e conforto absoluto para o dia a dia",
    "price": 249.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Parachute"
    ],
    "rating": 5,
    "reviewCount": 15,
    "stockCount": 31,
    "sku": "MM-SHO-010",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "verde-oliva",
        "colorName": "Verde Oliva",
        "colorHex": "#44513B",
        "image": "/Shorts Parachute - cor verde oliva.png",
        "featuredImage": "/Shorts Parachute - cor verde oliva.png",
        "images": [
          "/Shorts Parachute - cor verde oliva.png"
        ],
        "sku": "MM-SHO-010-VERDE-OLIVA",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Parachute - cor preto.png",
        "featuredImage": "/Shorts Parachute - cor preto.png",
        "images": [
          "/Shorts Parachute - cor preto.png"
        ],
        "sku": "MM-SHO-010-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Parachute - cor verde oliva.png",
    "images": [
      "/Shorts Parachute - cor verde oliva.png",
      "/Shorts Parachute - cor preto.png"
    ],
    "details": [
      "Tecido parachute ripstop ultraleve resistente a rasgos e água",
      "Modelagem oversized com reguladores e stoppers metálicos na barra",
      "Cintura com elástico franzido e cordão reforçado",
      "Bolsos laterais amplos e bolsos utilitários com fechamento seguro",
      "Visual técnico com referências à cultura clubber e Y2K",
      "Leveza e conforto absoluto para o dia a dia"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Poliamida / Nylon Ripstop DWR"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  },
  {
    "id": "prod-sho-011",
    "slug": "shorts-tech-nylon",
    "title": "Shorts Tech Nylon",
    "subtitle": "Nylon fosco 4-way stretch de alta mobilidade e durabilidade",
    "description": "Nylon fosco 4-way stretch de alta mobilidade e durabilidade\nTratamento impermeabilizante DWR repelente a água e líquidos\nZíperes selados térmicos à prova de chuva nos bolsos\nFita de fechamento rápido na cintura com fivela magnética Fidlock style\nCaimento atlético relaxado ideal para outdoor e cidade\nEstética técnica gorpcore de alto padrão",
    "price": 259.9,
    "category": "shorts",
    "subcategory": "Shorts",
    "collection": "Coleção Marmot Summer & Utility 2026",
    "tags": [
      "Shorts",
      "Bermudas",
      "Streetwear",
      "Lançamento",
      "Shorts Tech Nylon"
    ],
    "rating": 5,
    "reviewCount": 16,
    "stockCount": 22,
    "sku": "MM-SHO-011",
    "sizes": [
      "P",
      "M",
      "G",
      "GG",
      "XG"
    ],
    "colors": [
      {
        "color": "cinza",
        "colorName": "Cinza",
        "colorHex": "#575E6B",
        "image": "/Shorts Tech Nylon - cor cinza.png",
        "featuredImage": "/Shorts Tech Nylon - cor cinza.png",
        "images": [
          "/Shorts Tech Nylon - cor cinza.png"
        ],
        "sku": "MM-SHO-011-CINZA",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      },
      {
        "color": "preto",
        "colorName": "Preto",
        "colorHex": "#121212",
        "image": "/Shorts Tech Nylon - cor preto.png",
        "featuredImage": "/Shorts Tech Nylon - cor preto.png",
        "images": [
          "/Shorts Tech Nylon - cor preto.png"
        ],
        "sku": "MM-SHO-011-PRETO",
        "stockCount": 15,
        "sizes": [
          "P",
          "M",
          "G",
          "GG",
          "XG"
        ]
      }
    ],
    "image": "/Shorts Tech Nylon - cor cinza.png",
    "images": [
      "/Shorts Tech Nylon - cor cinza.png",
      "/Shorts Tech Nylon - cor preto.png"
    ],
    "details": [
      "Nylon fosco 4-way stretch de alta mobilidade e durabilidade",
      "Tratamento impermeabilizante DWR repelente a água e líquidos",
      "Zíperes selados térmicos à prova de chuva nos bolsos",
      "Fita de fechamento rápido na cintura com fivela magnética Fidlock style",
      "Caimento atlético relaxado ideal para outdoor e cidade",
      "Estética técnica gorpcore de alto padrão"
    ],
    "careInstructions": [
      "Lavar à máquina em ciclo suave com água fria",
      "Não utilizar alvejantes ou amaciantes agressivos",
      "Secar à sombra em varal (não secar em tambor)",
      "Passar pelo avesso em temperatura média"
    ],
    "composition": [
      "100% Poliamida / Nylon Ripstop DWR"
    ],
    "weight": 0.42,
    "height": 4,
    "width": 25,
    "length": 30,
    "isNewRelease": true,
    "isBestSeller": false,
    "featured": true,
    "status": "active"
  }
];

function updateCatalogFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const original = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // Remove existing shorts
  const withoutShorts = original.filter(p => {
    const cat = String(p.category || '').toLowerCase();
    const id = String(p.id || '');
    return cat !== 'shorts' && !id.startsWith('prod-sho-');
  });
  // Add new shorts
  const merged = [...withoutShorts, ...SHORTS_PRODUCTS];
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`Updated ${filePath}: removed old shorts, inserted ${SHORTS_PRODUCTS.length} new shorts. Total products: ${merged.length}`);
}

// 1. Update data/store_products.json
updateCatalogFile(path.resolve('data/store_products.json'));

// 2. Update data/products.json
updateCatalogFile(path.resolve('data/products.json'));

// 3. Update src/data/catalog90ProductsPart1.ts
const storeProductsPath = path.resolve('data/store_products.json');
const allProds = JSON.parse(fs.readFileSync(storeProductsPath, 'utf8'));
const part1Code = `import { Product } from '../types';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ${JSON.stringify(allProds, null, 2)};\n`;
fs.writeFileSync(path.resolve('src/data/catalog90ProductsPart1.ts'), part1Code, 'utf8');
console.log(`Updated src/data/catalog90ProductsPart1.ts with ${allProds.length} products`);

// 4. Update store_categories.json
const catPath = path.resolve('data/store_categories.json');
if (fs.existsSync(catPath)) {
  const cats = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  cats.forEach(c => {
    if (c.id === 'shorts' || c.slug === 'shorts') {
      c.productCount = 11;
      c.image = '/categoria shorts.png';
    }
  });
  fs.writeFileSync(catPath, JSON.stringify(cats, null, 2), 'utf8');
  console.log(`Updated data/store_categories.json: shorts productCount = 11`);
}

// 5. Also copy public files to dist/ if dist exists so production build immediately serves them
if (fs.existsSync('dist')) {
  for (const item of SHORTS_PRODUCTS) {
    for (const img of item.images) {
      const cleanName = img.replace(/^\//, '');
      const srcFile = path.resolve('public', cleanName);
      const destFile = path.resolve('dist', cleanName);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
  }
  console.log('Copied all shorts images to dist/');
}

console.log('Shorts catalog update completed successfully!');
