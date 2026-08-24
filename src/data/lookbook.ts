export interface LookbookHotspot {
  id: string;
  productId: string;
  topPercent: number; // Y position 0 to 100
  leftPercent: number; // X position 0 to 100
}

export interface LookbookLook {
  id: string;
  title: string;
  collection: string;
  image: string;
  hotspots: LookbookHotspot[];
}

export const LOOKBOOK_LOOKS: LookbookLook[] = [
  {
    id: 'look-1',
    title: 'Look #01: Cyber Dystopia Fit',
    collection: 'Vol. 04: Cyber Dystopia',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
    hotspots: [
      { id: 'hs-1', productId: 'prod-cam-004', topPercent: 32, leftPercent: 52 },
      { id: 'hs-2', productId: 'prod-cam-008', topPercent: 68, leftPercent: 48 },
      { id: 'hs-3', productId: 'prod-mol-001', topPercent: 90, leftPercent: 54 },
    ],
  },
  {
    id: 'look-2',
    title: 'Look #02: Underground Utility',
    collection: 'Core Archive',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=80',
    hotspots: [
      { id: 'hs-4', productId: 'prod-cam-006', topPercent: 35, leftPercent: 45 },
      { id: 'hs-5', productId: 'prod-cam-009', topPercent: 72, leftPercent: 50 },
      { id: 'hs-6', productId: 'prod-cam-001', topPercent: 12, leftPercent: 48 },
    ],
  },
];
