import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const HomeFAQ: React.FC = () => {
  const faqs = [
    {
      q: 'Como funciona o frete e a entrega?',
      a: 'Oferecemos Frete Grátis para todo o Brasil em pedidos acima de R$ 399,00. As entregas são processadas via Transportadora Expressa ou Correios (Sedex/PAC) com rastreamento detalhado em tempo real.',
    },
    {
      q: 'Qual é a diferença da modelagem Oversized e Boxy Fit?',
      a: 'Nossa modelagem Boxy/Oversized possui gola canelada de 3cm encorpada, ombros caídos e caimento retangular mais amplo no corpo sem ficar comprida demais nas pernas. Recomendamos pegar seu tamanho habitual para o caimento streetwear ideal.',
    },
    {
      q: 'Como funciona a garantia e a primeira troca grátis?',
      a: 'Você tem até 30 dias após o recebimento para solicitar a troca ou devolução do produto. A primeira troca tem todos os custos de frete totalmente pagos pela AURA.',
    },
    {
      q: 'Como devo lavar minhas peças de alta gramatura (260g e 400g)?',
      a: 'Recomendamos lavar à mão ou no ciclo delicado da máquina com água fria, sempre do avesso. Não utilize alvejantes e seque à sombra para preservar as fibras do algodão denso.',
    },
    {
      q: 'Quais são as formas de pagamento aceitas?',
      a: 'Aceitamos PIX com 5% de desconto automático, Cartão de Crédito em até 10x sem juros (bandeiras Visa, Mastercard, Elo, Amex) e Boleto Bancário via Mercado Pago Seguro.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="py-20 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>CENTRAL DE DÚVIDAS</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
            PERGUNTAS FREQUENTES (FAQ)
          </h2>
          <p className="text-xs text-[#777777] mt-2">
            Tudo o que você precisa saber antes de realizar seu pedido no estúdio AURA.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#161616] border border-[#262626] rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-extrabold text-sm uppercase text-[#EFECE6] hover:text-[#D6B35A] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D6B35A] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 text-xs text-[#777777] leading-relaxed border-t border-[#262626] pt-4 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
