import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const baseSb = createClient(url, anonKey);

const NEW_10_CAMISETAS = [
  {
    num: 1,
    id: 'prod-cam-001',
    slug: 'camiseta-contrast-stitch',
    title: 'Camiseta Contrast Stitch',
    description: `Costuras em cor contrastante
Linhas aparentes no corpo e nas mangas
Visual gráfico e marcante
Modelagem ampla
Ombros levemente caídos
Acabamento streetwear moderno`,
    sku: 'MM-CAM-001',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 2,
    id: 'prod-cam-002',
    slug: 'camiseta-double-layer',
    title: 'Camiseta Double Layer',
    description: `Segunda camada aparente na barra
Mangas com efeito de sobreposição
Comprimentos diferentes entre as camadas
Aparência de duas camisetas usadas juntas
Modelagem oversized
Visual em camadas`,
    sku: 'MM-CAM-002',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 3,
    id: 'prod-cam-003',
    slug: 'camiseta-drop-shoulder',
    title: 'Camiseta Drop Shoulder',
    description: `Ombros bem caídos
Costura da manga abaixo da linha natural do ombro
Mangas mais largas
Corpo amplo
Caimento relaxado
Visual streetwear minimalista`,
    sku: 'MM-CAM-003',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 4,
    id: 'prod-cam-004',
    slug: 'camiseta-heavy-boxy',
    title: 'Camiseta Heavy Boxy',
    description: `Corpo curto e largo
Modelagem boxy
Ombros caídos
Mangas largas
Tecido pesado e encorpado
Estrutura firme`,
    sku: 'MM-CAM-004',
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 5,
    id: 'prod-cam-005',
    slug: 'camiseta-panel',
    title: 'Camiseta Panel',
    description: `Painéis diferentes no corpo
Recortes geométricos
Costuras aparentes
Possibilidade de contraste entre tecidos ou cores
Construção visual mais elaborada
Estética arquitetônica`,
    sku: 'MM-CAM-005',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 6,
    id: 'prod-cam-006',
    slug: 'camiseta-pocket-utility',
    title: 'Camiseta Pocket Utility',
    description: `Bolso grande no peito
Bolsos adicionais ou divisórias utilitárias
Detalhes funcionais
Modelagem oversized
Visual inspirado em roupas cargo
Construção prática e streetwear`,
    sku: 'MM-CAM-006',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 7,
    id: 'prod-cam-007',
    slug: 'camiseta-raglan-oversized',
    title: 'Camiseta Raglan Oversized',
    description: `Mangas raglan
Costura das mangas partindo da gola
Mangas amplas
Corpo largo
Modelagem oversized
Visual esportivo e retrô`,
    sku: 'MM-CAM-007',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 8,
    id: 'prod-cam-008',
    slug: 'camiseta-raw-hem',
    title: 'Camiseta Raw Hem',
    description: `Barra com acabamento cru
Bordas propositalmente sem acabamento tradicional
Costuras aparentes
Visual desconstruído
Modelagem ampla
Aparência propositalmente irregular`,
    sku: 'MM-CAM-008',
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 9,
    id: 'prod-cam-009',
    slug: 'camiseta-striped-heavy',
    title: 'Camiseta Striped Heavy',
    description: `Listras horizontais largas
Tecido pesado
Modelagem oversized
Ombros caídos
Mangas largas
Visual streetwear retrô`,
    sku: 'MM-CAM-009',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
  },
  {
    num: 10,
    id: 'prod-cam-010',
    slug: 'camiseta-washed-vintage',
    title: 'Camiseta Washed Vintage',
    description: `Lavagem envelhecida
Efeito desbotado
Tecido com aparência usada
Tonalidade irregular
Modelagem oversized
Visual vintage e streetwear`,
    sku: 'MM-CAM-010',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
  },
];

