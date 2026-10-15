// Login do admin (/admin/login). Sem signup, sem credenciais fixas.
// Erro real do servidor traduzido para mensagem amigável, sem stack.

import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail, MapPinned } from 'lucide-react'
import { useAuth, useLogin } from '@/hooks/useAuth'

export default function AdminLogin() {
  const { user, isAdmin, ready } = useAuth()
  const { login, loading, error } = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  useEffect(() => {
    if (ready && user && isAdmin) navigate('/admin', { replace: true })
  }, [ready, user, isAdmin, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await login(email.trim(), password)
    if (ok) navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-4">
            <MapPinned className="w-5 h-5 text-amber-300" aria-hidden />
          </div>
          <h1 className="text-lg font-medium text-slate-100 tracking-wide">São Paulo 3D</h1>
          <p className="text-xs text-slate-500 mt-1 tracking-wider uppercase">
            Administração de empreendimentos
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs text-slate-400 tracking-wide">
              E-mail
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                aria-hidden
              />
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-md pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs text-slate-400 tracking-wide">
              Senha
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                aria-hidden
              />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-md pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-md px-3 py-2"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-medium text-sm rounded-md py-2.5 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Acesso restrito a administradores. Sem cadastro público.
        </p>
      </div>
    </div>
  )
}
