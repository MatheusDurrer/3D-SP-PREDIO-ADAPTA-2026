/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { RequireAdmin } from '@/components/admin/RequireAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import EmpreendimentoList from './pages/admin/EmpreendimentoList'
import EmpreendimentoForm from './pages/admin/EmpreendimentoForm'
import LeadsView from './pages/admin/LeadsView'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

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

        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
