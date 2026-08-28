import { Link } from 'react-router-dom'
import { ArrowLeft, Home, MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen dashboard-container flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow-primary">
          <MapPin className="h-12 w-12 text-white" aria-hidden="true" />
        </div>

        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary-600">Error 404</p>
        <h1 className="page-title mb-4 text-4xl sm:text-5xl">Page not found</h1>
        <p className="page-description mx-auto mb-8 max-w-lg text-lg">
          The page you are looking for may have moved or the address may be incorrect.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn btn-primary btn-lg gap-2">
            <Home className="h-5 w-5" aria-hidden="true" />
            Go to home
          </Link>
          <button type="button" onClick={() => window.history.back()} className="btn btn-outline btn-lg gap-2">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Go back
          </button>
        </div>
      </div>
    </main>
  )
}