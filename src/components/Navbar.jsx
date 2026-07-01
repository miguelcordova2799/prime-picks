import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { LogoFull } from './Logo'
import { LogOut, LayoutDashboard, Shield, Newspaper, Home, ChevronDown, Mail } from 'lucide-react'

const NAV_T = {
  es: { home: 'Inicio', news: 'Noticias', contact: 'Contacto', picks: 'Picks', signOut: 'Cerrar sesión', signIn: 'Iniciar sesión' },
  en: { home: 'Home',   news: 'News',     contact: 'Contact',  picks: 'Picks', signOut: 'Sign out',       signIn: 'Sign in' },
}

export default function Navbar() {
  const { user, profile, isAdmin, isSubscribed, signOut } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const t = NAV_T[lang]

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const navLink = (to, label, Icon, exact = false) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to)
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

  const username = user?.email?.split('@')[0] ?? ''
  const picksLeft = Math.max(0, 2 - (profile?.picks_viewed ?? 0))

  return (
    <nav className="border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <LogoFull height={44} />
        </Link>

        <div className="flex items-center gap-4">
          {navLink('/', t.home, Home, true)}
          {navLink('/noticias', t.news, Newspaper)}
          {navLink('/contacto', t.contact, Mail)}

          {user ? (
            <>
              {isAdmin && navLink('/admin', 'Admin', Shield)}
              {navLink('/dashboard', t.picks, LayoutDashboard)}

              {/* User menu dropdown */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <span className="font-medium max-w-[80px] truncate">{username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isSubscribed
                      ? 'bg-[#00D964]/20 text-[#00D964] border border-[#00D964]/30'
                      : 'bg-white/8 text-white/40 border border-white/10'
                  }`}>
                    {isSubscribed ? 'Prime ✓' : 'Gratis'}
                  </span>
                  <ChevronDown size={13} className={`transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-[#161616] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-xs text-white/40 truncate mb-0.5">{user.email}</p>
                      <p className={`text-xs font-bold ${isSubscribed ? 'text-[#00D964]' : 'text-white/50'}`}>
                        {isSubscribed ? 'Suscriptor Prime' : 'Plan gratuito'}
                      </p>
                    </div>

                    {/* Trial info for free users */}
                    {!isSubscribed && (
                      <div className="px-4 py-2.5 border-b border-white/8">
                        <p className="text-xs text-white/50">
                          Te quedan{' '}
                          <span className="text-white font-semibold">{picksLeft}</span>{' '}
                          pick{picksLeft !== 1 ? 's' : ''} gratis
                        </p>
                        <Link
                          to="/#pricing"
                          onClick={() => setMenuOpen(false)}
                          className="text-xs text-[#00D964] hover:underline mt-0.5 block"
                        >
                          Ver plan Prime →
                        </Link>
                      </div>
                    )}

                    {/* Sign out */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 hover:text-red-400 transition-colors"
                    >
                      <LogOut size={14} />
                      {t.signOut}
                    </button>
                  </div>
                )}
              </div>
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
