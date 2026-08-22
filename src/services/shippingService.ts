import { getMelhorEnvioConfig, MelhorEnvioClient, PackageDimensions, ProductShippingSpec } from './melhorEnvioClient';
import { validateAndFetchCep, normalizeCep, isValidCepFormat } from './cepService';
import { ShippingOption } from '../types';

export interface CalculateShippingRequest {
  destinationPostalCode: string;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
  // Optional direct package for exact package calculation
  package?: PackageDimensions;
  insuranceValue?: number;
  productsStore?: any[];
}

export interface CalculateShippingResponse {
  success: boolean;
  quotes: ShippingOption[];
  options: ShippingOption[];
  originPostalCode: string;
}

export class ShippingService {
  private client: MelhorEnvioClient;

  constructor() {
    this.client = new MelhorEnvioClient();
  }

  /**
   * Main method to calculate shipping:
   * 1. Validates destination CEP format and real existence via ViaCEP
   * 2. Resolves items from catalog database or package parameters
   * 3. Calculates combined weight, dimensions, and insurance
   * 4. Calls Melhor Envio API via client
   */
  public async calculate(params: CalculateShippingRequest): Promise<CalculateShippingResponse> {
    const config = getMelhorEnvioConfig();
    const cleanDestination = normalizeCep(params.destinationPostalCode);

    if (!isValidCepFormat(cleanDestination) || cleanDestination.length !== 8) {
      const err: any = new Error('CEP inválido. Digite um CEP válido com 8 dígitos.');
      err.code = 'INVALID_CEP';
      err.status = 400;
      throw err;
    }

    // Step 1: Real CEP existence check
    const cepCheck = await validateAndFetchCep(cleanDestination);
    if (!cepCheck.exists) {
      if (cepCheck.isServiceUnavailable) {
        const err: any = new Error('Não foi possível validar o CEP neste momento. Tente novamente.');
        err.code = 'CEP_SERVICE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }
      const err: any = new Error('CEP não encontrado. Verifique o CEP informado.');
      err.code = 'CEP_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    // Step 2: Determine package specs
    if (params.package) {
      const result = await this.client.calculateShipment({
        originPostalCode: config.originPostalCode,
        destinationPostalCode: cleanDestination,
        package: params.package,
        insuranceValue: params.insuranceValue,
      });

      return {
        success: true,
        quotes: result.quotes,
        options: result.options,
        originPostalCode: result.originPostalCode,
      };
    }

    // Dynamic cart items mode: resolve from product catalog
    const items = params.items || [];
    const productsStore = params.productsStore || [];

    if (!Array.isArray(items) || items.length === 0) {
      // If no items passed, calculate with standard streetwear package default
      const result = await this.client.calculateShipment({
        originPostalCode: config.originPostalCode,
        destinationPostalCode: cleanDestination,
        package: {
          height: 4,
          width: 20,
          length: 25,
          weight: 0.35,
        },
      });

      return {
        success: true,
        quotes: result.quotes,
        options: result.options,
        originPostalCode: result.originPostalCode,
      };
    }

    // Build the list of products preserving unit dimensions and individual quantities
    const productList: ProductShippingSpec[] = [];

    for (const item of items) {
      const prod = productsStore.find((p: any) => String(p.id) === String(item.productId) || String(p.slug) === String(item.productId));
      const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));

      if (!prod) {
        const err: any = new Error(`Produto #${item.productId} não encontrado no catálogo.`);
        err.code = 'PRODUCT_NOT_FOUND';
        err.status = 404;
        throw err;
      }

      // Security: Always extract real price from backend store, never trust client-provided price
      const unitPrice = Number(prod.promoPrice ?? prod.price ?? 0);
      const unitWeight = Number(prod.weight);
      const unitHeight = Number(prod.height);
      const unitWidth = Number(prod.width);
      const unitLength = Number(prod.length);

      if (
        !Number.isFinite(unitWeight) || unitWeight <= 0 ||
        !Number.isFinite(unitHeight) || unitHeight <= 0 ||
        !Number.isFinite(unitWidth) || unitWidth <= 0 ||
        !Number.isFinite(unitLength) || unitLength <= 0
      ) {
        console.log('Produto sem dados de envio:');
        console.log('ID:', prod.id);
        console.log('Nome:', prod.title || prod.name);
        console.log('Peso:', prod.weight);
        console.log('Largura:', prod.width);
        console.log('Altura:', prod.height);
        console.log('Comprimento:', prod.length);

        const err: any = new Error(`O produto "${prod.title || prod.id}" está com peso ou dimensões não cadastradas.`);
        err.code = 'INVALID_PRODUCT_SPECS';
        err.status = 422;
        throw err;
      }

      productList.push({
        id: String(prod.id || item.productId),
        width: Math.max(11, Math.round(unitWidth)),
        height: Math.max(2, Math.round(unitHeight)),
        length: Math.max(16, Math.round(unitLength)),
        weight: Number(Math.max(0.05, unitWeight).toFixed(2)),
        insurance_value: Number(unitPrice.toFixed(2)),
        quantity: qty,
      });
    }

    const result = await this.client.calculateShipment({
      originPostalCode: config.originPostalCode,
      destinationPostalCode: cleanDestination,
      products: productList,
    });

    return {
      success: true,
      quotes: result.quotes,
      options: result.options,
      originPostalCode: result.originPostalCode,
    };
  }
}

