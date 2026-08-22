import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Coupon } from '../../types';
import { Tag, Plus, Trash2, CheckCircle2, AlertCircle, Copy } from 'lucide-react';

export const AdminCouponsTab: React.FC = () => {
  const { coupons, addCoupon, deleteCoupon, toggleCoupon } = useAuth();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formDiscount, setFormDiscount] = useState(15);
  const [formMinOrder, setFormMinOrder] = useState(200);
  const [formDescription, setFormDescription] = useState('');

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    addCoupon({
      code: formCode.trim().toUpperCase(),
      discountPercentage: formDiscount,
      minOrderValue: formMinOrder,
      description: formDescription || `${formDiscount}% OFF em compras acima de R$ ${formMinOrder}`,
      active: true,
    });

    showToast('Cupom Criado!', `Cupom ${formCode.toUpperCase()} ativado.`, 'success');
    setIsAddOpen(false);
    setFormCode('');
    setFormDiscount(15);
    setFormMinOrder(200);
    setFormDescription('');
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Cupom Copiado', code, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#161616] border border-[#262626] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D6B35A] uppercase">
            <Tag className="w-4 h-4" /> Cupons Promocionais & Descontos
          </div>
          <h2 className="text-xl font-black uppercase text-[#EFECE6] mt-1">
            Gestão de Cupons ({coupons.length})
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Crie códigos promocionais para influenciadores, campanhas de e-mail ou frete com desconto.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#D6B35A] text-black font-extrabold text-xs uppercase px-5 py-3 rounded hover:bg-[#EFECE6] transition-colors flex items-center gap-2 shadow-lg whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Novo Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="bg-[#161616] border border-[#262626] hover:border-[#333] p-5 rounded-xl flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-[#D6B35A] tracking-wider uppercase">
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleCopy(c.code)}
                    className="text-[#777777] hover:text-[#EFECE6] p-1"
                    title="Copiar código"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    c.active
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {c.active ? 'Ativo' : 'Pausado'}
                </span>
              </div>

              <p className="text-xs text-[#EFECE6] font-semibold mt-2">{c.description}</p>
              <div className="text-[11px] text-[#777777] mt-1 space-y-0.5 font-mono">
                <div>Desconto: <strong className="text-[#D6B35A]">{c.discountPercentage}% OFF</strong></div>
                {c.minOrderValue && <div>Pedido mínimo: R$ {c.minOrderValue.toFixed(2)}</div>}
              </div>
            </div>

            <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
              <button
                onClick={() => {
                  toggleCoupon(c.code);
                  showToast(c.active ? 'Cupom Pausado' : 'Cupom Ativado', c.code, 'info');
                }}
                className="text-xs font-bold text-[#EFECE6] hover:text-[#D6B35A] underline"
              >
                {c.active ? 'Pausar Cupom' : 'Reativar Cupom'}
              </button>

              <button
                onClick={() => {
                  deleteCoupon(c.code);
                  showToast('Cupom Removido', c.code, 'info');
                }}
                className="p-1.5 text-[#777777] hover:text-red-400 rounded transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161616] border border-[#262626] p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-black uppercase text-[#EFECE6]">Criar Novo Cupom</h3>
            <form onSubmit={handleAddCoupon} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">Código do Cupom *</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="EX: CYBER15, DROP20..."
                  required
                  className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-xs font-mono font-bold text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Desconto (%) *</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(parseInt(e.target.value) || 0)}
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Pedido Mínimo (R$)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">Descrição</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: 15% OFF de lançamento do Drop"
                  className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 bg-[#080808] border border-[#262626] text-[#777777] hover:text-[#EFECE6] py-2.5 rounded-xl text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#D6B35A] text-black font-extrabold py-2.5 rounded-xl text-xs uppercase hover:bg-[#EFECE6] transition-colors"
                >
                  Salvar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
