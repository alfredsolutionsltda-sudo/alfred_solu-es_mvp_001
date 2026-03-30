'use client';

import { useState, useEffect } from "react";
import { X, DollarSign, Calendar, Tag, FileText, CheckCircle2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerPaymentAction, markObrigacaoAsPaidAction } from "@/app/actions/fiscalActions";
import { getClientsAction } from "@/app/actions/clientActions";

export default function RegisterPaymentModal({ 
  isOpen, 
  onClose, 
  userId,
  prefillData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  userId: string,
  prefillData?: { id?: string, type: 'faturamento' | 'imposto', amount: number, date: string, name: string }
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: prefillData?.type || 'faturamento',
    amount: prefillData?.amount?.toString() || '',
    date: prefillData?.date || new Date().toISOString().split('T')[0],
    category: prefillData?.type === 'imposto' ? 'SIMPLES' : 'honorario_fixo',
    status: 'pago',
    description: prefillData?.name || '',
    originType: 'client' as 'client' | 'other',
    clientId: '',
    customSource: ''
  });
  
  const [clients, setClients] = useState<any[]>([]);
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Carrega clientes
  useEffect(() => {
    async function loadClients() {
      if (formData.type === 'faturamento') {
        const result = await getClientsAction(userId);
        if (result.success) {
          setClients(result.clients || []);
        }
      }
    }
    loadClients();
  }, [userId, formData.type]);

  // Sincroniza form quando prefillData muda
  useEffect(() => {
    if (prefillData) {
      setFormData({
        type: prefillData.type,
        amount: prefillData.amount.toString(),
        date: prefillData.date,
        category: prefillData.type === 'imposto' ? 'SIMPLES' : 'honorario_fixo',
        status: 'pago',
        description: prefillData.name,
        originType: 'client',
        clientId: '',
        customSource: ''
      });
    }
  }, [prefillData]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Por favor, insira um valor válido.");
      return;
    }

    setIsLoading(true);
    setError(null);

    let result;
    if (prefillData?.id && prefillData.type === 'imposto') {
      // Se estamos pagando uma obrigação específica
      result = await markObrigacaoAsPaidAction(userId, prefillData.id, formData.date);
    } else {
      // Registro genérico
      result = await registerPaymentAction(userId, {
        ...formData,
        amount: Number(formData.amount)
      });
    }

    if (result.success) {
      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } else {
      setError(result.error || "Erro ao registrar.");
    }
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden transform transition-all border border-[#E2E3E1]">
        <div className="px-8 py-6 border-b border-[#F2F4F7] flex justify-between items-center bg-[#F9FAFB]">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#1A1C1B]">Registrar Pagamento</h2>
            <p className="text-[10px] font-bold text-[#6B6D6B] uppercase tracking-widest">Entrada de dados detalhada</p>
          </div>
          <button onClick={onClose} className="text-[#6B6D6B] hover:text-[#1A1C1B] p-2 rounded-full hover:bg-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center py-12 animate-in zoom-in duration-300">
               <div className="w-20 h-20 bg-[#ECFDF3] text-[#027A48] rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-[#1A1C1B] mb-2">Sucesso!</h3>
               <p className="text-[#6B6D6B]">O registro foi processado e suas métricas estão sendo atualizadas.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 animate-in fade-in">
                  {error}
                </div>
              )}

              {/* Toggle Tipo */}
              <div className="flex bg-[#F4F4F2] p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'faturamento'})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'faturamento' ? 'bg-white text-[#1A1C1B] shadow-sm' : 'text-[#6B6D6B]'}`}
                >
                  Faturamento
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'imposto'})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'imposto' ? 'bg-white text-[#1A1C1B] shadow-sm' : 'text-[#6B6D6B]'}`}
                >
                  Imposto
                </button>
              </div>

              {/* Origem do Dinheiro (apenas para faturamento) */}
              {formData.type === 'faturamento' && (
                <div className="space-y-4 p-4 bg-[#F9FAFB] border border-[#E2E3E1] rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider">Origem do Dinheiro</label>
                    <div className="flex bg-white border border-[#E2E3E1] p-1 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, originType: 'client'})}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.originType === 'client' ? 'bg-[#1455CE] text-white' : 'text-[#6B6D6B]'}`}
                      >
                        Cliente
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, originType: 'other'})}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.originType === 'other' ? 'bg-[#1455CE] text-white' : 'text-[#6B6D6B]'}`}
                      >
                        Outro
                      </button>
                    </div>
                  </div>

                  {formData.originType === 'client' ? (
                    <div className="relative">
                      <select 
                        value={formData.clientId}
                        onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-[#E2E3E1] rounded-xl text-xs font-bold outline-none appearance-none"
                      >
                        <option value="">Selecione o Cliente...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Tag className="w-3 h-3 text-[#6B6D6B]" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="De onde veio o pagamento?"
                        value={formData.customSource}
                        onChange={(e) => setFormData({...formData, customSource: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-[#E2E3E1] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="payment-amount" className="text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider">Valor (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6D6B]" />
                    <input 
                      id="payment-amount"
                      type="number" step="0.01" required
                      aria-required="true"
                      className="w-full pl-10 pr-4 py-4 bg-[#F9FAFB] border border-[#E2E3E1] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#1455CE]/10 outline-none"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="payment-date" className="text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6D6B]" />
                    <input 
                      id="payment-date"
                      type="date" required
                      aria-required="true"
                      className="w-full pl-10 pr-4 py-4 bg-[#F9FAFB] border border-[#E2E3E1] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#1455CE]/10 outline-none"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="payment-category" className="text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider">Categoria</label>
                  <div className="flex gap-2">
                    <select 
                      id="payment-category"
                      className="flex-1 px-4 py-4 bg-[#F9FAFB] border border-[#E2E3E1] rounded-2xl text-[10px] font-bold uppercase tracking-wider outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {formData.type === 'faturamento' ? (
                        <>
                          <option value="honorario_fixo">Honorário Fixo</option>
                          <option value="por_demanda">Demanda/Var.</option>
                          <option value="reembolso">Reembolso</option>
                        </>
                      ) : (
                        <>
                          <option value="SIMPLES">Simples Nac.</option>
                          <option value="ISS">ISS</option>
                          <option value="IRPF">IRPF</option>
                          <option value="OUTRO">Outros</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="payment-status" className="text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider">Status</label>
                  <select 
                    id="payment-status"
                    className="w-full px-4 py-4 bg-[#F9FAFB] border border-[#E2E3E1] rounded-2xl text-[10px] font-bold uppercase tracking-wider outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pago">Pago / Recebido</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="payment-desc" className="text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider">Descrição / Notas</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-4 h-4 text-[#6B6D6B]" />
                  <textarea 
                    id="payment-desc"
                    rows={3}
                    className="w-full pl-10 pr-4 py-4 bg-[#F9FAFB] border border-[#E2E3E1] rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#1455CE]/10 outline-none resize-none"
                    placeholder="Ex: Faturamento referente ao projeto Alpha..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#1A1C1B] uppercase tracking-wider">Comprovante de Pagamento</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${file ? 'border-[#1455CE] bg-[#1455CE]/5' : 'border-[#E2E3E1] hover:border-[#1455CE]/50'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-[#1455CE]" />
                      <span className="text-xs font-bold text-[#1A1C1B]">{file.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Remover</button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#6B6D6B]" />
                      <span className="text-xs font-bold text-[#6B6D6B]">Arraste ou clique para enviar</span>
                      <span className="text-[10px] text-[#98A2B3] uppercase font-bold tracking-widest">(PDF, JPG, PNG)</span>
                    </>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-[#1455CE] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#1455CE]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {isLoading ? 'Registrando...' : 'Confirmar Registro'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
