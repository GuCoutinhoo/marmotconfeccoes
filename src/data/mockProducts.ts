import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  // 1. CAMISETAS OVERSIZED & HEAVYWEIGHT
  {
    id: 'prod-001',
    slug: 'camiseta-oversized-heavyweight-essential-black',
    title: 'T-Shirt Oversized Heavyweight "Signature" Black',
    subtitle: 'Algodão Penteado 260g/m² | Gola Canelada 3cm',
    description: 'A camiseta que redefiniu o streetwear autoral brasileiro. Confeccionada em algodão puro penteado de 260g/m² com toque denso e caimento boxy impecável. Possui gola ribana canelada de 3cm com reforço de ombro a ombro para nunca esgarçar.',
    price: 189.90,
    promoPrice: 159.90,
    category: 'oversized',
    subcategory: 'Heavyweight 260g',
    collection: 'Drop 04 // Essenciais',
    tags: ['Lançamento', 'Mais Vendido'],
    rating: 4.9,
    reviewCount: 58,
    stockCount: 14,
    sku: 'MRM-TSH-001-BLK',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: [
      { color: 'black', colorName: 'Preto Ônix', colorHex: '#121212' },
      { color: 'grey', colorName: 'Chumbo Lavado', colorHex: '#38383B' },
      { color: 'white', colorName: 'Off-White Natural', colorHex: '#F0EFEA' }
    ],
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80'
    ],
    details: [
      '100% Algodão Nacional Penteado Heavyweight (260g/m²)',
      'Modelagem Boxy Fit exclusiva com ombros caídos e caimento estruturado',
      'Gola canelada de 3,0cm pespontada de alta densidade',
      'Tecido pré-encolhido e estonado (não encolhe e não deforma na máquina)',
      'Etiqueta tecida acetinada na barra e costura reforçada nas cavas'
    ],
    careInstructions: [
      'Lavar à máquina em ciclo suave com água fria',
      'Não utilizar alvejantes ou produtos à base de cloro',
      'Secar no varal à sombra (evitar secadora para maior durabilidade)',
      'Passar do avesso em temperatura média'
    ],
    weight: 0.35,
    height: 4,
    width: 20,
    length: 25,
    reviews: [
      {
        id: 'rev-1',
        userName: 'Lucas M. Vasconcelos',
        rating: 5,
        date: '12/08/2026',
        title: 'Qualidade surreal da malha!',
        comment: 'A malha é absurdamente pesada e encorpada. A gola de 3cm fica perfeita no pescoço e o caimento nos ombros é o melhor que já vi no mercado nacional. Tenho 1,82m e 80kg, o tamanho G ficou impecável.',
        verifiedPurchase: true,
        likes: 24
      },
      {
        id: 'rev-2',
        userName: 'Thiago R. Silveira',
        rating: 5,
        date: '05/08/2026',
        title: 'Melhor t-shirt streetwear nacional',
        comment: 'Chegou em 2 dias úteis aqui em SP. O cheiro da embalagem e a apresentação são impecáveis. Dá de 10 a 0 em marcas importadas.',
        verifiedPurchase: true,
        likes: 15
      }
    ],
    isNewRelease: true,
    isBestSeller: true,
    featured: true
  },
  {
    id: 'prod-002',
    slug: 'camiseta-boxy-vintage-acid-wash-grey',
    title: 'Camiseta Boxy "Atelier Archive" Vintage Washed',
    subtitle: 'Lavagem Acid Wash Artesanal | 100% Algodão',
    description: 'Processo de estonagem industrial em lavanderia paulista que confere toque aveludado e visual vintage único para cada unidade. Modelagem boxy ampla desenvolvida para o cotidiano urbano.',
    price: 179.90,
    category: 'oversized',
    subcategory: 'Garment Dye',
    collection: 'Drop 04 // Essenciais',
    tags: ['Lançamento', 'Exclusivo'],
    rating: 4.8,
    reviewCount: 36,
    stockCount: 11,
    sku: 'MRM-TSH-002-GRY',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { color: 'grey', colorName: 'Cinza Acid Wash', colorHex: '#4A4B4D' },
      { color: 'olive', colorName: 'Verde Musgo Lavado', colorHex: '#485044' }
    ],
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80'
    ],
    details: [
      'Algodão 100% 230g/m² com lavagem stone wash',
      'Acabamento com costura pespontada reforçada',
      'Gola estruturada de 2.8cm',
      'Impressão sutil em silk screen de alta durabilidade'
    ],
    careInstructions: ['Lavar separadamente nas primeiras vezes', 'Secar à sombra'],
    weight: 0.35,
    height: 4,
    width: 20,
    length: 25,
    reviews: [
      {
        id: 'rev-3',
        userName: 'Gabriel F. Castro',
        rating: 5,
        date: '08/08/2026',
        title: 'A lavagem é ainda mais bonita pessoalmente',
        comment: 'Comprei o tamanho M e o caimento ficou solto sem parecer desleixado. Já lavei 3 vezes e não encolheu nem desbotou nada.',
        verifiedPurchase: true
      }
    ],
    isNewRelease: true
  },
  {
    id: 'prod-003',
    slug: 'camiseta-graphic-atelier-monochrome-white',
    title: 'Camiseta Graphic "Atelier Typography" Off-White',
    subtitle: 'Malha Heavy 240g | Silk Screen de Alta Densidade',
    description: 'Estampa editorial de alta resolução inspirada no design brutalista e na arquitetura paulistana. Confeccionada em algodão orgânico pré-encolhido com toque ultra macio.',
    price: 169.90,
    promoPrice: 139.90,
    category: 'camisetas',
    subcategory: 'Graphic Tees',
    collection: 'Drop 04 // Essenciais',
    tags: ['Oferta', 'Mais Vendido'],
    rating: 4.7,
    reviewCount: 42,
    stockCount: 20,
    sku: 'MRM-TSH-003-WHT',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: [
      { color: 'white', colorName: 'Off-White Natural', colorHex: '#F5F3EF' },
      { color: 'black', colorName: 'Preto Profundo', colorHex: '#101010' }
    ],
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80'
    ],
    details: ['100% Algodão Premium', 'Estampa Silk Screen de 4 cores', 'Toque macio'],
    careInstructions: ['Lavar do avesso', 'Não passar ferro direto na estampa'],
    weight: 0.35,
    height: 4,
    width: 20,
    length: 25,
    reviews: [],
    isBestSeller: true
  },

  // 2. HOODIES & MOLETONS
  {
    id: 'prod-004',
    slug: 'hoodie-heavyweight-400g-atelier-black',
    title: 'Hoodie Heavyweight 400g "Marmot Boxy" Black',
    subtitle: 'Moletom 3 Cabos 400g/m² | Capuz Duplo Estruturado',
    description: 'O hoodie mais robusto da cena nacional. Confeccionado em moletom pesado 3 cabos com interior flanelado macio e denso. Capuz anatômico duplo que fica armado sem cordões, bolso canguru amplo com costura tripla e bordado discreto no peito.',
    price: 399.90,
    promoPrice: 349.90,
    category: 'moletons',
    subcategory: 'Hoodie Heavy 400g',
    collection: 'Winter Drop',
    tags: ['Lançamento', 'Mais Vendido', 'Exclusivo'],
    rating: 5.0,
    reviewCount: 78,
    stockCount: 8,
    sku: 'MRM-HD-004-BLK',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: [
      { color: 'black', colorName: 'Preto Ônix', colorHex: '#0D0D0E' },
      { color: 'grey', colorName: 'Cinza Mescla Escuro', colorHex: '#52525B' }
    ],
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1000&q=80'
    ],
    details: [
      'Moletom 3 Cabos Heavyweight 400g/m² (70% Algodão / 30% Poliéster Premium)',
      'Capuz duplo estruturado sem cordão (visual clean contemporâneo)',
      'Punhos e barra em ribana pesada com reforço elástico',
      'Bordado frontal no peito em alta definição',
      'Bolso Canguru reforçado com travetes de segurança em pontos de tração'
    ],
    careInstructions: [
      'Lavar do avesso em ciclo suave com água fria',
      'Não secar em máquina para manter o toque macio do forro',
      'Secar no varal à sombra'
    ],
    weight: 0.75,
    height: 8,
    width: 25,
    length: 30,
    reviews: [
      {
        id: 'rev-4',
        userName: 'Matheus B. Sampaio',
        rating: 5,
        date: '14/08/2026',
        title: 'O melhor hoodie que já tive na vida',
        comment: 'A touca fica perfeitamente em pé sem ficar caída nos ombros. O moletom esquenta de verdade e o caimento boxy é absurdo. Vale cada centavo investido.',
        verifiedPurchase: true,
        likes: 31
      }
    ],
    isNewRelease: true,
    isBestSeller: true,
    featured: true
  },
  {
    id: 'prod-005',
    slug: 'zip-hoodie-tactical-heavy-charcoal',
    title: 'Zip Hoodie Heavyweight "Atelier" Washed Charcoal',
    subtitle: 'Zíper Metálico Duplo YKK® | Moletom 380g/m²',
    description: 'Moletom com fecho em zíper metálico bidirecional YKK, permitindo aberturas superior e inferior para composições contemporâneas em camadas. Possui bolso interno para celular e acabamento encorpado.',
    price: 429.90,
    category: 'moletons',
    subcategory: 'Zip Hoodie',
    collection: 'Winter Drop',
    tags: ['Últimas Peças'],
    rating: 4.9,
    reviewCount: 24,
    stockCount: 5,
    sku: 'MRM-ZIP-005-CHR',
    sizes: ['M', 'G', 'GG'],
    colors: [
      { color: 'grey', colorName: 'Chumbo Estonado', colorHex: '#2B2C2E' }
    ],
    images: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80'
    ],
    details: [
      'Moletom Flanelado 380g/m²',
      'Zíper YKK Bidirecional em metal fosco antioxidante',
      'Puxador personalizado em fita tecida'
    ],
    careInstructions: ['Fechar o zíper antes de lavar', 'Lavar em água fria'],
    weight: 0.75,
    height: 8,
    width: 25,
    length: 30,
    reviews: []
  },

  // 3. JAQUETAS & OUTERWEAR
  {
    id: 'prod-006',
    slug: 'jaqueta-puffer-tactical-stealth-black',
    title: 'Puffer Jacket "Urban Shield" Impermeável',
    subtitle: 'Isolamento Térmico 300g | Tecido Ripstop Hidrorrepelente',
    description: 'Jaqueta Puffer desenvolvida para baixas temperaturas e garoa urbana. Tecido exterior em Ripstop fosco impermeável com isolamento sintético de altíssima retenção térmica. Conta com ajuste nos punhos, barra com cordão elástico e bolso interno seguro.',
    price: 589.90,
    promoPrice: 499.90,
    category: 'jaquetas',
    subcategory: 'Puffer Jacket',
    collection: 'Winter Drop',
    tags: ['Lançamento', 'Exclusivo', 'Mais Vendido'],
    rating: 5.0,
    reviewCount: 42,
    stockCount: 7,
    sku: 'MRM-PUF-006-BLK',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { color: 'black', colorName: 'Preto Fosco', colorHex: '#151516' },
      { color: 'silver', colorName: 'Cinza Concreto', colorHex: '#8E9196' }
    ],
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
    ],
    details: [
      'Membrana exterior repelente à água e bloqueadora de vento',
      'Enchimento sintético ecológico ultra leve e de alto aquecimento',
      'Zíperes vedados contra chuva',
      'Ajustadores na barra e gola alta com proteção de queixo'
    ],
    careInstructions: ['Limpar com pano úmido ou lavagem a seco profissional'],
    weight: 0.8,
    height: 10,
    width: 30,
    length: 35,
    reviews: [
      {
        id: 'rev-5',
        userName: 'Fernando K. Silva',
        rating: 5,
        date: '10/08/2026',
        title: 'Corta totalmente o vento!',
        comment: 'Fui para Gramado com ela e segurou 4°C tranquilamente apenas com uma t-shirt pesada por baixo. Caimento impecável.',
        verifiedPurchase: true
      }
    ],
    isNewRelease: true,
    isBestSeller: true,
    featured: true
  },
  {
    id: 'prod-007',
    slug: 'jaqueta-windbreaker-tactical-olive',
    title: 'Windbreaker Utility "Urban Shell" Olive Green',
    subtitle: 'Nylon Ripstop 100% Poliamida | Leve & Corta-Vento',
    description: 'Jaqueta corta-vento tática e leve com capuz ajustável e múltiplos bolsos selados. Ideal para sobreposições no dia a dia e clima imprevisível.',
    price: 349.90,
    category: 'jaquetas',
    subcategory: 'Windbreaker',
    collection: 'Drop 04 // Essenciais',
    tags: ['Lançamento'],
    rating: 4.8,
    reviewCount: 18,
    stockCount: 12,
    sku: 'MRM-WND-007-OLV',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: [
      { color: 'olive', colorName: 'Verde Militar', colorHex: '#3E4438' },
      { color: 'black', colorName: 'Preto Ônix', colorHex: '#121212' }
    ],
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80'
    ],
    details: ['Nylon Ripstop 100% poliamida', 'Repelente à água', 'Forro interno em mesh transpirável'],
    careInstructions: ['Lavar à mão com sabão neutro'],
    weight: 0.35,
    height: 4,
    width: 20,
    length: 25,
    reviews: []
  },

  // 4. CALÇAS CARGO & JEANS
  {
    id: 'prod-008',
    slug: 'calca-cargo-tactical-ripstop-multi-pocket-black',
    title: 'Calça Cargo Tactical "Multi-Pocket" Ripstop Black',
    subtitle: '8 Bolsos Utilitários | Ajuste Regulável no Tornozelo',
    description: 'A calça cargo definitiva para o streetwear autoral. Tecido Ripstop denso e reforçado contra atrito, corte amplo com regulador elástico na barra que permite usar a peça solta wide ou afunilada no estilo jogger.',
    price: 329.90,
    promoPrice: 289.90,
    category: 'cargos',
    subcategory: 'Ripstop Tactical',
    collection: 'Drop 04 // Essenciais',
    tags: ['Mais Vendido', 'Oferta'],
    rating: 4.9,
    reviewCount: 65,
    stockCount: 18,
    sku: 'MRM-CRG-008-BLK',
    sizes: ['38', '40', '42', '44', '46'],
    colors: [
      { color: 'black', colorName: 'Preto Ônix', colorHex: '#111111' },
      { color: 'khaki', colorName: 'Cáqui Deserto', colorHex: '#A3937B' }
    ],
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80'
    ],
    details: [
      'Tecido Ripstop Utilitário Encorpado (65% Algodão / 35% Poliéster)',
      '8 Bolsos amplos com fechamento em velcro e botões de pressão',
      'Cintura com elástico confortável e passantes reforçados para cinto',
      'Regulador de barra com cordão elástico e stoppers metálicos'
    ],
    careInstructions: ['Lavar do avesso em água fria', 'Não utilizar secadora'],
    weight: 0.55,
    height: 5,
    width: 22,
    length: 28,
    reviews: [
      {
        id: 'rev-6',
        userName: 'Rodrigo A. Carvalho',
        rating: 5,
        date: '06/08/2026',
        title: 'Caimento absurdo com tênis chunky',
        comment: 'Corta muito bem no corpo e os bolsos comportam carteira, celular e chaves sem deformar a silhueta da calça. Já comprei a cáqui também.',
        verifiedPurchase: true
      }
    ],
    isBestSeller: true,
    featured: true
  },
  {
    id: 'prod-009',
    slug: 'calca-jeans-wide-leg-baggy-fit-vintage-blue',
    title: 'Calça Jeans Wide Leg "Baggy 90s" Vintage Blue',
    subtitle: 'Denim Pesado 14oz | 100% Algodão Puro',
    description: 'Denim encorpado 14oz com lavagem artesanal vintage stonewashed. Modelagem inspirada na era de ouro do skate dos anos 90, com pernas largas e caimento reto impecável no calçado.',
    price: 319.90,
    category: 'calcas',
    subcategory: 'Baggy Denim',
    collection: 'Drop 04 // Essenciais',
    tags: ['Lançamento', 'Mais Vendido'],
    rating: 4.8,
    reviewCount: 45,
    stockCount: 14,
    sku: 'MRM-JNS-009-BLU',
    sizes: ['38', '40', '42', '44', '46'],
    colors: [
      { color: 'blue', colorName: 'Azul Vintage Lavado', colorHex: '#4C6B8B' },
      { color: 'black', colorName: 'Preto Estonado', colorHex: '#222326' }
    ],
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
    ],
    details: [
      'Jeans 100% Algodão Denso 14oz',
      'Botões e rebites metálicos antioxidantes personalizados Marmot',
      'Etiqueta traseira em couro natural com gravação em baixo relevo'
    ],
    careInstructions: ['Lavar com água fria e do avesso'],
    weight: 0.6,
    height: 5,
    width: 22,
    length: 28,
    reviews: []
  },

  // 5. SHORTS & HEADWEAR
  {
    id: 'prod-010',
    slug: 'shorts-mesh-basketball-double-layer-black',
    title: 'Shorts Mesh "Court Classic" Double Layer',
    subtitle: 'Camada Dupla em Mesh Respirável | Bolsos com Zíper',
    description: 'Bermuda inspirada no basquete de rua dos anos 90. Tecido perfurado duplo com forro suave, bolsos laterais com zíper embutido e cós elástico anatômico com cordão reforçado.',
    price: 189.90,
    promoPrice: 159.90,
    category: 'shorts',
    subcategory: 'Basketball Mesh Shorts',
    collection: 'Summer Archive',
    tags: ['Oferta', 'Mais Vendido'],
    rating: 4.9,
    reviewCount: 33,
    stockCount: 16,
    sku: 'MRM-SHR-010-BLK',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { color: 'black', colorName: 'Preto & Branco', colorHex: '#121212' },
      { color: 'red', colorName: 'Bulls Red', colorHex: '#8B0000' }
    ],
    images: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80'
    ],
    details: ['100% Poliéster Mesh Técnico Duplo', 'Comprimento acima do joelho', 'Cós com elástico pesado'],
    careInstructions: ['Lavar em ciclo suave'],
    weight: 0.4,
    height: 4,
    width: 20,
    length: 25,
    reviews: []
  },
  {
    id: 'prod-011',
    slug: 'bone-5-panel-strapback-sarja-black',
    title: 'Boné 5 Panel Strapback "Marmot Core" Black',
    subtitle: 'Sarja Pesada de Algodão | Fivela em Metal Fosco',
    description: 'Boné 5 Panel em sarja densa de puro algodão. Aba reta estruturada e maleável, fecho traseiro ajustável em fita de algodão com fivela metálica e bordado frontal minimalista.',
    price: 129.90,
    category: 'bones',
    subcategory: '5 Panel Strapback',
    collection: 'Drop 04 // Essenciais',
    tags: ['Mais Vendido'],
    rating: 4.9,
    reviewCount: 52,
    stockCount: 28,
    sku: 'MRM-CAP-011-BLK',
    sizes: ['Único (Ajustável de 54 a 62cm)'],
    colors: [
      { color: 'black', colorName: 'Preto', colorHex: '#0F0F10' },
      { color: 'olive', colorName: 'Verde Militar', colorHex: '#3B4234' }
    ],
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=1000&q=80'
    ],
    details: ['100% Sarja de Algodão Heavy', 'Ilhoses bordados para respiração', 'Ajuste livre de circunferência'],
    careInstructions: ['Limpar com escova macia e seca'],
    weight: 0.25,
    height: 12,
    width: 18,
    length: 20,
    reviews: []
  },
  {
    id: 'prod-012',
    slug: 'gorro-beanie-heavy-knit-black',
    title: 'Gorro Beanie Heavy Knit "Winter Rib" Black',
    subtitle: 'Tricô Canelado Pesado | Toque Macio e Térmico',
    description: 'Gorro canelado confeccionado em fio acrílico premium com toque de lã. Elasticidade confortável que não aperta a cabeça e mantém as orelhas aquecidas.',
    price: 99.90,
    category: 'bones',
    subcategory: 'Beanies',
    collection: 'Winter Drop',
    tags: ['Lançamento'],
    rating: 4.8,
    reviewCount: 21,
    stockCount: 20,
    sku: 'MRM-BEN-012-BLK',
    sizes: ['Único'],
    colors: [
      { color: 'black', colorName: 'Preto', colorHex: '#101010' },
      { color: 'grey', colorName: 'Cinza Mescla', colorHex: '#5A5A5C' }
    ],
    images: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=80'
    ],
    details: ['Tricô 100% Acrílico Premium', 'Etiqueta tecida dobrada na barra'],
    careInstructions: ['Lavar à mão'],
    weight: 0.2,
    height: 5,
    width: 15,
    length: 20,
    reviews: []
  }
];
