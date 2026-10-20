/* 404 Page - Displays when a user attempts to access a non-existent route - translate to the language of the user */
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-slate-300 mb-4">Página não encontrada</p>
        <a
          href="/"
          className="text-amber-200 hover:text-amber-100 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  )
}

export default NotFound
