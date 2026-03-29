export default function ContratoPublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      {children}
    </div>
  )
}
