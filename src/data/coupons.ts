import { Coupon } from '../types';

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'MARMOT10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 150,
    description: '10% OFF no seu primeiro pedido acima de R$ 150',
  },
  {
    code: 'FIRSTMARMOT',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 150,
    description: '10% OFF no primeiro pedido',
  },
  {
    code: 'VIPAURA',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 250,
    description: '15% OFF para membros da comunidade',
  },
  {
    code: 'STREET20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 400,
    description: '20% OFF em compras acima de R$ 400',
  },
  {
    code: 'VIPMARMOT',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 250,
    description: '15% OFF para membros da comunidade Marmot',
  },
  {
    code: 'FRETEGRATIS',
    discountType: 'fixed',
    discountValue: 30, // discounts shipping fee up to R$30
    minOrderValue: 200,
    description: 'Frete Grátis para todo o Brasil em compras acima de R$ 200',
  },
];

export const VALID_COUPONS = INITIAL_COUPONS;
