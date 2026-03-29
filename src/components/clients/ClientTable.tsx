"use client";

import { ChevronRight } from "lucide-react";
import { ClientWithMetrics } from "@/types/clients";

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NA';
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 45%)`;
}

function ScoreBar({ score }: { score: number }) {
  let color = 'bg-gray-300';
  let label = 'Desconhecido';
  if (score >= 80) { color = 'bg-green-500'; label = 'Excelente'; }
  else if (score >= 60) { color = 'bg-green-400'; label = 'Ótimo'; }
  else if (score >= 40) { color = 'bg-yellow-400'; label = 'Regular'; }
  else if (score >= 20) { color = 'bg-red-400'; label = 'Baixo'; }
  else { color = 'bg-red-600'; label = 'Crítico'; }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-[10px] md:text-xs font-medium text-gray-500">
        <span>{label}</span>
        <span>{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1 md:h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function ClientTable({ 
  clients, 
  onRowClick 
}: { 
  clients: ClientWithMetrics[];
  onRowClick: (c: ClientWithMetrics) => void;
}) {
  return (
    <div className="bg-white border border-neutral-100 rounded-2xl shadow-premium overflow-hidden">
      {/* Mobile View (Cards) */}
      <div className="md:hidden divide-y divide-neutral-100">
        {clients.map(client => (
          <div 
            key={client.id} 
            className="p-5 flex items-center justify-between hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
            onClick={() => onRowClick(client)}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm"
                style={{ backgroundColor: stringToColor(client.name) }}
              >
                {getInitials(client.name)}
              </div>
              <div className="min-w-0">
                <p className="font-headline font-black text-neutral-900 text-base truncate">{client.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    client.status === 'ativo' ? 'bg-green-50 text-green-700' :
                    client.status === 'inadimplente' ? 'bg-red-50 text-red-700' :
                    client.status === 'prospecto' ? 'bg-blue-50 text-blue-700' :
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    {client.status}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium truncate">{client.cpf_cnpj || 'Sem documento'}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="text-neutral-300 shrink-0" size={20} />
          </div>
        ))}
        {clients.length === 0 && (
          <div className="px-5 py-12 text-center text-neutral-400 font-medium">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50/50 border-b border-neutral-100 text-[#6B6D6B] font-black uppercase tracking-widest text-[10px]">
            <tr>
              <th className="px-6 py-5 min-w-[240px]">CLIENTE</th>
              <th className="px-6 py-5">PROFISSÃO/SEGMENTO</th>
              <th className="px-6 py-5 text-center">CONTRATOS</th>
              <th className="px-6 py-5">TOTAL FAT.</th>
              <th className="px-6 py-5">PENDENTE</th>
              <th className="px-6 py-5">PRÓX. VENC.</th>
              <th className="px-6 py-5 min-w-[140px]">SCORE</th>
              <th className="px-6 py-5 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clients.map(client => (
              <tr 
                key={client.id} 
                className="hover:bg-[#F8F8F6] cursor-pointer transition-colors group"
                onClick={() => onRowClick(client)}
              >
                <td className="px-6 py-5 border-l-4 border-transparent group-hover:border-[#1455CE]">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                      style={{ backgroundColor: stringToColor(client.name) }}
                    >
                      {getInitials(client.name)}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-tight">{client.name}</p>
                      <p className="text-xs text-neutral-400 font-medium mt-1">{client.cpf_cnpj || 'Sem documento'}</p>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-5">
                  <span className="inline-block px-2.5 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                    {client.notes?.split('\n')[0] || (client.type === 'pessoa_juridica' ? 'Empresa' : 'Pessoa Física')}
                  </span>
                </td>
                
                <td className="px-6 py-5 text-center">
                  <span className="font-black text-neutral-900">{client.active_contracts}</span>
                </td>
                
                <td className="px-6 py-5 text-neutral-600 font-bold">
                  {formatCurrency(client.total_billed)}
                </td>
                
                <td className="px-6 py-5">
                  <span className={client.total_pending > 0 ? "text-red-600 font-black" : "text-neutral-300 font-medium"}>
                    {client.total_pending > 0 ? formatCurrency(client.total_pending) : '-'}
                  </span>
                </td>
                
                <td className="px-6 py-5">
                  {client.next_due_date ? (
                    <span className="text-neutral-600 font-medium">
                      {new Date(client.next_due_date).toLocaleDateString('pt-BR')}
                    </span>
                  ) : <span className="text-neutral-300 font-medium">-</span>}
                </td>
                
                <td className="px-6 py-5">
                  <ScoreBar score={client.inadimplency_score} />
                </td>
                
                <td className="px-6 py-5 text-right">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                    client.status === 'ativo' ? 'bg-green-50 text-green-700' :
                    client.status === 'inadimplente' ? 'bg-red-50 text-red-700' :
                    client.status === 'inativo' ? 'bg-neutral-100 text-neutral-600' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      client.status === 'ativo' ? 'bg-green-500' :
                      client.status === 'inadimplente' ? 'bg-red-500' :
                      client.status === 'inativo' ? 'bg-neutral-400' :
                      'bg-blue-500'
                    }`}></div>
                    {client.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 text-[10px] font-black uppercase tracking-widest text-[#6B6D6B] flex justify-between items-center">
        <span>{clients.length} {clients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}</span>
      </div>
    </div>
  );
}
