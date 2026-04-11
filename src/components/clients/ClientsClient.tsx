"use client";

import { useState } from "react";
import ClientTable from "./ClientTable";
import ClientDrawer from "./ClientDrawer";
import ClientFilters from "./ClientFilters";
import NewClientModal from "./NewClientModal";
import ImportCSVModal from "./ImportCSVModal";
import NewContractModal from "../contracts/NewContractModal";
import { ClientWithMetrics } from "@/types/clients";
import ScoreUpdater from "./ScoreUpdater";
import PaginationControl from "../PaginationControl";

export default function ClientsClient({ 
  initialClients, 
  userId,
  totalCount,
  currentPage,
  pageSize
}: { 
  initialClients: ClientWithMetrics[], 
  userId: string,
  totalCount: number,
  currentPage: number,
  pageSize: number
}) {
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  return (
    <>
      <ScoreUpdater />
      <div className="space-y-6">
        <ClientFilters 
          onNewClient={() => setIsNewModalOpen(true)} 
          onImportCSV={() => setIsImportModalOpen(true)} 
        />
        
        <ClientTable clients={initialClients} onRowClick={setSelectedClient} />
        
        <PaginationControl 
          totalItems={totalCount} 
          pageSize={pageSize} 
          currentPage={currentPage} 
        />
      </div>
      
      <ClientDrawer 
        client={selectedClient} 
        onClose={() => setSelectedClient(null)} 
        onNewContract={() => setIsContractModalOpen(true)}
        onNewProposal={() => setIsContractModalOpen(true)}
      />
      
      <NewClientModal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
        userId={userId} 
      />
      
      <ImportCSVModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        userId={userId} 
      />

      <NewContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        userId={userId}
        clients={initialClients}
        onContractCreated={() => {
            setIsContractModalOpen(false);
        }}
      />
    </>
  );
}
