import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const baseSb = createClient(url, anonKey);

const NEW_19_MOLETONS = [
  {
    num: 1,
    id: 'prod-mol-001',
    slug: 'moletom-anorak',
    title: 'Moletom Anorak',
    description: `Meio zíper frontal
Bolso canguru grande
Capuz amplo
Ajuste na barra
Visual inspirado em jaquetas corta-vento
Modelagem solta e utilitária`,
    sku: 'MM-MOL-001',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 2,
    id: 'prod-mol-002',
    slug: 'moletom-asymmetric-zip',
    title: 'Moletom Asymmetric Zip',
    description: `Zíper frontal diagonal
Gola alta
Construção assimétrica
Recortes menos convencionais
Visual moderno e experimental
Caimento oversized`,
    sku: 'MM-MOL-002',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 3,
    id: 'prod-mol-003',
    slug: 'moletom-distressed',
    title: 'Moletom Distressed',
    description: `Lavagem envelhecida
Bordas propositalmente desgastadas
Pequenos rasgos ou áreas puídas
Acabamento irregular
Estética grunge
Aparência vintage`,
    sku: 'MM-MOL-003',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 4,
    id: 'prod-mol-004',
    slug: 'moletom-double-hood',
    title: 'Moletom Double Hood',
    description: `Dois capuzes sobrepostos
Construção em camadas
Parte superior mais volumosa
Aparência pesada
Modelagem oversized
Visual streetwear marcante`,
    sku: 'MM-MOL-004',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 5,
    id: 'prod-mol-005',
    slug: 'moletom-double-layer',
    title: 'Moletom Double Layer',
    description: `Segunda camada aparente na barra
Mangas com efeito de sobreposição
Aparência de duas peças usadas juntas
Comprimentos diferentes entre as camadas
Modelagem ampla
Visual em camadas`,
    sku: 'MM-MOL-005',
    image: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 6,
    id: 'prod-mol-006',
    slug: 'moletom-funnel-neck',
    title: 'Moletom Funnel Neck',
    description: `Gola alta e larga
Sem capuz tradicional
Gola com bastante volume
Design minimalista
Ombros caídos
Modelagem ampla`,
    sku: 'MM-MOL-006',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 7,
    id: 'prod-mol-007',
    slug: 'moletom-half-zip-utility',
    title: 'Moletom Half Zip Utility',
    description: `Zíper somente até o peito
Gola alta
Bolso frontal utilitário
Detalhes funcionais
Modelagem oversized
Inspiração técnica e outdoor`,
    sku: 'MM-MOL-007',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 8,
    id: 'prod-mol-008',
    slug: 'moletom-heavy-boxy',
    title: 'Moletom Heavy Boxy',
    description: `Corpo mais curto e largo
Modelagem boxy
Ombros caídos
Capuz estruturado
Punhos e barra grossos
Tecido pesado e encorpado`,
    sku: 'MM-MOL-008',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 9,
    id: 'prod-mol-009',
    slug: 'moletom-inside-out',
    title: 'Moletom Inside Out',
    description: `Costuras propositalmente expostas
Acabamentos aparentes
Etiquetas externas ou detalhes invertidos
Construção com aparência de roupa do avesso
Modelagem oversized
Estética desconstruída`,
    sku: 'MM-MOL-009',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 10,
    id: 'prod-mol-010',
    slug: 'moletom-mock-neck',
    title: 'Moletom Mock Neck',
    description: `Gola média ou alta
Sem capuz
Visual limpo
Ombros caídos
Corpo largo
Tecido encorpado`,
    sku: 'MM-MOL-010',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 11,
    id: 'prod-mol-011',
    slug: 'moletom-panel-construction',
    title: 'Moletom Panel Construction',
    description: `Diversos painéis no corpo
Recortes geométricos
Costuras bem evidentes
Construção em blocos
Mistura de diferentes texturas
Estética arquitetônica`,
    sku: 'MM-MOL-011',
    image: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 12,
    id: 'prod-mol-012',
    slug: 'moletom-pocket-cargo',
    title: 'Moletom Pocket Cargo',
    description: `Bolsos grandes frontais
Bolsos adicionais laterais
Detalhes utilitários
Capuz amplo
Corpo oversized
Visual inspirado em roupas cargo`,
    sku: 'MM-MOL-012',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 13,
    id: 'prod-mol-013',
    slug: 'moletom-raglan-sport',
    title: 'Moletom Raglan Sport',
    description: `Mangas raglan
Costura da manga partindo da gola
Recortes esportivos
Corpo largo
Punhos contrastantes
Inspiração em roupas esportivas retrô`,
    sku: 'MM-MOL-013',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 14,
    id: 'prod-mol-014',
    slug: 'moletom-raw-seam',
    title: 'Moletom Raw Seam',
    description: `Costuras viradas para fora
Barra parcialmente sem acabamento
Bordas cruas
Construção desconstruída
Modelagem boxy
Aparência propositalmente imperfeita`,
    sku: 'MM-MOL-014',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 15,
    id: 'prod-mol-015',
    slug: 'moletom-sherpa-panel',
    title: 'Moletom Sherpa Panel',
    description: `Painéis em tecido sherpa
Mistura de tecidos lisos e felpudos
Construção estruturada
Aparência pesada
Visual de inverno
Contraste forte de texturas`,
    sku: 'MM-MOL-015',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 16,
    id: 'prod-mol-016',
    slug: 'moletom-sleeveless-hoodie',
    title: 'Moletom Sleeveless Hoodie',
    description: `Sem mangas
Ombros largos
Capuz grande
Cavas amplas
Corpo oversized
Ideal para sobreposição com camiseta`,
    sku: 'MM-MOL-016',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 17,
    id: 'prod-mol-017',
    slug: 'moletom-striped-heavy',
    title: 'Moletom Striped Heavy',
    description: `Listras horizontais largas
Tecido pesado
Modelagem oversized
Ombros caídos
Mangas largas
Visual streetwear retrô`,
    sku: 'MM-MOL-017',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 18,
    id: 'prod-mol-018',
    slug: 'moletom-varsity-oversized',
    title: 'Moletom Varsity Oversized',
    description: `Inspiração universitária
Letras ou aplicações grandes
Punhos e barra com listras
Corpo oversized
Ombros largos
Visual varsity streetwear`,
    sku: 'MM-MOL-018',
    image: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 19,
    id: 'prod-mol-019',
    slug: 'moletom-zip-up-washed',
    title: 'Moletom Zip Up Washed',
    description: `Zíper frontal completo
Capuz tradicional
Lavagem estonada
Aparência desbotada
Modelagem oversized
Visual vintage
Tecido com aspecto envelhecido`,
    sku: 'MM-MOL-019',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
  },
];

