import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'
import { LogoFull } from '../components/Logo'
import { Eye, EyeOff } from 'lucide-react'

const T = {
  es: {
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    enterDashboard: 'Entrar al dashboard',
    startFree: 'Empezar gratis →',
    forgotPassword: '¿Olvidaste tu contraseña?',
    sendInstructions: 'Enviar instrucciones',
    freePicksBannerTitle: '2 picks gratis, sin tarjeta',
    freePicksBannerSub: 'Crea tu cuenta y elige 2 picks para ver el análisis completo gratis',
    noCardCancelAnytime: 'Sin tarjeta de crédito · Cancela cuando quieras',
    alreadyHaveAccount: '¿Ya tienes cuenta? Entra aquí',
    noAccountYet: '¿No tienes cuenta? Regístrate y obtén 2 picks gratis',
  },
  en: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    email: 'Email',
    password: 'Password',
    enterDashboard: 'Enter dashboard',
    startFree: 'Get started free →',
    forgotPassword: 'Forgot your password?',
    sendInstructions: 'Send instructions',
    freePicksBannerTitle: '2 free picks, no card needed',
    freePicksBannerSub: 'Create your account and choose 2 picks to see the full analysis for free',
    noCardCancelAnytime: 'No credit card · Cancel anytime',
    alreadyHaveAccount: 'Already have an account? Sign in here',
    noAccountYet: "Don't have an account? Sign up and get 2 free picks",
  },
}

export default function Login() {
  const { lang } = useLang()
  const t = T[lang]
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/dashboard')
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Cuenta creada. Revisa tu email para confirmar.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://primepicks.mx/reset-password',
        })
        if (error) throw error
        setSuccess('Te enviamos un email con instrucciones para restablecer tu contraseña.')
      }
    } catch (err) {
      setError(err.message || 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setSuccess('')
  }

  const subtitles = { login: 'Accede a tus picks', signup: 'Crea tu cuenta gratis', forgot: 'Restablece tu contraseña' }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link to="/"><LogoFull height={64} /></Link>
        </div>
        <p className="text-center text-white/40 text-sm -mt-4 mb-8">
          {subtitles[mode]}
        </p>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
          {mode !== 'forgot' && (
            <div className="flex rounded-lg bg-[#0A0A0A] p-1 mb-6">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === m ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {m === 'login' ? t.signIn : t.signUp}
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mb-5"
            >
              ← Volver al login
            </button>
          )}

          {mode === 'signup' && (
            <div className="mb-5 p-4 rounded-xl bg-[#00D964]/10 border border-[#00D964]/30 text-center">
              <div className="text-2xl mb-1">🎁</div>
              <div className="text-white font-bold text-sm mb-1">{t.freePicksBannerTitle}</div>
              <div className="text-white/50 text-xs leading-relaxed">{t.freePicksBannerSub}</div>
            </div>
          )}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="block w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors mb-5"
            >
              {t.noAccountYet}
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{t.password}</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-lg bg-[#00D964]/10 border border-[#00D964]/20 text-[#00D964] text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00D964] text-black font-bold rounded-lg hover:bg-[#00B856] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading
                ? 'Cargando...'
                : mode === 'login'
                  ? t.enterDashboard
                  : mode === 'signup'
                    ? t.startFree
                    : t.sendInstructions}
            </button>

            {mode === 'login' && !success && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors pt-1"
              >
                {t.forgotPassword}
              </button>
            )}
            {mode === 'signup' && !success && (
              <>
                <p className="text-center text-xs text-white/35 pt-1">
                  {t.noCardCancelAnytime}
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors pt-1"
                >
                  {t.alreadyHaveAccount}
                </button>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          <Link to="/" className="hover:text-white/60 transition-colors">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
