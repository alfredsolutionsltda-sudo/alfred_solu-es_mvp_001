import { createClient } from "@/lib/supabase/server";
import { getClients, getClientMetrics } from "@/lib/data/clients";
import { redirect } from "next/navigation";
import ClientMetrics from "@/components/clients/ClientMetrics";
import ClientFilters from "@/components/clients/ClientFilters";
import ClientsClient from "@/components/clients/ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientesPage(props: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { status, search } = searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const [clientsResult, metrics] = await Promise.all([
    getClients(user.id, { status, search, limit: pageSize, offset }),
    getClientMetrics(user.id),
  ]);

  return (
    <main className="min-h-screen bg-surface pt-6 md:pt-10 pb-24 md:pb-16 px-6 md:px-10 max-w-[1920px] mx-auto space-y-8 md:space-y-10">
      {/* Header Standardized */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tight">
            Clientes
          </h1>
          <p className="text-on-surface-variant font-medium text-base md:text-lg">
            {metrics.ativos} clientes ativos · {metrics.inadimplentes} inadimplentes
          </p>
        </div>
      </header>

      <ClientMetrics metrics={metrics} />

      <div className="space-y-6">
        <ClientsClient 
          initialClients={clientsResult.data} 
          userId={user.id} 
          totalCount={clientsResult.count}
          currentPage={page}
          pageSize={pageSize}
        />
      </div>
    </main>
  );
}