async function execute() {
  console.log('=== 1. AUTENTICANDO COMO ADMIN NO SUPABASE ===');
  const { data: authData, error: authErr } = await baseSb.auth.signInWithPassword({
    email: 'admin@marmot.com',
    password: process.env.ADMIN_PASSWORD || '',
  });

  if (authErr || !authData.session?.access_token) {
    console.error('Falha no login admin:', authErr);
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log('✓ Admin autenticado:', authData.user.email);

  const adminSb = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\n=== 2. IDENTIFICANDO E EXCLUINDO TODAS AS CAMISETAS ANTIGAS ===');
  const { data: allProducts, error: fetchErr } = await adminSb.from('products').select('*');
  if (fetchErr) {
    console.error('Erro ao listar produtos:', fetchErr);
    process.exit(1);
  }

  const oldCamisetas = allProducts.filter(p => p.category?.toLowerCase() === 'camisetas' || p.category?.toLowerCase() === 'camiseta');
  console.log(`Encontradas ${oldCamisetas.length} camisetas antigas para exclusão permanente:`);
  for (const c of oldCamisetas) {
    const { error: delErr } = await adminSb.from('products').delete().eq('id', c.id);
    if (delErr) {
      console.error(`Erro ao deletar ${c.id}:`, delErr);
    } else {
      console.log(`   [EXCLUÍDA] ID: ${c.id} | ${c.title}`);
    }
  }

  // Verifica se a exclusão foi total
  const { data: checkDeleted } = await adminSb.from('products').select('id, title').eq('category', 'camisetas');
  console.log(`Camisetas restantes na tabela após exclusão: ${checkDeleted?.length || 0}`);

  console.log('\n=== 3. CADASTRANDO AS 10 NOVAS CAMISETAS NO SUPABASE ===');
  for (const item of NEW_10_CAMISETAS) {
    const productPayload = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: '',
      description: item.description,
      price: 189.90,
      promo_price: null,
      category: 'camisetas',
      subcategory: 'Camisetas',
      collection: 'Coleção Marmot Atelier',
      tags: ['Camiseta', 'Streetwear', 'Heavyweight'],
      rating: 5.0,
      review_count: 0,
      stock_count: 30,
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
          color: 'offwhite',
          colorName: 'Off White',
          colorHex: '#F5F5F0',
          image: item.image,
          featuredImage: item.image,
          images: [item.image]
        }
      ],
      image: item.image,
      images: [item.image],
      details: [
        'Modelagem exclusiva Marmot',
        'Gola canelada 3cm 2x1',
        'Algodão 260g/m² penteado'
      ],
      care_instructions: [
        'Lavar do avesso em água fria',
        'Não usar secadora rotativa',
        'Secar à sombra'
      ],
      composition: [
        '100% Algodão Penteado Heavyweight'
      ],
      weight: 0.35,
      height: 4,
      width: 25,
      length: 30,
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
        price: 189.90,
        category: 'camisetas',
        subcategory: 'Camisetas',
        collection: 'Coleção Marmot Atelier',
        tags: ['Camiseta', 'Streetwear', 'Heavyweight'],
        rating: 5.0,
        reviewCount: 0,
        stockCount: 30,
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
            color: 'offwhite',
            colorName: 'Off White',
            colorHex: '#F5F5F0',
            image: item.image,
            featuredImage: item.image,
            images: [item.image]
          }
        ],
        image: item.image,
        images: [item.image],
        details: [
          'Modelagem exclusiva Marmot',
          'Gola canelada 3cm 2x1',
          'Algodão 260g/m² penteado'
        ],
        careInstructions: [
          'Lavar do avesso em água fria',
          'Não usar secadora rotativa',
          'Secar à sombra'
        ],
        composition: [
          '100% Algodão Penteado Heavyweight'
        ],
        reviews: [],
        weight: 0.35,
        height: 4,
        width: 25,
        length: 30,
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
      console.log(`   ✓ [${item.num}/10] Cadastrada: ${item.title} (ID: ${inserted.id})`);
    }
  }

  console.log('\n=== 4. AUDITORIA FINAL DE PERSISTÊNCIA NO BANCO DE DADOS ===');
  const { data: finalAll } = await adminSb.from('products').select('*').order('created_at', { ascending: true });
  const finalCamisetas = finalAll.filter(p => p.category?.toLowerCase() === 'camisetas' || p.category?.toLowerCase() === 'camiseta');

  console.log(`\n==================================================================`);
  console.log(`TOTAL DE PRODUTOS NA CATEGORIA CAMISETAS NO BANCO: ${finalCamisetas.length}`);
  console.log(`==================================================================\n`);

  finalCamisetas.forEach((c, idx) => {
    console.log(`${idx + 1}. NOME: ${c.title}`);
    console.log(`   ID: ${c.id} | SLUG: ${c.slug} | CATEGORIA: ${c.category}`);
    console.log(`   DESCRIÇÃO REGISTRADA:`);
    console.log(`   ${c.description.split('\n').join('\n   ')}`);
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
