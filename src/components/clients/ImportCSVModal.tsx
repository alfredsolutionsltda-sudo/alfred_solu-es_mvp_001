"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, Download, FileText, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ImportCSVModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number, skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = "nome,documento,email,telefone,tipo,profissao,estado\nJoão Silva,123.456.789-00,joao@exemplo.com,(11) 99999-9999,fisica,Médico,SP\nEmpresa XYZ,12.345.678/0001-90,contato@xyz.com.br,(11) 3333-4444,juridica,Consultoria,RJ";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'alfred-modelo-clientes.csv';
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setError(null);
    } else {
      setError("Por favor, selecione um arquivo .csv válido.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
      setError(null);
    } else {
      setError("Por favor, solte um arquivo .csv válido.");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        router.refresh();
      } else {
        setError(data.error || 'Erro ao importar CSV');
      }
    } catch (err: any) {
      setError("Erro de rede ao tentar importar.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeAndReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeAndReset} />
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg z-10 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Importar Clientes</h2>
          <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Importação Concluída</h3>
              <p className="text-gray-600">
                <strong className="text-gray-900">{result.imported}</strong> clientes importados com sucesso.
              </p>
              {result.skipped > 0 && (
                <p className="text-amber-600 text-sm mt-2 font-medium bg-amber-50 mx-auto w-fit px-3 py-1 rounded-full">
                  {result.skipped} clientes ignorados (documentos já cadastrados).
                </p>
              )}
              <button onClick={closeAndReset} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
                Voltar aos Clientes
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex justify-end mb-4">
                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <Download className="w-4 h-4" /> Baixar modelo CSV
                </button>
              </div>

              {!file ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-900 mb-1">Clique para enviar ou arraste o arquivo aqui</p>
                  <p className="text-xs text-gray-500">Apenas arquivos .csv suportados</p>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeAndReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!file || isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
