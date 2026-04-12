import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await searchParams;

  // Se houver um código de autenticação (ex: recuperação de senha), processa via callback
  if (code && typeof code === 'string') {
    return redirect(`/auth/callback?code=${code}&next=/auth/reset-password`);
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Se já estiver logado, vai para o dashboard
  if (session) {
    return redirect("/dashboard");
  }

  // Por padrão, redireciona para login
  redirect("/login");
}
