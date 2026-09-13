import { ProductVariant } from '../types';

export interface JaquetaImageMapping {
  id: string;
  slug: string;
  title: string;
  defaultImage: string;
  images: string[];
  colors: ProductVariant[];
}

export const JAQUETA_IMAGE_MAPPINGS: Record<string, JaquetaImageMapping> = {
  "prod-jaq-001": {
      "id": "prod-jaq-001",
      "slug": "jaqueta-anorak",
      "title": "Jaqueta Anorak",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png"
      ],
      "colors": [
          {
              "color": "verde-militar",
              "colorName": "Verde Militar",
              "colorHex": "#4B5320",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png"
              ]
          }
      ]
  },
  "jaqueta-anorak": {
      "id": "prod-jaq-001",
      "slug": "jaqueta-anorak",
      "title": "Jaqueta Anorak",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png"
      ],
      "colors": [
          {
              "color": "verde-militar",
              "colorName": "Verde Militar",
              "colorHex": "#4B5320",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png"
              ]
          }
      ]
  },
  "prod-jaq-002": {
      "id": "prod-jaq-002",
      "slug": "jaqueta-bomber-oversized",
      "title": "Jaqueta Bomber Oversized",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png"
      ],
      "colors": [
          {
              "color": "verde",
              "colorName": "Verde",
              "colorHex": "#50633F",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png"
              ]
          }
      ]
  },
  "jaqueta-bomber-oversized": {
      "id": "prod-jaq-002",
      "slug": "jaqueta-bomber-oversized",
      "title": "Jaqueta Bomber Oversized",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png"
      ],
      "colors": [
          {
              "color": "verde",
              "colorName": "Verde",
              "colorHex": "#50633F",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png"
              ]
          }
      ]
  },
  "prod-jaq-003": {
      "id": "prod-jaq-003",
      "slug": "jaqueta-cargo",
      "title": "Jaqueta Cargo",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png"
      ],
      "colors": [
          {
              "color": "bege",
              "colorName": "Bege",
              "colorHex": "#C8B596",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png"
              ]
          }
      ]
  },
  "jaqueta-cargo": {
      "id": "prod-jaq-003",
      "slug": "jaqueta-cargo",
      "title": "Jaqueta Cargo",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png"
      ],
      "colors": [
          {
              "color": "bege",
              "colorName": "Bege",
              "colorHex": "#C8B596",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png"
              ]
          }
      ]
  },
  "prod-jaq-004": {
      "id": "prod-jaq-004",
      "slug": "jaqueta-coach",
      "title": "Jaqueta Coach",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png"
      ],
      "colors": [
          {
              "color": "verde",
              "colorName": "Verde",
              "colorHex": "#50633F",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png"
              ]
          }
      ]
  },
  "jaqueta-coach": {
      "id": "prod-jaq-004",
      "slug": "jaqueta-coach",
      "title": "Jaqueta Coach",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png"
      ],
      "colors": [
          {
              "color": "verde",
              "colorName": "Verde",
              "colorHex": "#50633F",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/verde/01-a9935eb050035815.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-coach/preto/01-233b4f49bda08d23.png"
              ]
          }
      ]
  },
  "prod-jaq-005": {
      "id": "prod-jaq-005",
      "slug": "jaqueta-cropped-puffer",
      "title": "Jaqueta Cropped Puffer",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png"
              ]
          }
      ]
  },
  "jaqueta-cropped-puffer": {
      "id": "prod-jaq-005",
      "slug": "jaqueta-cropped-puffer",
      "title": "Jaqueta Cropped Puffer",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/marrom/01-ea52f026e451f790.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cropped-puffer/preto/01-78353baa563950a4.png"
              ]
          }
      ]
  },
  "prod-jaq-006": {
      "id": "prod-jaq-006",
      "slug": "jaqueta-denim-distressed",
      "title": "Jaqueta Denim Distressed",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png"
      ],
      "colors": [
          {
              "color": "azul",
              "colorName": "Azul",
              "colorHex": "#355C8A",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png"
              ]
          }
      ]
  },
  "jaqueta-denim-distressed": {
      "id": "prod-jaq-006",
      "slug": "jaqueta-denim-distressed",
      "title": "Jaqueta Denim Distressed",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png"
      ],
      "colors": [
          {
              "color": "azul",
              "colorName": "Azul",
              "colorHex": "#355C8A",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/azul/01-2a414e3604e28347.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-distressed/preto/01-bfcea5c0534d68b4.png"
              ]
          }
      ]
  },
  "prod-jaq-007": {
      "id": "prod-jaq-007",
      "slug": "jaqueta-denim-washed",
      "title": "Jaqueta Denim Washed",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png"
      ],
      "colors": [
          {
              "color": "azul",
              "colorName": "Azul",
              "colorHex": "#355C8A",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png"
              ]
          }
      ]
  },
  "jaqueta-denim-washed": {
      "id": "prod-jaq-007",
      "slug": "jaqueta-denim-washed",
      "title": "Jaqueta Denim Washed",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png"
      ],
      "colors": [
          {
              "color": "azul",
              "colorName": "Azul",
              "colorHex": "#355C8A",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/azul/01-da3d1ece9bd6ebb4.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-denim-washed/preto/01-cd951165a4dcab4a.png"
              ]
          }
      ]
  },
  "prod-jaq-008": {
      "id": "prod-jaq-008",
      "slug": "jaqueta-harrington",
      "title": "Jaqueta Harrington",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png"
      ],
      "colors": [
          {
              "color": "bege",
              "colorName": "Bege",
              "colorHex": "#C8B596",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png"
              ]
          }
      ]
  },
  "jaqueta-harrington": {
      "id": "prod-jaq-008",
      "slug": "jaqueta-harrington",
      "title": "Jaqueta Harrington",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png"
      ],
      "colors": [
          {
              "color": "bege",
              "colorName": "Bege",
              "colorHex": "#C8B596",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/bege/01-4322036384868fa3.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-harrington/preto/01-35606ba52631fc85.png"
              ]
          }
      ]
  },
  "prod-jaq-009": {
      "id": "prod-jaq-009",
      "slug": "jaqueta-nylon-tech",
      "title": "Jaqueta Nylon Tech",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png"
      ],
      "colors": [
          {
              "color": "cinza",
              "colorName": "Cinza",
              "colorHex": "#7A7D80",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png"
              ]
          }
      ]
  },
  "jaqueta-nylon-tech": {
      "id": "prod-jaq-009",
      "slug": "jaqueta-nylon-tech",
      "title": "Jaqueta Nylon Tech",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png"
      ],
      "colors": [
          {
              "color": "cinza",
              "colorName": "Cinza",
              "colorHex": "#7A7D80",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/cinza/01-4387f2e59c23e344.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-nylon-tech/preto/01-2ac20cbe6d3b8ee2.png"
              ]
          }
      ]
  },
  "prod-jaq-010": {
      "id": "prod-jaq-010",
      "slug": "jaqueta-panel-construction",
      "title": "Jaqueta Panel Construction",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png"
      ],
      "colors": [
          {
              "color": "bege-e-marrom",
              "colorName": "Bege e Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png"
              ]
          },
          {
              "color": "bege-preto",
              "colorName": "Bege Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png"
              ]
          }
      ]
  },
  "jaqueta-panel-construction": {
      "id": "prod-jaq-010",
      "slug": "jaqueta-panel-construction",
      "title": "Jaqueta Panel Construction",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png"
      ],
      "colors": [
          {
              "color": "bege-e-marrom",
              "colorName": "Bege e Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-e-marrom/01-22713cf326cab21f.png"
              ]
          },
          {
              "color": "bege-preto",
              "colorName": "Bege Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-panel-construction/bege-preto/01-5a9036750c800d3f.png"
              ]
          }
      ]
  },
  "prod-jaq-011": {
      "id": "prod-jaq-011",
      "slug": "jaqueta-puffer-oversized",
      "title": "Jaqueta Puffer Oversized",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png"
      ],
      "colors": [
          {
              "color": "cinza",
              "colorName": "Cinza",
              "colorHex": "#7A7D80",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png"
              ]
          }
      ]
  },
  "jaqueta-puffer-oversized": {
      "id": "prod-jaq-011",
      "slug": "jaqueta-puffer-oversized",
      "title": "Jaqueta Puffer Oversized",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png"
      ],
      "colors": [
          {
              "color": "cinza",
              "colorName": "Cinza",
              "colorHex": "#7A7D80",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/cinza/01-2734fd6dc9cfdf24.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-puffer-oversized/preto/01-b8ad35db071bf2bd.png"
              ]
          }
      ]
  },
  "prod-jaq-012": {
      "id": "prod-jaq-012",
      "slug": "jaqueta-sherpa",
      "title": "Jaqueta Sherpa",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png"
      ],
      "colors": [
          {
              "color": "marrom-e-bege",
              "colorName": "Marrom e Bege",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png"
              ]
          }
      ]
  },
  "jaqueta-sherpa": {
      "id": "prod-jaq-012",
      "slug": "jaqueta-sherpa",
      "title": "Jaqueta Sherpa",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png"
      ],
      "colors": [
          {
              "color": "marrom-e-bege",
              "colorName": "Marrom e Bege",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/marrom-e-bege/01-6d11d791e7693344.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-sherpa/preto/01-90b346571c0bc5ad.png"
              ]
          }
      ]
  },
  "prod-jaq-013": {
      "id": "prod-jaq-013",
      "slug": "jaqueta-tactical",
      "title": "Jaqueta Tactical",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png"
      ],
      "colors": [
          {
              "color": "chumbo",
              "colorName": "Chumbo",
              "colorHex": "#4A4E52",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png"
              ]
          }
      ]
  },
  "jaqueta-tactical": {
      "id": "prod-jaq-013",
      "slug": "jaqueta-tactical",
      "title": "Jaqueta Tactical",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png"
      ],
      "colors": [
          {
              "color": "chumbo",
              "colorName": "Chumbo",
              "colorHex": "#4A4E52",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/chumbo/01-737b7dfc4c0dc75b.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-tactical/preto/01-7b9515429e813139.png"
              ]
          }
      ]
  },
  "prod-jaq-014": {
      "id": "prod-jaq-014",
      "slug": "jaqueta-track",
      "title": "Jaqueta Track",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png"
              ]
          }
      ]
  },
  "jaqueta-track": {
      "id": "prod-jaq-014",
      "slug": "jaqueta-track",
      "title": "Jaqueta Track",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/marrom/01-2a051d5f904637e3.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-track/preto/01-347493164172e0cf.png"
              ]
          }
      ]
  },
  "prod-jaq-015": {
      "id": "prod-jaq-015",
      "slug": "jaqueta-two-tone",
      "title": "Jaqueta Two Tone",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png"
              ]
          }
      ]
  },
  "jaqueta-two-tone": {
      "id": "prod-jaq-015",
      "slug": "jaqueta-two-tone",
      "title": "Jaqueta Two Tone",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/marrom/01-71d622c5a6aad293.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-two-tone/preto/01-1769f2333387a08e.png"
              ]
          }
      ]
  },
  "prod-jaq-016": {
      "id": "prod-jaq-016",
      "slug": "jaqueta-utility",
      "title": "Jaqueta Utility",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png"
      ],
      "colors": [
          {
              "color": "verde",
              "colorName": "Verde",
              "colorHex": "#50633F",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png"
              ]
          }
      ]
  },
  "jaqueta-utility": {
      "id": "prod-jaq-016",
      "slug": "jaqueta-utility",
      "title": "Jaqueta Utility",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png"
      ],
      "colors": [
          {
              "color": "verde",
              "colorName": "Verde",
              "colorHex": "#50633F",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png"
              ]
          }
      ]
  },
  "prod-jaq-017": {
      "id": "prod-jaq-017",
      "slug": "jaqueta-varsity-oversized",
      "title": "Jaqueta Varsity Oversized",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png"
              ]
          }
      ]
  },
  "jaqueta-varsity-oversized": {
      "id": "prod-jaq-017",
      "slug": "jaqueta-varsity-oversized",
      "title": "Jaqueta Varsity Oversized",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png"
              ]
          }
      ]
  },
  "prod-jaq-018": {
      "id": "prod-jaq-018",
      "slug": "jaqueta-windbreaker",
      "title": "Jaqueta Windbreaker",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png"
      ],
      "colors": [
          {
              "color": "grafite-e-verde",
              "colorName": "Grafite e Verde",
              "colorHex": "#4B4F52",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png"
              ]
          }
      ]
  },
  "jaqueta-windbreaker": {
      "id": "prod-jaq-018",
      "slug": "jaqueta-windbreaker",
      "title": "Jaqueta Windbreaker",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png"
      ],
      "colors": [
          {
              "color": "grafite-e-verde",
              "colorName": "Grafite e Verde",
              "colorHex": "#4B4F52",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/grafite-e-verde/01-6c223d3b9ad7f151.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-windbreaker/preto/01-ec97a2e01b5f0a10.png"
              ]
          }
      ]
  },
  "prod-jaq-019": {
      "id": "prod-jaq-019",
      "slug": "jaqueta-workwear",
      "title": "Jaqueta Workwear",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png"
              ]
          }
      ]
  },
  "jaqueta-workwear": {
      "id": "prod-jaq-019",
      "slug": "jaqueta-workwear",
      "title": "Jaqueta Workwear",
      "defaultImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
      "images": [
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
          "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png"
      ],
      "colors": [
          {
              "color": "marrom",
              "colorName": "Marrom",
              "colorHex": "#6F513D",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png"
              ]
          },
          {
              "color": "preto",
              "colorName": "Preto",
              "colorHex": "#171717",
              "image": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png",
              "featuredImage": "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png",
              "images": [
                  "https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/preto/01-37b86246eeaeddee.png"
              ]
          }
      ]
  },
};

export function getJaquetaImageMapping(productIdOrSlug: string): JaquetaImageMapping | undefined {
  if (!productIdOrSlug) return undefined;
  const clean = productIdOrSlug.toLowerCase().trim();
  return JAQUETA_IMAGE_MAPPINGS[clean];
}

/**
 * Overrides jacket properties to ensure the authoritative non-black cover
 * and color order are guaranteed regardless of remote database state.
 */
export function applyJaquetaMapping<T extends { id?: string; slug?: string; image?: string; images?: string[]; colors?: any[] }>(prod: T): T {
  if (!prod) return prod;
  const mapping = getJaquetaImageMapping(String(prod.id || "")) || getJaquetaImageMapping(String(prod.slug || ""));
  if (!mapping) return prod;
  return {
    ...prod,
    image: mapping.defaultImage,
    images: mapping.images,
    colors: mapping.colors
  };
}
