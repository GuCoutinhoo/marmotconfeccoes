import React from 'react';
import { Product } from '../../types';
import { Quote, UserCheck, Eye, ArrowRight } from 'lucide-react';

interface StaffPicksProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const StaffPicks: React.FC<StaffPicksProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const staffPicksData = [
    {
      productId: 'prod-cam-001',
      stylist: 'Felipe M. — Diretor de Design',
      note: 'O caimento boxy no ombro dessa camiseta é disparado nosso maior orgulho. Combina com qualquer calça cargo ou jeans wide leg.',
    },
    {
      productId: 'prod-cam-004',
      stylist: 'Camila V. — Head de Moda',
      note: 'A estrutura pesada e firme dessa peça traz presença imediata. Uma peça indispensável no guarda-roupa streetwear.',
    },
    {
      productId: 'prod-mol-001',
      stylist: 'Gabriel S. — Styling & Produção',
      note: 'Modelagem anorak com meio zíper e bolso canguru amplo. Arremata qualquer visual urbano com elegância e conforto térmico.',
    },
  ];

  return (
    <section className="py-20 bg-[#161616] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>CURADORIA DO STUDIO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
              ESCOLHAS DA EQUIPE (STAFF PICKS)
            </h2>
            <p className="text-xs text-[#777777] mt-1">
              Peças fundamentais recomendadas diretamente pelos criadores do estúdio AURA.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {staffPicksData.map((item, idx) => {
            const product = products.find((p) => p.id === item.productId) || products[idx];
            if (!product) return null;

            const prodImg = product.images?.[0] || (product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={idx}
                className="bg-[#080808] border border-[#262626] rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-[#D6B35A] transition-all group"
              >
                {/* Quote Box */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[#D6B35A]">
                    <Quote className="w-6 h-6 rotate-180" />
                    <span className="text-[10px] font-mono uppercase bg-[#161616] px-2.5 py-1 rounded border border-[#262626]">
                      STAFF PICK #{idx + 1}
                    </span>
                  </div>
                  <p className="text-xs text-[#EFECE6] italic leading-relaxed">
                    "{item.note}"
                  </p>
                  <p className="text-[11px] font-bold text-[#D6B35A] uppercase">
                    — {item.stylist}
                  </p>
                </div>

                {/* Product Teaser Card */}
                <div
                  onClick={() => onNavigate('product', product.id)}
                  className="bg-[#161616] border border-[#262626] p-3 rounded-xl flex items-center gap-4 cursor-pointer group-hover:border-[#D6B35A] transition-all"
                >
                  <img
                    src={prodImg}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-20 object-cover rounded-lg bg-black shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-[#D6B35A] font-bold uppercase">{product.category}</span>
                    <h4 className="text-xs font-bold text-[#EFECE6] line-clamp-1 group-hover:text-[#D6B35A] transition-colors">
                      {product.title}
                    </h4>
                    <p className="text-xs font-black text-[#EFECE6] mt-1">
                      R$ {(product.promoPrice || product.price).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickView(product);
                    }}
                    className="p-2 bg-[#080808] border border-[#262626] text-[#EFECE6] hover:bg-[#D6B35A] hover:text-black rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
