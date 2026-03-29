"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ObrigacaoFiscal } from '@/types/database';
import { Calendar, CheckCircle2, AlertCircle, Clock, ChevronRight, FileText } from 'lucide-react';

interface ObrigacoesTableProps {
  obrigacoes: ObrigacaoFiscal[];
}

export default function ObrigacoesTable({ obrigacoes }: ObrigacoesTableProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isAtrasada = (obr: ObrigacaoFiscal) => {
    if (obr.status === 'pago') return false;
    const due = new Date(obr.due_date!);
    return due < new Date();
  };

  const isBreve = (obr: ObrigacaoFiscal) => {
    if (obr.status === 'pago') return false;
    const due = new Date(obr.due_date!);
    const diff = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return diff >= 0 && diff <= 7;
  };

  const getStatusBadge = (status: string, isAtrasada: boolean) => {
    if (status === 'pago') return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3"/> Pago</span>;
    if (isAtrasada) return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3F2] text-[#B42318] text-[10px] font-bold uppercase tracking-wider"><AlertCircle className="w-3 h-3"/> Atrasado</span>;
    if (status === 'futuro') return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F9FAFB] text-[#475467] text-[10px] font-bold uppercase tracking-wider"> — Futuro</span>;
    return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFAEB] text-[#B54708] text-[10px] font-bold uppercase tracking-wider"><Clock className="w-3 h-3"/> Pendente</span>;
  };

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const totalPaid = obrigacoes.filter(o => o.status === 'pago').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPending = obrigacoes.filter(o => o.status === 'pendente' || o.status === 'atrasado').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalRestante = obrigacoes.filter(o => o.status === 'futuro').reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const handlePay = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch('/api/fiscal/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obrigacaoId: id, paidAt: paymentDate })
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSelectedId(null);
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E3E1] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-[#E2E3E1]">
        <h3 className="text-lg font-black text-[#1A1C1B]">Calendário de Obrigações</h3>
      </div>

      <div className="flex-1 overflow-x-auto">
        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[#F2F4F7]">
          {obrigacoes.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#6B6D6B]">
              <div className="flex flex-col items-center gap-3">
                <Calendar className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">Nenhuma obrigação fiscal registrada para este período.</p>
              </div>
            </div>
          ) : (
            obrigacoes.map((obr) => {
              const date = new Date(obr.due_date!);
              const monthLabel = months[date.getMonth()];
              const atrasada = isAtrasada(obr);
              const breve = isBreve(obr);
              const isCurrentMonth = new Date().getMonth() === date.getMonth() && new Date().getFullYear() === obr.year;

              return (
                <div 
                  key={obr.id}
                  className={`p-5 flex flex-col gap-4 transition-colors hover:bg-[#F9FAFB] ${isCurrentMonth ? 'bg-[#FFFAEB]/30 border-l-4 border-l-[#F79009]' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#1A1C1B] text-sm">{monthLabel}</span>
                        <span className="text-[10px] text-[#6B6D6B] font-bold uppercase tracking-widest">{obr.year}</span>
                      </div>
                      <span className="text-sm font-bold text-[#1A1C1B]">{obr.name}</span>
                      <span className="text-[10px] text-[#6B6D6B] font-medium uppercase tracking-wider bg-neutral-100 px-1.5 py-0.5 rounded w-fit">{obr.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#1A1C1B]">
                        {formatCurrency(obr.amount || 0)}
                      </div>
                      <div className={`text-[10px] font-bold mt-1 ${
                        atrasada ? 'text-[#F04438]' : breve ? 'text-[#F79009]' : 'text-[#475467]'
                      }`}>
                        Vence {date.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-neutral-100">
                    <div className="scale-90 origin-left">
                      {getStatusBadge(obr.status, atrasada)}
                    </div>
                    <div>
                      {obr.status === 'pago' ? (
                        <button className="flex items-center gap-1.5 py-3 px-2 text-[10px] font-bold text-[#1455CE] hover:underline underline-offset-4">
                          <FileText className="w-3.5 h-3.5" /> Comprovante
                        </button>
                      ) : obr.status === 'futuro' ? (
                        <span className="text-[10px] text-[#98A2B3] font-bold uppercase px-2">Aguardando</span>
                      ) : (
                        <button 
                          onClick={() => setSelectedId(obr.id)}
                          className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-[#1455CE] rounded-xl hover:bg-[#1140A0] transition-all shadow-md shadow-[#1455CE]/10"
                        >
                          Pagar <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-[#F9FAFB] text-[11px] font-bold text-[#6B6D6B] uppercase tracking-widest border-b border-[#E2E3E1]">
              <th className="px-6 py-3">Mês</th>
              <th className="px-6 py-3">Obrigação</th>
              <th className="px-6 py-3">Vencimento</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F4F7]">
            {obrigacoes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#6B6D6B]">
                  <div className="flex flex-col items-center gap-3">
                    <Calendar className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma obrigação fiscal registrada para este período.</p>
                  </div>
                </td>
              </tr>
            ) : (
              obrigacoes.map((obr) => {
                const date = new Date(obr.due_date!);
                const monthLabel = months[date.getMonth()];
                const atrasada = isAtrasada(obr);
                const breve = isBreve(obr);
                const isCurrentMonth = new Date().getMonth() === date.getMonth() && new Date().getFullYear() === obr.year;

                return (
                  <tr 
                    key={obr.id}
                    className={`group transition-colors hover:bg-[#F9FAFB] ${isCurrentMonth ? 'bg-[#FFFAEB]/30 border-l-4 border-l-[#F79009]' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-black text-[#1A1C1B]">{monthLabel}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#1A1C1B]">{obr.name}</span>
                        <span className="text-xs text-[#6B6D6B]">{obr.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${
                        atrasada ? 'text-[#F04438] font-bold' : breve ? 'text-[#F79009] font-medium' : 'text-[#475467]'
                      }`}>
                        {date.toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-[#1A1C1B]">{formatCurrency(obr.amount || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(obr.status, atrasada)}
                    </td>
                    <td className="px-6 py-4">
                      {obr.status === 'pago' ? (
                        <button className="flex items-center gap-1.5 text-xs font-bold text-[#1455CE] hover:underline underline-offset-4">
                          <FileText className="w-3.5 h-3.5" /> Ver comprovante
                        </button>
                      ) : obr.status === 'futuro' ? (
                        <span className="text-xs text-[#98A2B3]">Aguardando</span>
                      ) : (
                        <button 
                          onClick={() => setSelectedId(obr.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#1455CE] bg-[#1455CE]/5 px-3 py-1.5 rounded-lg hover:bg-[#1455CE] hover:text-white transition-all min-h-[44px] md:min-h-0 min-w-[44px] md:min-w-0"
                        >
                          Pagar <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 md:p-6 bg-[#F9FAFB] border-t border-[#E2E3E1] flex flex-col md:flex-row md:justify-between gap-4 md:items-center text-[10px] md:text-xs text-[#6B6D6B] font-bold uppercase tracking-widest">
        <div className="grid grid-cols-2 md:flex gap-x-6 gap-y-2">
          <span>Pago: <b className="text-[#027A48] block md:inline text-xs md:text-xs">{formatCurrency(totalPaid)}</b></span>
          <span>Pendente: <b className="text-[#B42318] block md:inline text-xs md:text-xs">{formatCurrency(totalPending)}</b></span>
          <span className="col-span-2 md:col-span-1">Estimado: <b className="text-[#1A1C1B] block md:inline text-xs md:text-xs">{formatCurrency(totalRestante)}</b></span>
        </div>
      </div>

      {/* Modal Simples de Pagamento */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm">
            <h4 className="text-lg font-black text-[#1A1C1B] mb-2">Registrar Pagamento</h4>
            <p className="text-sm text-[#6B6D6B] mb-4">Confirme a data que o pagamento foi realizado.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1C1B] uppercase tracking-wider mb-1.5">Data de Pagamento</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-3 bg-[#F4F4F2] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1455CE]/20"
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedId(null)}
                  className="flex-1 py-3 text-sm font-bold text-[#6B6D6B] hover:bg-[#F4F4F2] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handlePay(selectedId)}
                  disabled={loading === selectedId}
                  className="flex-1 py-3 text-sm font-bold text-white bg-[#1455CE] rounded-xl shadow-[0_4px_12px_rgba(20,85,206,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading === selectedId ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
