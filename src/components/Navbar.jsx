import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { LogoFull } from './Logo'
import { LogOut, LayoutDashboard, Shield, Newspaper } from 'lucide-react'

const NAV_T = {
  es: { news: 'Noticias', picks: 'Picks', signOut: 'Salir', signIn: 'Iniciar sesión' },
  en: { news: 'News',     picks: 'Picks', signOut: 'Sign out', signIn: 'Sign in' },
}

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const t = NAV_T[lang]

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
          <LogoFull height={44} />
        </Link>

        <div className="flex items-center gap-4">
          {navLink('/noticias', t.news, Newspaper)}

          {user ? (
            <>
              {isAdmin && navLink('/admin', 'Admin', Shield)}
              {navLink('/dashboard', t.picks, LayoutDashboard)}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-white/35 hover:text-red-400 transition-colors"
              >
                <LogOut size={15} />
                {t.signOut}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold bg-[#00D964] text-black rounded-lg hover:bg-[#00B856] transition-colors"
            >
              {t.signIn}
            </Link>
          )}

          {/* Language toggle */}
          <div className="flex rounded-lg bg-white/6 p-0.5">
            {['es', 'en'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-colors ${
                  lang === l ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
