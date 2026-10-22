/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import AdaptaArrival from './pages/AdaptaArrival'
import NotFound from './pages/NotFound'
import PublicInventory from './pages/PublicInventory'
import InstallApp from './pages/InstallApp'

import Layout from './components/Layout'
import { RequireAdmin } from '@/components/admin/RequireAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import EmpreendimentoList from './pages/admin/EmpreendimentoList'
import EmpreendimentoForm from './pages/admin/EmpreendimentoForm'
import LeadsView from './pages/admin/LeadsView'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

// SP3D Explorer 3D: módulo isolado com lazy load (chunk separado, não afeta as rotas existentes)
const LazyExplorerPage = lazy(() => import('./features/explorer/ExplorerPage'))

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        {/* Admin: shell próprio, rotas antes do catch-all */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout>
                <EmpreendimentoList />
              </AdminLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/novo"
          element={
            <RequireAdmin>
              <AdminLayout>
                <EmpreendimentoForm />
              </AdminLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/editar/:id"
          element={
            <RequireAdmin>
              <AdminLayout>
                <EmpreendimentoForm />
              </AdminLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/leads"
          element={
            <RequireAdmin>
              <AdminLayout>
                <LeadsView />
              </AdminLayout>
            </RequireAdmin>
          }
        />

        <Route path="/adapta" element={<AdaptaArrival />} />
        <Route path="/instalar" element={<InstallApp />} />

        <Route path="/empreendimentos" element={<PublicInventory />} />
        <Route
          path="/explorar"
          element={
            <Suspense fallback={<div style={{ minHeight: '100dvh' }} />}>
              <LazyExplorerPage />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
