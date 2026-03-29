'use client';

import { Download, FileText } from 'lucide-react';
import { AlfredBriefingData } from '@/types/reports';

interface ReportActionsProps {
  data: AlfredBriefingData;
}

export default function ReportActions({ data }: ReportActionsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    try {
      // 1. Cabecalho das Metricas
      let csv = "METRICAS GERAIS\n";
      csv += "Faturamento Bruto,Recebido,Inadimplencia,Impostos,Margem Liquida\n";
      csv += `${data.metrics.grossRevenue},${data.metrics.received},${data.metrics.delinquency},${data.metrics.taxesPaid},${data.metrics.netMargin}%\n\n`;

      // 2. Performance por Servico
      csv += "PERFORMANCE POR SERVICO\n";
      csv += "Servico,Propostas,Aceitas,Conversao\n";
      data.serviceConversion.forEach(s => {
        csv += `${s.serviceType},${s.proposals},${s.accepted},${s.conversionRate.toFixed(1)}%\n`;
      });
      csv += "\n";

      // 3. Detalhes de Clientes (Tudo Junto)
      csv += "PERFORMANCE POR CLIENTE\n";
      csv += "Cliente,Volume,Pontualidade,Tendencia\n";
      data.clients.forEach(c => {
        csv += `${c.clientName},${c.volume},${c.punctuality.toFixed(1)}%,${c.trend}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_alfred_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erro ao exportar CSV:", err);
    }
  };

  return (
    <div className="flex items-center gap-3 print:hidden">
      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container-low transition-all shadow-premium"
      >
         <FileText className="w-4 h-4" /> PDF
      </button>
      
      <button 
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
      >
        <Download className="w-4 h-4" /> Exportar
      </button>
    </div>
  );
}
