"use client";

import { useState } from "react";
import ClientTable from "./ClientTable";
import ClientDrawer from "./ClientDrawer";
import ClientFilters from "./ClientFilters";
import NewClientModal from "./NewClientModal";
import ImportCSVModal from "./ImportCSVModal";
import NewContractModal from "../contracts/NewContractModal";
import { ClientWithMetrics } from "@/types/clients";

export default function ClientsClient({ initialClients, userId }: { initialClients: ClientWithMetrics[], userId: string }) {
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <ClientFilters 
          onNewClient={() => setIsNewModalOpen(true)} 
          onImportCSV={() => setIsImportModalOpen(true)} 
        />
        
        <ClientTable clients={initialClients} onRowClick={setSelectedClient} />
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
