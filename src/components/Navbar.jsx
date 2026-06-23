import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogoFull } from './Logo'
import { LogOut, LayoutDashboard, Shield, Newspaper } from 'lucide-react'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const navLink = (to, label, Icon) => {
    const active = location.pathname.startsWith(to)
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          active ? 'text-white' : 'text-white/50 hover:text-white'
        }`}
      >
        <Icon size={15} />
        {label}
      </Link>
    )
  }

  return (
    <nav className="border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <LogoFull />
        </Link>

        <div className="flex items-center gap-4">
          {navLink('/noticias', 'Noticias', Newspaper)}

          {user ? (
            <>
              {isAdmin && navLink('/admin', 'Admin', Shield)}
              {navLink('/dashboard', 'Picks', LayoutDashboard)}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-white/35 hover:text-red-400 transition-colors"
              >
                <LogOut size={15} />
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold bg-[#00D964] text-black rounded-lg hover:bg-[#00B856] transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
