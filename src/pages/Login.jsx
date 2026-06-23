import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogoFull } from '../components/Logo'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
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
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Cuenta creada. Revisa tu email para confirmar.')
      }
    } catch (err) {
      setError(err.message || 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link to="/"><LogoFull /></Link>
        </div>
        <p className="text-center text-white/40 text-sm -mt-4 mb-8">
          {mode === 'login' ? 'Accede a tus picks' : 'Crea tu cuenta gratis'}
        </p>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex rounded-lg bg-[#0A0A0A] p-1 mb-6">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === m ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Contraseña</label>
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
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar al dashboard' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          <Link to="/" className="hover:text-white/60 transition-colors">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
