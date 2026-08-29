import { OrderStatus, ShippingDeliveryStatus } from '../types';

export type InternalShippingState =
  | 'payment_pending'
  | 'paid'
  | 'separation'
  | 'ready_for_shipping'
  | 'posted'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'awaiting_pickup'
  | 'delivery_attempt'
  | 'shipping_problem'
  | 'returning_to_sender'
  | 'returned'
  | 'cancelled'
  | 'refunded'
  | 'unknown';

export interface NormalizedShippingEvent {
  internalState: InternalShippingState;
  orderStatus: OrderStatus;
  shippingStatus: ShippingDeliveryStatus;
  label: string;
  description: string;
  rank: number;
  isTerminal: boolean;
  isException: boolean;
}

// Numerical progression ranking for normal forward lifecycle
export const ORDER_STATUS_RANKS: Record<string, number> = {
  'Aguardando Pagamento': 10,
  'Pagamento Pendente': 10,
  'Pagamento Aprovado': 20,
  'Pedido Confirmado': 20,
  'Em Separação': 30,
  'Preparando Envio': 30,
  'Pronto para Envio': 40,
  'Postado': 50,
  'Despachado': 50,
  'Em Transporte': 60,
  'Em trânsito': 60,
  'Saiu para entrega': 70,
  'Entregue': 80,
  // Exceptions
  'Problema no envio': 45,
  'Problema na entrega': 65,
  'Aguardando retirada': 65,
  'Devolvendo ao remetente': 75,
  'Devolução Solicitada': 85,
  'Devolvido': 90,
  'Pagamento Recusado': 5,
  'Cancelado': 95,
  'Reembolsado': 96,
};

/**
 * Normalizes any carrier / tracking status or description string into our strict internal status.
 */
