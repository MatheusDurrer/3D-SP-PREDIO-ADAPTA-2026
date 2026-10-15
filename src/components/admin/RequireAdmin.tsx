// Guard do admin: exige sessão válida + papel admin.
// Enquanto o authStore não é reidratado (ready=false), não decide — evita
// redirecionar quem tem token salvo. Papel alinhado com schema (papel='admin').

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-amber-200/70 text-sm tracking-widest uppercase">
          Carregando
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm text-center border border-amber-400/20 bg-slate-900/60 rounded-lg p-8">
          <h1 className="text-lg font-medium text-amber-200 mb-2">Acesso restrito</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Esta área é exclusiva para administradores. Sua conta não possui o papel necessário.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
