import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, LogOut, LayoutDashboard, Shield } from 'lucide-react'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#EF9F27] flex items-center justify-center">
            <TrendingUp size={18} className="text-black" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Prime<span className="text-[#EF9F27]">Picks</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#EF9F27] transition-colors"
                >
                  <Shield size={15} />
                  Admin
                </Link>
              )}
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-white/40 hover:text-red-400 transition-colors"
              >
                <LogOut size={15} />
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium bg-[#EF9F27] text-black rounded-lg hover:bg-[#D4891A] transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
