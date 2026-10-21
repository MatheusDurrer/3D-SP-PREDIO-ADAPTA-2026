// Shell do admin: header fino âmbar/slate, navegação, logout, banner de
// estágio (base da cidade NÃO pronta) e conteúdo. Responsivo a partir de 360px.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, LayoutDashboard, LogOut, Menu, TriangleAlert, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const navItems = [{ to: '/admin', label: 'Empreendimentos', icon: Building2 }]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Banner de estágio — base da cidade ainda não construída (portão 1 do PRD). */}
      <div className="bg-amber-400/10 border-b border-amber-400/20 px-4 py-2">
        <p className="flex items-start gap-2 text-[11px] leading-snug text-amber-200/90 max-w-6xl mx-auto">
          <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>
            Estágio atual: base 3D da cidade ainda não construída (piloto de dados em andamento). O
            cadastro abaixo alimenta o catálogo que a cidade consumirá quando o portão do piloto
            passar.
          </span>
        </p>
      </div>

      <header className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-amber-300"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" aria-hidden />
              </span>
              <img src="/brand/adapta-logo.svg" alt="Adapta · Admin" className="brand-logo" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navegação do admin">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-1.5 rounded text-sm text-slate-300 hover:text-amber-300 hover:bg-amber-400/5"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-slate-500 truncate max-w-[160px]">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 border border-slate-800 rounded px-2.5 py-1.5 hover:border-amber-400/30"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            className="md:hidden border-t border-slate-800 px-4 py-2 space-y-1"
            aria-label="Menu móvel"
          >
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-300 hover:bg-amber-400/5 hover:text-amber-300"
              >
                <item.icon className="w-4 h-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>

      <footer className="border-t border-slate-800/60 py-3">
        <p className="max-w-6xl mx-auto px-4 text-[11px] text-slate-600">
          Adapta — administração do guia. Acesso restrito à organização.
        </p>
      </footer>
    </div>
  )
}
