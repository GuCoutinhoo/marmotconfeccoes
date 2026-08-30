import { ShippingOption } from '../types';

/**
 * Normaliza e ordena opções de frete recebidas do Melhor Envio.
 * Regra de Produção:
 * - NENHUMA whitelist ou bloqueio arbitrário de transportadoras.
 * - Todos os serviços retornados com preço válido são exibidos ao cliente.
 * - Ordenação transparente do menor para o maior preço.
 */
export function filterAndSortShippingQuotes<T extends ShippingOption>(quotes: T[]): T[] {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return [];
  }

  // Filtrar apenas itens com preço positivo válido e id existente
  const validQuotes = quotes.filter((q) => {
    const price = Number(q.price);
    return Number.isFinite(price) && price >= 0 && (q.id || q.serviceId || q.name);
  });

  // Ordenar por menor preço
  return [...validQuotes].sort((a, b) => {
    const priceA = Number(a.price) || 0;
    const priceB = Number(b.price) || 0;
    return priceA - priceB;
  });
}

