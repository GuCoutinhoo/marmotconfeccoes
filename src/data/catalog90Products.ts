import { Product } from '../types';
import { CATALOG_90_PRODUCTS_PART1 } from './catalog90ProductsPart1';
import { CATALOG_90_PRODUCTS_PART2 } from './catalog90ProductsPart2';
import { CATALOG_90_PRODUCTS_PART3 } from './catalog90ProductsPart3';

export const CATALOG_90_PRODUCTS: Product[] = [
  ...CATALOG_90_PRODUCTS_PART1,
  ...CATALOG_90_PRODUCTS_PART2,
  ...CATALOG_90_PRODUCTS_PART3
];
