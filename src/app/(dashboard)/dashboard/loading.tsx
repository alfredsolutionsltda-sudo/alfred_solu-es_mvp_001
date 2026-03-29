export default function DashboardLoading() {
  return (
    <main className="pt-10 pb-16 px-10 max-w-[1920px] mx-auto animate-pulse">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
        <div>
          <div className="h-12 bg-neutral-200 rounded-xl w-64 mb-3" />
          <div className="h-6 bg-neutral-100 rounded-lg w-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-64 bg-neutral-100 rounded-xl" />
          <div className="h-10 w-48 bg-neutral-100 rounded-xl" />
        </div>
      </header>

      <div className="mb-10 w-full h-24 bg-neutral-200 rounded-2xl" />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Contratos */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-10 border border-neutral-100 h-[400px]">
          <div className="h-4 w-32 bg-neutral-100 rounded mb-10" />
          <div className="flex gap-10">
            <div className="h-16 w-16 bg-neutral-100 rounded" />
            <div className="h-16 w-16 bg-neutral-100 rounded" />
            <div className="h-16 w-16 bg-primary/10 rounded" />
          </div>
          <div className="mt-20 h-32 w-full bg-neutral-50 rounded-xl" />
        </div>

        {/* Faturamento */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-10 border border-neutral-100 h-[400px]">
          <div className="h-4 w-32 bg-neutral-100 rounded mb-8" />
          <div className="h-12 w-48 bg-neutral-200 rounded mb-12" />
          <div className="space-y-6">
            <div className="h-8 w-full bg-neutral-50 rounded" />
            <div className="h-8 w-full bg-neutral-50 rounded" />
            <div className="h-8 w-full bg-neutral-50 rounded" />
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl p-10 border border-neutral-100 h-[250px]" />
        <div className="lg:col-span-4 bg-white rounded-3xl p-10 border border-neutral-100 h-[250px]" />
        <div className="lg:col-span-4 bg-white rounded-3xl p-10 border border-neutral-100 h-[250px]" />
        <div className="lg:col-span-4 bg-white rounded-3xl p-10 border border-neutral-100 h-[250px]" />
      </div>
    </main>
  )
}