export function normalizeCarrierStatus(statusOrDescription: string): NormalizedShippingEvent {
  const raw = String(statusOrDescription || '').trim().toLowerCase();

  // 1. DELIVERED / ENTREGUE (Terminal Success)
  if (
    raw === 'delivered' ||
    raw === 'entregue' ||
    raw.includes('objeto entregue') ||
    raw.includes('entrega realizada') ||
    raw.includes('entregue ao destinatário') ||
    raw.includes('concluido') ||
    raw.includes('concluído')
  ) {
    return {
      internalState: 'delivered',
      orderStatus: 'Entregue',
      shippingStatus: 'Entregue',
      label: 'Entregue',
      description: 'Objeto entregue ao destinatário com sucesso.',
      rank: 80,
      isTerminal: true,
      isException: false,
    };
  }

  // 2. OUT FOR DELIVERY / SAIU PARA ENTREGA (Pre-delivery milestone - NOT delivered!)
  if (
    raw === 'out_for_delivery' ||
    raw === 'delivery_route' ||
    raw.includes('saiu para entrega') ||
    raw.includes('saiu para entrega ao destinatário') ||
    raw.includes('em rota de entrega')
  ) {
    return {
      internalState: 'out_for_delivery',
      orderStatus: 'Saiu para entrega',
      shippingStatus: 'Saiu para entrega',
      label: 'Saiu para Entrega',
      description: 'Objeto saiu para entrega ao destinatário.',
      rank: 70,
      isTerminal: false,
      isException: false,
    };
  }

  // 3. RETURNING / RETURNED (Exceptions)
  if (
    raw === 'returning_to_sender' ||
    raw === 'returned' ||
    raw.includes('devolvido ao remetente') ||
    raw.includes('devolucao ao remetente') ||
    raw.includes('devolução ao remetente') ||
    raw.includes('retornando ao remetente') ||
    raw.includes('devolvido')
  ) {
    return {
      internalState: 'returning_to_sender',
      orderStatus: 'Devolvido',
      shippingStatus: 'Problema na entrega',
      label: 'Devolvendo ao Remetente',
      description: 'Objeto em processo de devolução ao remetente.',
      rank: 75,
      isTerminal: false,
      isException: true,
    };
  }

  // 4. AWAITING PICKUP (Exception)
  if (
    raw === 'awaiting_pickup' ||
    raw === 'waiting_for_pickup' ||
    raw.includes('aguardando retirada') ||
    raw.includes('disponivel para retirada') ||
    raw.includes('disponível para retirada') ||
    raw.includes('retirada na agencia') ||
    raw.includes('retirada na agência')
  ) {
    return {
      internalState: 'awaiting_pickup',
      orderStatus: 'Em Transporte',
      shippingStatus: 'Problema na entrega',
      label: 'Aguardando Retirada',
      description: 'Objeto disponível para retirada na agência da transportadora.',
      rank: 65,
      isTerminal: false,
      isException: true,
    };
  }

  // 5. DELIVERY ATTEMPT / SHIPPING PROBLEM (Exceptions)
  if (
    raw === 'delivery_attempt' ||
    raw === 'shipping_exception' ||
    raw.includes('destinatário ausente') ||
    raw.includes('destinatario ausente') ||
    raw.includes('tentativa de entrega') ||
    raw.includes('endereco incorreto') ||
    raw.includes('endereço incorreto') ||
    raw.includes('extravio') ||
    raw.includes('avaria') ||
    raw.includes('objeto com atraso')
  ) {
    return {
      internalState: 'delivery_attempt',
      orderStatus: 'Em Transporte',
      shippingStatus: 'Problema na entrega',
      label: 'Problema na Entrega',
      description: 'Tentativa de entrega não concluída. Nova tentativa será realizada.',
      rank: 65,
      isTerminal: false,
      isException: true,
    };
  }

  // 6. IN TRANSIT / EM TRANSPORTE
  if (
    raw === 'in_transit' ||
    raw === 'transit' ||
    raw === 'moving' ||
    raw === 'forwarded' ||
    raw === 'departed' ||
    raw === 'arrived_at_facility' ||
    raw.includes('em transito') ||
    raw.includes('em trânsito') ||
    raw.includes('objeto em transferência') ||
    raw.includes('em transferencia') ||
    raw.includes('em transferência') ||
    raw.includes('objeto encaminhado') ||
    raw.includes('encaminhado') ||
    raw.includes('transferido')
  ) {
    return {
      internalState: 'in_transit',
      orderStatus: 'Em Transporte',
      shippingStatus: 'Em trânsito',
      label: 'Em Trânsito',
      description: 'Objeto em transferência entre unidades da transportadora.',
      rank: 60,
      isTerminal: false,
      isException: false,
    };
  }

  // 7. POSTED / COLETADO / OBJETO POSTADO
  if (
    raw === 'posted' ||
    raw === 'collected' ||
    raw === 'picked_up' ||
    raw === 'accepted' ||
    raw === 'received_by_carrier' ||
    raw === 'shipped' ||
    raw.includes('objeto postado') ||
    raw.includes('coletado') ||
    raw.includes('recebido na unidade de postagem') ||
    raw.includes('recebido pela transportadora') ||
    raw.includes('postado')
  ) {
    return {
      internalState: 'posted',
      orderStatus: 'Postado',
      shippingStatus: 'Postado',
      label: 'Postado',
      description: 'Objeto postado e recebido na agência da transportadora.',
      rank: 50,
      isTerminal: false,
      isException: false,
    };
  }

  // 8. READY FOR SHIPPING / ETIQUETA GERADA
  if (
    raw === 'ready_for_shipping' ||
    raw === 'label_generated' ||
    raw.includes('etiqueta gerada') ||
    raw.includes('pronto para envio') ||
    raw.includes('envio criado')
  ) {
    return {
      internalState: 'ready_for_shipping',
      orderStatus: 'Pronto para Envio',
      shippingStatus: 'Pronto para envio',
      label: 'Pronto para Envio',
      description: 'Etiqueta de envio gerada. Aguardando coleta da transportadora.',
      rank: 40,
      isTerminal: false,
      isException: false,
    };
  }

  // 9. SEPARATION / EM SEPARAÇÃO
  if (
    raw === 'separation' ||
    raw === 'preparing' ||
    raw.includes('separação') ||
    raw.includes('separacao') ||
    raw.includes('preparando')
  ) {
    return {
      internalState: 'separation',
      orderStatus: 'Em Separação',
      shippingStatus: 'Preparando',
      label: 'Em Separação',
      description: 'Pagamento confirmado. Peças em separação e conferência.',
      rank: 30,
      isTerminal: false,
      isException: false,
    };
  }

  // 10. PAID / PAGAMENTO APROVADO
  if (raw === 'paid' || raw === 'approved' || raw.includes('aprovado')) {
    return {
      internalState: 'paid',
      orderStatus: 'Pagamento Aprovado',
      shippingStatus: 'Aguardando preparação',
      label: 'Pagamento Aprovado',
      description: 'Pagamento confirmado com sucesso.',
      rank: 20,
      isTerminal: false,
      isException: false,
    };
  }

  // Fallback / Unknown
  return {
    internalState: 'unknown',
    orderStatus: 'Em Transporte',
    shippingStatus: 'Em trânsito',
    label: 'Atualização de Rastreio',
    description: statusOrDescription || 'Evento de movimentação registrado.',
    rank: 55,
    isTerminal: false,
    isException: false,
  };
}

/**
 * Validates whether a state transition from `currentStatus` to `newStatus` is legitimate.
 * Prevents regressions caused by delayed or out-of-order webhooks.
 * E.g., Once an order is 'Entregue' (rank 80), a delayed 'Postado' (rank 50) MUST NOT revert the order!
 */
export function canTransitionOrderStatus(currentStatus: OrderStatus | string, newStatus: OrderStatus | string): boolean {
  if (currentStatus === newStatus) return false;

  const currentRank = ORDER_STATUS_RANKS[currentStatus] || 0;
  const newRank = ORDER_STATUS_RANKS[newStatus] || 0;

  // 1. Terminal state protection: Entregue is absolute and cannot be reverted
  if (currentStatus === 'Entregue') {
    return false;
  }

  // 2. Cancellation / Refund are terminal or override non-delivered orders
  if (currentStatus === 'Cancelado' || currentStatus === 'Reembolsado') {
    return false;
  }

  // 3. Normal forward progression: newRank must be strictly greater than currentRank
  if (newRank > currentRank) {
    return true;
  }

  // 4. Exception transitions (e.g. Devolvido or Cancelado applied after shipping)
  if (newStatus === 'Devolvido' || newStatus === 'Cancelado' || newStatus === 'Problema no envio' || newStatus === 'Problema na entrega') {
    return true;
  }

  return false;
}
