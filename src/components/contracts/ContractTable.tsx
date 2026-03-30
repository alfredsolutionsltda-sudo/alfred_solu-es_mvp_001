'use client'

import { useState, useMemo } from 'react'
import type { ContractWithClient } from '@/types/contracts'
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, FileText, AlertCircle, Eye } from 'lucide-react'

interface ContractTableProps {
  contracts: any[] // Using any here to simplify, but you should use the correct type if available
  onSelectContract: (contract: any) => void
  selectedContractId?: string
  mode?: 'contracts' | 'proposals'
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ativo: { label: 'Ativo', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  vencendo: { label: 'Vencendo', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  pendente_assinatura: { label: 'Pendente', bg: 'bg-neutral-50', text: 'text-neutral-500', dot: 'bg-neutral-300' },
  expirado: { label: 'Expirado', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  rascunho: { label: 'Rascunho', bg: 'bg-neutral-50', text: 'text-neutral-400', dot: 'bg-neutral-300' },
  enviado: { label: 'Enviado', bg: 'bg-blue-50', text: 'text-[#1455CE]', dot: 'bg-[#1455CE]' },
  assinado: { label: 'Assinado', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  encerrado: { label: 'Encerrado', bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatCurrency(value: number | null) {
  if (!value) return 'R$ 0'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  })
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ITEMS_PER_PAGE = 10

export default function ContractTable({
  contracts,
  onSelectContract,
  selectedContractId,
  mode = 'contracts',
}: ContractTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)

  const isProposals = mode === 'proposals'
// ... (omitting middle for brevity, I'll use multi_replace for safer editing)

  const filtered = useMemo(() => {
    let result = contracts

    if (statusFilter !== 'todos') {
      result = result.filter((c) => c.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(term) ||
          c.client?.name?.toLowerCase().includes(term) ||
          c.service_type?.toLowerCase().includes(term)
      )
    }

    return result
  }, [contracts, statusFilter, searchTerm])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="bg-white rounded-[24px] border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Filtros */}
      <div className="p-4 md:p-6 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 md:gap-4 bg-neutral-50/30">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por cliente, serviço ou título..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Buscar contratos ou propostas"
            className="w-full pl-11 md:pl-12 pr-4 py-3 rounded-xl md:rounded-2xl border border-neutral-200 text-[16px] md:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] transition-all bg-white shadow-sm"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Filtrar por status"
            className="w-full sm:w-auto px-5 py-3 rounded-xl md:rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1455CE]/5 focus:border-[#1455CE] bg-white cursor-pointer appearance-none min-w-[180px] shadow-sm"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="pendente_assinatura">Pendentes</option>
            <option value="vencendo">Vencendo</option>
            <option value="expirado">Expirados</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden divide-y divide-neutral-50">
        {paginated.length === 0 ? (
          <div className="px-6 py-16 text-center text-neutral-400">
            <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="text-neutral-200" size={28} />
            </div>
            <p className="text-sm font-bold text-neutral-900">Nenhum resultado</p>
          </div>
        ) : (
          paginated.map((contract) => {
            const status = statusConfig[contract.status] || statusConfig['rascunho']
            return (
              <div 
                key={contract.id} 
                onClick={() => onSelectContract(contract)}
                className="p-5 active:bg-neutral-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#1455CE]/10 flex items-center justify-center shrink-0 border border-[#1455CE]/5 shadow-sm">
                    <span className="text-xs font-black text-[#1455CE]">
                      {contract.client ? getInitials(contract.client.name) : '??'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-neutral-900 truncate tracking-tight">
                      {contract.client?.name || 'Cliente não informado'}
                    </p>
                    <p className="text-sm font-bold text-neutral-500 truncate mt-0.5">
                      {contract.service_type || contract.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-black text-neutral-900">{formatCurrency(contract.value)}</span>
                      <span className="text-neutral-300">·</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.text} border border-black/5`}>
                        <div className={`w-1 h-1 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-neutral-300 group-active:text-[#1455CE] transition-colors" />
              </div>
            )
          })
        )}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest px-8 py-5">
                Cliente
              </th>
              <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest px-4 py-5">
                Serviço
              </th>
              <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest px-4 py-5">
                Valor
              </th>
              <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest px-4 py-5 hidden md:table-cell">
                Vencimento
              </th>
              <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest px-4 py-5">
                Status
              </th>
              <th className="text-right text-[10px] font-black text-neutral-400 uppercase tracking-widest px-8 py-5">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.map((contract) => {
              const status = statusConfig[contract.status] || statusConfig['rascunho']
              const isSelected = selectedContractId === contract.id

              // Lógica de "esquecida" (> 3 dias sem leitura em status pendente/enviado)
              const isStale = isProposals && 
                ['enviado', 'pendente_assinatura'].includes(contract.status) &&
                !contract.read_at &&
                new Date(contract.created_at).getTime() < (Date.now() - 3 * 24 * 60 * 60 * 1000);

              return (
                <tr
                  key={contract.id}
                  onClick={() => onSelectContract(contract)}
                  className={`border-b border-neutral-50 cursor-pointer transition-all duration-300 group ${
                    isSelected ? 'bg-[#1455CE]/5' : 'hover:bg-neutral-50'
                  }`}
                >
                  {/* Cliente */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4 relative">
                      {isStale && (
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse" title="Proposta enviada há mais de 3 dias e ainda não visualizada">
                          <AlertCircle size={16} strokeWidth={3} />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-[#1455CE]/10 flex items-center justify-center shrink-0 border border-[#1455CE]/5">
                        <span className="text-xs font-black text-[#1455CE]">
                          {contract.client ? getInitials(contract.client.name) : '??'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900 leading-tight group-hover:text-[#1455CE] transition-colors">
                          {contract.client?.name || 'Cliente não informado'}
                        </p>
                        <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-tight">
                          {contract.client?.cpf_cnpj || 'Sem documento'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Serviço */}
                  <td className="px-4 py-5">
                    <p className="text-sm text-neutral-700 font-bold truncate max-w-[200px]">
                      {contract.service_type || contract.title}
                    </p>
                  </td>

                  {/* Valor */}
                  <td className="px-4 py-5">
                    <p className="text-sm font-headline font-black text-neutral-900">
                      {formatCurrency(contract.value)}
                    </p>
                  </td>

                  {/* Vencimento */}
                  <td className="px-4 py-5 hidden md:table-cell">
                    <p className="text-sm text-neutral-500 font-bold">
                      {formatDate(contract.end_date)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-5">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.text} border border-black/5`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                      {status.label}
                      {isProposals && contract.read_at && (
                        <span title="Visualizado">
                          <Eye size={12} className="ml-1 text-[#1455CE]" />
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectContract(contract)
                      }}
                      aria-label="Mais opções"
                      className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-neutral-300 hover:text-neutral-900 bg-neutral-50 md:bg-transparent"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-4 md:px-8 py-5 bg-neutral-50/30 flex flex-col sm:flex-row items-center justify-between border-t border-neutral-100 gap-4">
          <p className="text-[9px] md:text-[10px] text-neutral-400 font-black uppercase tracking-widest">
            {filtered.length} {isProposals ? 'propostas' : 'contratos'} no total
          </p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-neutral-600 shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {totalPages <= 5 ? (
                Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all shadow-sm ${
                      page === currentPage ? 'bg-[#1455CE] text-white' : 'bg-white border border-neutral-100 text-neutral-400'
                    }`}
                  >
                    {page}
                  </button>
                ))
              ) : (
                <span className="text-xs font-bold text-neutral-500 px-2 flex items-center">
                  Pág {currentPage} de {totalPages}
                </span>
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-neutral-600 shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
