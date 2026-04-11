export function clearSensitiveData() {
  // Limpa qualquer dado em memória
  if (typeof window !== 'undefined') {
    // Limpa sessionStorage
    sessionStorage.clear()
    // Limpa localStorage de dados do Alfred
    const keysToRemove = Object.keys(localStorage)
      .filter(k => k.startsWith('alfred_') || k.startsWith('supabase.auth.token'))
    keysToRemove.forEach(k => localStorage.removeItem(k))
  }
}
