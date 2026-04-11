"use client"

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  totalItems: number
  pageSize: number
  currentPage: number
}

export default function PaginationControl({ totalItems, pageSize, currentPage }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const totalPages = Math.ceil(totalItems / pageSize)
  
  if (totalPages <= 1) return null

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page))
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-outline sm:px-6 mt-6 rounded-xl">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="relative inline-flex items-center px-4 py-2 border border-outline text-sm font-medium rounded-md text-on-surface bg-surface hover:bg-surface-variant disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-outline text-sm font-medium rounded-md text-on-surface bg-surface hover:bg-surface-variant disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">
            Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> até{' '}
            <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> de{' '}
            <span className="font-medium">{totalItems}</span> resultados
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-outline bg-surface text-sm font-medium text-on-surface-variant hover:bg-surface-variant disabled:opacity-50"
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Simple page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageToShow = i + 1
              // Logic to center page window could be added here
              return (
                <button
                  key={pageToShow}
                  onClick={() => handlePageChange(pageToShow)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === pageToShow
                      ? 'z-10 bg-primary text-on-primary border-primary'
                      : 'bg-surface border-outline text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  {pageToShow}
                </button>
              )
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-outline bg-surface text-sm font-medium text-on-surface-variant hover:bg-surface-variant disabled:opacity-50"
            >
              <span className="sr-only">Próximo</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
