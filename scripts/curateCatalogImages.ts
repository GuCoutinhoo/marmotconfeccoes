import * as fs from 'fs';
import * as path from 'path';
import { CATALOG_90_PRODUCTS_PART1 } from '../src/data/catalog90ProductsPart1';
import { CATALOG_90_PRODUCTS_PART2 } from '../src/data/catalog90ProductsPart2';
import { CATALOG_90_PRODUCTS_PART3 } from '../src/data/catalog90ProductsPart3';
import { Product } from '../src/types';

// Curated verified high-resolution fashion photography for every item
const IMAGE_REGISTRY: Record<string, { [colorKey: string]: { main: string; gallery: string[] } }> = {
  // CAMISETAS
  'prod-001': { // Camiseta Oversized
    'black': {
      main: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80']
    },
    'grey': {
      main: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-002': { // Camiseta Heavy
    'black': {
      main: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80']
    },
    'marrom-cacau': {
      main: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-003': { // Camiseta Boxy
    'black': {
      main: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80']
    },
    'white': {
      main: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1000&q=80']
    },
    'chumbo': {
      main: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-004': { // Camiseta Estonada
    'preto-estonado': {
      main: 'https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=80']
    },
    'verde-oliva-vintage': {
      main: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80']
    },
    'terracota': {
      main: 'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1574180045827-681f8a1a9622?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-005': { // Camiseta Graphic
    'black': {
      main: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-006': { // Camiseta Back Print
    'black': {
      main: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-007': { // Camiseta Minimal
    'black': {
      main: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1000&q=80']
    },
    'olive': {
      main: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-008': { // Camiseta Raglan
    'black-grey': {
      main: 'https://images.unsplash.com/photo-1618354691792-d1d42acfd860?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1618354691792-d1d42acfd860?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-009': { // Camiseta Listrada
    'black-white': {
      main: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-010': { // Camiseta Pocket
    'olive': {
      main: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80']
    },
    'black': {
      main: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-011': { // Camiseta Raw
    'chumbo': {
      main: 'https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-012': { // Camiseta Contrast
    'black-white-stitch': {
      main: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-013': { // Camiseta Manga Longa
    'black': {
      main: 'https://images.unsplash.com/photo-1622445268045-3004d8058221?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1622445268045-3004d8058221?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-014': { // Camiseta Tie Dye
    'black-grey': {
      main: 'https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-015': { // Camiseta Gola Alta
    'black': {
      main: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&w=1000&q=80']
    }
  },

  // MOLETONS
  'prod-016': { // Moletom Canguru
    'black': {
      main: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-017': { // Moletom Canguru Heavyweight
    'black': {
      main: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80']
    },
    'brown': {
      main: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-018': { // Moletom Boxy Cut
    'black': {
      main: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-019': { // Moletom Gola Careca / Crewneck
    'grey': {
      main: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80']
    },
    'black': {
      main: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-020': { // Moletom Careca Heavy
    'black': {
      main: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-021': { // Moletom Zíper
    'black': {
      main: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-022': { // Moletom Half Zip
    'black': {
      main: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-023': { // Moletom Estonado
    'grafite': {
      main: 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-024': { // Moletom Graphic
    'black': {
      main: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-025': { // Moletom Back Print
    'black': {
      main: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-026': { // Moletom Minimalista
    'black': {
      main: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-027': { // Moletom Raglan Cut
    'black-grey': {
      main: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-028': { // Moletom Bicolor
    'black-white': {
      main: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-029': { // Moletom Crop
    'black': {
      main: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-030': { // Moletom Termo Sherpa
    'black': {
      main: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80']
    }
  },

  // CALÇAS
  'prod-031': { // Calça Cargo Ripstop
    'black': {
      main: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80']
    },
    'olive': {
      main: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-032': { // Calça Cargo Wide
    'black': {
      main: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-033': { // Calça Cargo Straight
    'black': {
      main: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-034': { // Calça Jogger Streetwear
    'black': {
      main: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-035': { // Calça Jogger Cargo
    'black': {
      main: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-036': { // Calça Wide Leg Sarja
    'black': {
      main: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-037': { // Calça Reta Alfaiataria
    'black': {
      main: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-038': { // Calça Jeans Baggy
    'blue-denim': {
      main: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-039': { // Calça Jeans Reta
    'blue-raw': {
      main: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-040': { // Calça Jeans Carpenter
    'blue-washed': {
      main: 'https://images.unsplash.com/photo-1542272604-780c96856566?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1542272604-780c96856566?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-041': { // Calça Moletom Oversized
    'black': {
      main: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-042': { // Calça Parachute
    'olive': {
      main: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-043': { // Calça Nylon Trackpants
    'black': {
      main: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-044': { // Calça Utility Techwear
    'chumbo': {
      main: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-045': { // Calça Carpenter Sarja
    'marrom-escuro': {
      main: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1000&q=80']
    }
  },

  // BERMUDAS E SHORTS
  'prod-046': { // Bermuda Cargo
    'black': {
      main: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-047': { // Bermuda Cargo Ripstop
    'black': {
      main: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-048': { // Bermuda Moletom Raw
    'grey': {
      main: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-049': { // Bermuda Moletom Heavy
    'black': {
      main: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-050': { // Bermuda Jeans Baggy / Jorts
    'blue-denim': {
      main: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-051': { // Bermuda Jeans Carpenter
    'blue-washed': {
      main: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-052': { // Bermuda Sarja Chino
    'khaki': {
      main: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-053': { // Bermuda Nylon
    'black': {
      main: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-054': { // Short Praia Streetwear
    'black': {
      main: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-055': { // Short Esportivo Mesh
    'black-white': {
      main: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80']
    }
  },

  // JAQUETAS
  'prod-056': { // Jaqueta Puffer
    'black': {
      main: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-057': { // Jaqueta Puffer Cropped
    'black': {
      main: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-058': { // Jaqueta Jeans Trucker
    'blue-denim': {
      main: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-059': { // Jaqueta Jeans Oversized
    'blue-denim': {
      main: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-060': { // Jaqueta Jeans Washed
    'washed-blue': {
      main: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-061': { // Jaqueta Bomber MA-1
    'black': {
      main: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-062': { // Jaqueta Varsity College
    'black-white': {
      main: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-063': { // Jaqueta Corta-Vento / Windbreaker
    'black': {
      main: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-064': { // Jaqueta Nylon Casual
    'olive': {
      main: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-065': { // Jaqueta Utility Techwear
    'black': {
      main: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-066': { // Jaqueta Cargo Militar
    'olive': {
      main: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-067': { // Jaqueta Workwear Detroit
    'marrom-tabaco': {
      main: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-068': { // Jaqueta Sherpa Teddy
    'bege': {
      main: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-069': { // Jaqueta Harrington
    'black': {
      main: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-070': { // Jaqueta Track Esportiva
    'black-white': {
      main: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80']
    }
  },

  // CAMISAS E SOBREPOSIÇÕES
  'prod-071': { // Camisa Oversized Tricoline
    'black': {
      main: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-072': { // Camisa Xadrez Grunge
    'black-grey-plaid': {
      main: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-073': { // Camisa Flanela Heavy
    'marrom-plaid': {
      main: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-074': { // Camisa Manga Curta Casual
    'black': {
      main: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80']
    },
    'off-white': {
      main: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-075': { // Camisa Resort / Cubana
    'estampada-dark': {
      main: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-076': { // Camisa Linho Streetwear
    'off-white': {
      main: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-077': { // Camisa Sarja Pesada / Over-Shirt
    'olive': {
      main: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-078': { // Camisa Jeans Western
    'blue-denim': {
      main: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-079': { // Camisa Estampada Graphic
    'black-graphic': {
      main: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-080': { // Camisa Polo Streetwear Boxy
    'black': {
      main: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80']
    }
  },

  // REGATAS
  'prod-081': { // Regata Básica Streetwear
    'black': {
      main: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80']
    },
    'white': {
      main: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-082': { // Regata Oversized Drop Armhole
    'black': {
      main: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-083': { // Regata Canelada Ribbed
    'black': {
      main: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-084': { // Regata Cavada
    'black': {
      main: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-085': { // Regata Boxy Fit
    'black': {
      main: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80']
    }
  },

  // ACESSÓRIOS
  'prod-086': { // Boné Dad Hat
    'black': {
      main: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-087': { // Boné Trucker Telinha
    'black-white': {
      main: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-088': { // Bucket Hat Streetwear
    'black': {
      main: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-089': { // Meias Streetwear Cano Alto
    'pack-3': {
      main: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=1000&q=80']
    }
  },
  'prod-090': { // Shoulder Bag Tática
    'black': {
      main: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
      gallery: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80']
    }
  }
};

function updateList(products: Product[]): Product[] {
  return products.map((prod) => {
    const reg = IMAGE_REGISTRY[prod.id];
    if (!reg) return prod;

    const newColors = prod.colors.map((c) => {
      const colorImg = reg[c.color] || Object.values(reg)[0];
      if (!colorImg) return c;

      return {
        ...c,
        image: colorImg.main,
        featuredImage: colorImg.main,
        images: colorImg.gallery
      };
    });

    const firstColor = newColors[0];
    const mainImg = firstColor ? firstColor.image : prod.image;
    const allImages: string[] = [];
    newColors.forEach((c) => {
      if (c.images) {
        c.images.forEach((img) => {
          if (!allImages.includes(img)) allImages.push(img);
        });
      }
    });

    return {
      ...prod,
      colors: newColors,
      image: mainImg,
      images: allImages.length > 0 ? allImages : [mainImg]
    };
  });
}

console.log('Atualizando catálogo de 90 produtos com imagens autênticas...');

const p1 = updateList(CATALOG_90_PRODUCTS_PART1);
const p2 = updateList(CATALOG_90_PRODUCTS_PART2);
const p3 = updateList(CATALOG_90_PRODUCTS_PART3);

const srcDir = path.join(process.cwd(), 'src', 'data');
fs.writeFileSync(
  path.join(srcDir, 'catalog90ProductsPart1.ts'),
  `import { Product } from '../types';\n\nexport const CATALOG_90_PRODUCTS_PART1: Product[] = ${JSON.stringify(p1, null, 2)};\n`,
  'utf-8'
);

fs.writeFileSync(
  path.join(srcDir, 'catalog90ProductsPart2.ts'),
  `import { Product } from '../types';\n\nexport const CATALOG_90_PRODUCTS_PART2: Product[] = ${JSON.stringify(p2, null, 2)};\n`,
  'utf-8'
);

fs.writeFileSync(
  path.join(srcDir, 'catalog90ProductsPart3.ts'),
  `import { Product } from '../types';\n\nexport const CATALOG_90_PRODUCTS_PART3: Product[] = ${JSON.stringify(p3, null, 2)};\n`,
  'utf-8'
);

console.log('✓ Arquivos TypeScript de catálogo atualizados com sucesso!');
