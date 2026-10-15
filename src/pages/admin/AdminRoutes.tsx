// Rotas do admin — integradas no App.tsx do projeto Skip.
// Preserva TooltipProvider/Toaster/Sonner e Layout existentes (protegidos).
// Landing "/" permanece intocada: visual da cidade é decisão do coordenador.

import { Route, Routes } from 'react-router-dom'
import { RequireAdmin } from '@/components/admin/RequireAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import EmpreendimentoList from '@/pages/admin/EmpreendimentoList'
import EmpreendimentoForm from '@/pages/admin/EmpreendimentoForm'
import LeadsView from '@/pages/admin/LeadsView'

export default function AdminRoutes() {
  return (
    <Routes>
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
    </Routes>
  )
}
