-- Canonical accessories catalog generated from the 2026-09-18 accessory image set.
-- Production data is stored in public.categories/public.products and images live in product-images Storage.

BEGIN;

INSERT INTO public.categories (
  id, slug, name, tagline, description, image, subcategories,
  product_count, "order", sort_order, active, data, created_at, updated_at
)
VALUES (
  'acessorios',
  'acessorios',
  'Acessórios',
  'Headwear, Bags & Detalhes Urbanos',
  'Bonés, gorros, shoulder bags, cintos, carteiras, óculos e correntes para completar o visual streetwear.',
  '/categories/categoria-acessorios.png?v=20260918_acessorios_reais',
  '["Bonés & Gorros","Shoulder Bags","Cintos & Carteiras","Óculos & Correntes"]'::jsonb,
  10, 7, 7, true, NULL, now(), now()
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  subcategories = EXCLUDED.subcategories,
  product_count = EXCLUDED.product_count,
  "order" = EXCLUDED."order",
  sort_order = EXCLUDED.sort_order,
  active = true,
  data = NULL,
  updated_at = now();

WITH accessory_rows (
  id, slug, title, subtitle, description, price, sku, image_file,
  color_key, color_name, color_hex, details
) AS (
  VALUES
    ('prod-acs-001','bone-trucker-preto','Boné Trucker Preto','Boné trucker streetwear','Boné Trucker Preto com visual streetwear versátil e ajuste regulável.',149.90,'MM-ACS-001','bone-trucker-preto.webp','black','Preto','#121212','["Boné trucker","Cor preta","Ajuste regulável","Estética streetwear"]'::jsonb),
    ('prod-acs-002','bone-5-panel-verde-preto','Boné 5 Panel Verde Preto','Boné 5 panel bicolor','Boné 5 Panel Verde Preto com perfil urbano e combinação bicolor.',149.90,'MM-ACS-002','bone-5-panel-verde-preto.webp','green_black','Verde + Preto','#4E5742','["Construção 5 panel","Verde e preto","Ajuste regulável","Visual urbano"]'::jsonb),
    ('prod-acs-003','gorro-beanie-preto','Gorro Beanie Preto','Beanie streetwear','Gorro Beanie Preto de visual minimalista para composições streetwear.',129.90,'MM-ACS-003','gorro-beanie-preto.webp','black','Preto','#121212','["Gorro beanie","Cor preta","Visual minimalista","Estética streetwear"]'::jsonb),
    ('prod-acs-004','bucket-hat-bicolor-bege-preto','Bucket Hat Bicolor Bege Preto','Bucket hat bicolor','Bucket Hat Bicolor Bege Preto com visual urbano e contraste marcante.',159.90,'MM-ACS-004','bucket-hat-bicolor-bege-preto.webp','beige_black','Bege + Preto','#D5C4A1','["Bucket hat","Bege e preto","Aba circular","Visual streetwear"]'::jsonb),
    ('prod-acs-005','shoulder-bag-vertical-preta','Shoulder Bag Vertical Preta','Bolsa transversal vertical','Shoulder Bag Vertical Preta em formato compacto, ideal para uso urbano.',189.90,'MM-ACS-005','shoulder-bag-vertical-preta.webp','black','Preto','#121212','["Formato vertical","Cor preta","Alça transversal","Uso urbano"]'::jsonb),
    ('prod-acs-006','shoulder-bag-utility-preta','Shoulder Bag Utility Preta','Shoulder bag utilitária','Shoulder Bag Utility Preta com proposta funcional e estética streetwear.',219.90,'MM-ACS-006','shoulder-bag-utility-preta.webp','black','Preto','#121212','["Shoulder bag","Cor preta","Proposta utilitária","Estética streetwear"]'::jsonb),
    ('prod-acs-008','cinto-tatico-preto','Cinto Tático Preto','Cinto utilitário','Cinto Tático Preto com visual utilitário e ajuste regulável.',129.90,'MM-ACS-008','cinto-tatico-preto.webp','black','Preto','#121212','["Cinto tático","Cor preta","Ajuste regulável","Visual utilitário"]'::jsonb),
    ('prod-acs-010','carteira-com-ziper-preta','Carteira Com Zíper Preta','Carteira compacta com zíper','Carteira Com Zíper Preta em formato compacto para o uso diário.',149.90,'MM-ACS-010','carteira-com-ziper-preta.webp','black','Preto','#121212','["Carteira compacta","Cor preta","Fechamento com zíper","Uso diário"]'::jsonb),
    ('prod-acs-012','oculos-retangular-preto','Óculos Retangular Preto','Óculos de linhas retas','Óculos Retangular Preto com linhas retas e estética streetwear contemporânea.',219.90,'MM-ACS-012','oculos-retangular-preto.webp','black','Preto','#121212','["Formato retangular","Cor preta","Linhas retas","Visual streetwear"]'::jsonb),
    ('prod-acs-013','corrente-cuban-link-prateada','Corrente Cuban Link Prateada','Corrente estilo Cuban Link','Corrente Cuban Link Prateada com elos marcantes para composições streetwear.',169.90,'MM-ACS-013','corrente-cuban-link-prateada.webp','silver','Prateado','#C5CCD6','["Estilo Cuban Link","Cor prateada","Elos marcantes","Visual streetwear"]'::jsonb)
), normalized AS (
  SELECT
    a.*,
    'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/acessorios/' || a.image_file AS image_url
  FROM accessory_rows a
)
INSERT INTO public.products (
  id, slug, title, subtitle, description, price, promo_price, category, subcategory,
  collection, tags, rating, review_count, stock_count, sku, sizes, colors, image, images,
  details, care_instructions, composition, weight, height, width, length,
  is_new_release, is_best_seller, featured, status, data, created_at, updated_at
)
SELECT
  id, slug, title, subtitle, description, price, NULL, 'acessorios', 'Acessórios',
  'Coleção Marmot Accessories 2026', '["Acessórios","Streetwear"]'::jsonb,
  5.0, 0, 25, sku, '["Único"]'::jsonb,
  jsonb_build_array(jsonb_build_object(
    'color', color_key,
    'colorName', color_name,
    'colorHex', color_hex,
    'image', image_url,
    'featuredImage', image_url,
    'images', jsonb_build_array(image_url)
  )),
  image_url, jsonb_build_array(image_url), details,
  '["Limpar conforme a necessidade e armazenar em local seco."]'::jsonb,
  '[]'::jsonb, 0.3, 8, 18, 22,
  false, false, false, 'active', NULL, now(), now()
FROM normalized
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  promo_price = NULL,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  collection = EXCLUDED.collection,
  tags = EXCLUDED.tags,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  sku = EXCLUDED.sku,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  image = EXCLUDED.image,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  care_instructions = EXCLUDED.care_instructions,
  composition = EXCLUDED.composition,
  is_new_release = false,
  is_best_seller = false,
  featured = false,
  status = 'active',
  data = NULL,
  updated_at = now();

DELETE FROM public.products
WHERE id IN ('prod-acs-007','prod-acs-009','prod-acs-011','prod-acs-014','prod-acs-015');

COMMIT;
