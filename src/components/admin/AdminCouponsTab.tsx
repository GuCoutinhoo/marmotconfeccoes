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
      <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
            <Tag className="w-4 h-4" /> Cupons Promocionais & Descontos
          </div>
          <h2 className="text-xl font-black uppercase text-[#171717] mt-1">
            Gestão de Cupons ({coupons.length})
          </h2>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Crie códigos promocionais para influenciadores, campanhas de e-mail ou frete com desconto.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#F0C84B] text-black font-extrabold text-xs uppercase px-5 py-3 rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Novo Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="bg-white border border-[#E5E5E1] hover:border-[#B45309] p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-[#B45309] tracking-wider uppercase">
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleCopy(c.code)}
                    className="text-[#6B6B66] hover:text-[#171717] p-1"
                    title="Copiar código"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    c.active
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}
                >
                  {c.active ? 'Ativo' : 'Pausado'}
                </span>
              </div>

              <p className="text-xs text-[#171717] font-semibold mt-2">{c.description}</p>
              <div className="text-[11px] text-[#6B6B66] mt-1 space-y-0.5 font-mono">
                <div>Desconto: <strong className="text-[#B45309]">{c.discountPercentage}% OFF</strong></div>
                {c.minOrderValue && <div>Pedido mínimo: R$ {c.minOrderValue.toFixed(2)}</div>}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-between">
              <button
                onClick={() => {
                  toggleCoupon(c.code);
                  showToast(c.active ? 'Cupom Pausado' : 'Cupom Ativado', c.code, 'info');
                }}
                className="text-xs font-bold text-[#171717] hover:text-[#B45309] underline"
              >
                {c.active ? 'Pausar Cupom' : 'Reativar Cupom'}
              </button>

              <button
                onClick={() => {
                  deleteCoupon(c.code);
                  showToast('Cupom Removido', c.code, 'info');
                }}
                className="p-1.5 text-[#6B6B66] hover:text-red-600 rounded transition-colors"
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
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-black uppercase text-[#171717]">Criar Novo Cupom</h3>
            <form onSubmit={handleAddCoupon} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Código do Cupom *</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="EX: CYBER15, DROP20..."
                  required
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Desconto (%) *</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(parseInt(e.target.value) || 0)}
                    required
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Pedido Mínimo (R$)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Descrição</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: 15% OFF de lançamento do Drop"
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] py-2.5 rounded-xl text-xs font-bold uppercase shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#F0C84B] text-black font-extrabold py-2.5 rounded-xl text-xs uppercase hover:bg-amber-400 transition-colors shadow-xs"
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
