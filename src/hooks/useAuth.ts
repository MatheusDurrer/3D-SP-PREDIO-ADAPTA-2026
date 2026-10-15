import { useCallback, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export interface AdminUser {
  id: string
  email: string
  nome: string
  papel: string
}

function toAdminUser(): AdminUser | null {
  const model = pb.authStore.record as unknown as Record<string, unknown> | null
  if (!pb.authStore.isValid || !model) return null
  return {
    id: String(model.id ?? ''),
    email: String(model.email ?? ''),
    nome: String(model.name ?? model.nome ?? ''),
    papel: String(model.papel ?? ''),
  }
}

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(() => toAdminUser())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUser(toAdminUser())
    setReady(true)
    const unsub = pb.authStore.onChange(() => setUser(toAdminUser()))
    return () => unsub()
  }, [])

  const isAdmin = user !== null && user.papel === 'admin'

  const logout = useCallback(() => {
    pb.authStore.clear()
  }, [])

  return { user, isAdmin, ready, logout }
}

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await pb.collection('users').authWithPassword(email, password)
      return true
    } catch {
      setError('Credenciais inválidas ou sem acesso.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { login, loading, error }
}
