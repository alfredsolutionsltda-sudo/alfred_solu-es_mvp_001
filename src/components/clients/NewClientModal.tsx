"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ClientFormData } from "@/types/clients";
import { createClientAction } from "@/app/actions/clientActions";
import { useRouter } from "next/navigation";

function formatCPF(val: string) {
  const v = val.replace(/\D/g, "");
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14);
}

function formatCNPJ(val: string) {
  const v = val.replace(/\D/g, "");
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").substring(0, 18);
}

function formatPhone(val: string) {
  const v = val.replace(/\D/g, "");
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").substring(0, 14);
  }
  return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").substring(0, 15);
}

export default function NewClientModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    type: "pessoa_fisica",
    cpf_cnpj: "",
    email: "",
    phone: "",
    notes: ""
  });
  
  // Para compor a propriedade Notes conforme requisitos do prompt
  const [prof, setProf] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [estado, setEstado] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const combinedNotes = `Profissão/Segmento: ${prof}\nEmpresa: ${empresa}\nEstado: ${estado}\nNotas: ${internalNotes}`;
    
    const payload = { ...formData, notes: combinedNotes };

    const result = await createClientAction(userId, payload);
    
    if (result.success) {
      // Refresh page to load new data via Server Components
      router.refresh(); 
      // Close Modal
      onClose();
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg z-10 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Novo Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <form id="new-client-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4">
              <button
                type="button"
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${formData.type === 'pessoa_fisica' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setFormData({...formData, type: 'pessoa_fisica', cpf_cnpj: ''})}
              >
                Pessoa Física
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${formData.type === 'pessoa_juridica' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setFormData({...formData, type: 'pessoa_juridica', cpf_cnpj: ''})}
              >
                Pessoa Jurídica
              </button>
            </div>

            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
              <input
                id="client-name"
                required
                aria-required="true"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 text-sm"
                placeholder="Nome do cliente"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="client-doc" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
                </label>
                <input
                  id="client-doc"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 text-sm"
                  placeholder={formData.type === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                  value={formData.cpf_cnpj || ""}
                  onChange={e => {
                    const val = formData.type === 'pessoa_fisica' ? formatCPF(e.target.value) : formatCNPJ(e.target.value)
                    setFormData({...formData, cpf_cnpj: val})
                  }}
                />
              </div>

              <div>
                <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  id="client-phone"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 text-sm"
                  placeholder="(00) 00000-0000"
                  value={formData.phone || ""}
                  onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                id="client-email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 text-sm"
                placeholder="email@exemplo.com"
                value={formData.email || ""}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="client-prof" className="block text-sm font-medium text-gray-700 mb-1">Profissão/Segmento</label>
                <input
                  id="client-prof"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 text-sm"
                  value={prof}
                  onChange={e => setProf(e.target.value)}
                />
              </div>

              {formData.type === 'pessoa_fisica' ? (
                <div>
                  <label htmlFor="client-state" className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                  <select
                    id="client-state"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm bg-white"
                    value={estado}
                    onChange={e => setEstado(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                    <option value="EX">Exterior</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="client-company" className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    id="client-company"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 text-sm"
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="client-notes" className="block text-sm font-medium text-gray-700 mb-1">Notas Internas</label>
              <textarea
                id="client-notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 text-sm"
                rows={3}
                placeholder="Observações sobre o cliente..."
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
              />
            </div>
            
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="new-client-form"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Salvando...' : 'Cadastrar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