async function execute() {
  console.log('=== 1. AUTENTICANDO COMO ADMIN NO SUPABASE ===');
  const { data: authData, error: authErr } = await baseSb.auth.signInWithPassword({
    email: 'admin@marmot.com',
    password: 'marmot',
  });

  if (authErr || !authData.session?.access_token) {
    console.error('Falha no login admin:', authErr);
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log('✓ Admin autenticado com sucesso:', authData.user.email);

  const adminSb = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\n=== 2. IDENTIFICANDO E EXCLUINDO TODOS OS MOLETONS ANTIGOS ===');
  const { data: allProducts, error: fetchErr } = await adminSb.from('products').select('*');
  if (fetchErr) {
    console.error('Erro ao listar produtos:', fetchErr);
    process.exit(1);
  }

  const oldMoletons = allProducts.filter(p => p.category?.toLowerCase() === 'moletons' || p.category?.toLowerCase() === 'moletom');
  console.log(`Encontrados ${oldMoletons.length} moletons para exclusão permanente:`);
  for (const m of oldMoletons) {
    const { error: delErr } = await adminSb.from('products').delete().eq('id', m.id);
    if (delErr) {
      console.error(`Erro ao deletar ${m.id}:`, delErr);
    } else {
      console.log(`   [EXCLUÍDO] ID: ${m.id} | ${m.title}`);
    }
  }

  // Verifica se a exclusão foi total
  const { data: checkDeleted } = await adminSb.from('products').select('id, title').eq('category', 'moletons');
  console.log(`Moletons restantes na tabela após exclusão: ${checkDeleted?.length || 0}`);

  console.log('\n=== 3. CADASTRANDO OS 19 NOVOS MOLETONS NO SUPABASE ===');
  for (const item of NEW_19_MOLETONS) {
    const productPayload = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: '',
      description: item.description,
      price: 349.90,
      promo_price: null,
      category: 'moletons',
      subcategory: 'Moletons',
      collection: 'Coleção Marmot Atelier',
      tags: ['Moletom', 'Streetwear'],
      rating: 5.0,
      review_count: 0,
      stock_count: 25,
      sku: item.sku,
      sizes: ['P', 'M', 'G', 'GG', 'XG'],
      colors: [
        {
          color: 'black',
          colorName: 'Preto',
          colorHex: '#121212',
          image: item.image,
          featuredImage: item.image,
          images: [item.image]
        },
        {
          color: 'grey',
          colorName: 'Cinza Mescla',
          colorHex: '#71717A',
          image: item.image,
          featuredImage: item.image,
          images: [item.image]
        }
      ],
      image: item.image,
      images: [item.image],
      details: [
        'Modelagem exclusiva Marmot',
        'Acabamento pespontado reforçado',
        'Confeccionado artesanalmente'
      ],
      care_instructions: [
        'Lavar do avesso em água fria',
        'Não usar secadora rotativa',
        'Secar à sombra'
      ],
      composition: [
        '100% Algodão Heavyweight'
      ],
      weight: 0.85,
      height: 8,
      width: 30,
      length: 35,
      is_new_release: true,
      is_best_seller: false,
      featured: true,
      status: 'active',
      data: {
        id: item.id,
        slug: item.slug,
        title: item.title,
        subtitle: '',
        description: item.description,
        price: 349.90,
        category: 'moletons',
        subcategory: 'Moletons',
        collection: 'Coleção Marmot Atelier',
        tags: ['Moletom', 'Streetwear'],
        rating: 5.0,
        reviewCount: 0,
        stockCount: 25,
        sku: item.sku,
        sizes: ['P', 'M', 'G', 'GG', 'XG'],
        colors: [
          {
            color: 'black',
            colorName: 'Preto',
            colorHex: '#121212',
            image: item.image,
            featuredImage: item.image,
            images: [item.image]
          },
          {
            color: 'grey',
            colorName: 'Cinza Mescla',
            colorHex: '#71717A',
            image: item.image,
            featuredImage: item.image,
            images: [item.image]
          }
        ],
        image: item.image,
        images: [item.image],
        details: [
          'Modelagem exclusiva Marmot',
          'Acabamento pespontado reforçado',
          'Confeccionado artesanalmente'
        ],
        careInstructions: [
          'Lavar do avesso em água fria',
          'Não usar secadora rotativa',
          'Secar à sombra'
        ],
        composition: [
          '100% Algodão Heavyweight'
        ],
        weight: 0.85,
        height: 8,
        width: 30,
        length: 35,
        isNewRelease: true,
        isBestSeller: false,
        featured: true,
        status: 'active',
        createdAt: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: inserted, error: insErr } = await adminSb.from('products').upsert(productPayload).select().single();
    if (insErr) {
      console.error(`Erro ao inserir ${item.title}:`, insErr);
    } else {
      console.log(`   ✓ [${item.num}/19] Cadastrado: ${item.title} (ID: ${inserted.id})`);
    }
  }

  console.log('\n=== 4. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: finalAll } = await adminSb.from('products').select('*').order('created_at', { ascending: true });
  const finalMoletons = finalAll.filter(p => p.category?.toLowerCase() === 'moletons' || p.category?.toLowerCase() === 'moletom');

  console.log(`\n==================================================================`);
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA MOLETONS NO BANCO: ${finalMoletons.length}`);
  console.log(`==================================================================\n`);

  finalMoletons.forEach((m, idx) => {
    console.log(`${idx + 1}. NOME: ${m.title}`);
    console.log(`   ID: ${m.id} | SLUG: ${m.slug} | CATEGORIA: ${m.category}`);
    console.log(`   DESCRIÇÃO REGISTRADA:`);
    console.log(`   ${m.description.split('\n').join('\n   ')}`);
    console.log('------------------------------------------------------------------');
  });

  const categoriesCount = {};
  finalAll.forEach(p => {
    categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
  });
  console.log('\nDISTRIBUIÇÃO DE TODAS AS CATEGORIAS NO BANCO:');
  console.log(categoriesCount);
  console.log(`TOTAL GERAL DE PRODUTOS NO BANCO: ${finalAll.length}`);
}

execute();
