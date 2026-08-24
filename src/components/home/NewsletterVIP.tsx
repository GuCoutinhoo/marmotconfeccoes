import React, { useState } from 'react';
import { Mail, Check, Copy, Sparkles, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const NewsletterVIP: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('E-mail Inválido', 'Por favor insira um e-mail válido.', 'error');
      return;
    }
    setSubmitted(true);
    showToast('Inscrição Confirmada!', 'Seu cupom de 10% OFF é MARMOT10', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('MARMOT10');
    setCopied(true);
    showToast('Cupom Copiado!', 'Código MARMOT10 copiado para a área de transferência.', 'info');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="py-16 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F8F9FA] border border-[#E4E4E7] rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
          <div className="max-w-xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-3 py-1 rounded-full text-xs font-mono font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" /> CLUBE DO ATELIÊ
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#18181B]">
              FIQUE POR DENTRO DOS PRÓXIMOS DROPS
            </h2>

            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
              Inscreva seu e-mail para receber avisos de reposição, acesso antecipado a novos lotes e 10% OFF no seu primeiro pedido.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-[#71717A] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail..."
                    required
                    className="w-full bg-white border border-[#E4E4E7] pl-11 pr-4 py-3.5 rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] placeholder-[#71717A] shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-black text-xs uppercase px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm active:scale-98 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> INSCREVER-SE
                </button>
              </form>
            ) : (
              <div className="bg-white border border-[#FDE68A] p-5 rounded-xl space-y-2 animate-fadeIn shadow-sm">
                <div className="flex items-center justify-center gap-2 text-[#92400E] font-bold text-xs uppercase">
                  <Check className="w-4 h-4" /> Inscrição realizada com sucesso!
                </div>
                <p className="text-xs text-[#18181B]">
                  Seu cupom exclusivo de 10% OFF no primeiro pedido:
                </p>
                <div className="flex items-center justify-center gap-3 bg-[#F8F9FA] border border-[#E4E4E7] p-2.5 rounded-lg max-w-xs mx-auto">
                  <span className="font-mono text-base font-black text-[#92400E] tracking-wider">MARMOT10</span>
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-[#F4C400] text-black rounded-md hover:bg-[#E5B500] transition-colors cursor-pointer"
                    title="Copiar cupom"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
