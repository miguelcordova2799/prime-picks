import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Mail, Send } from 'lucide-react'

export default function Contacto() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    nombre: profile?.nombre || user?.email?.split('@')[0] || '',
    email:  user?.email || '',
    mensaje: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.mensaje.trim()) return
    setSending(true)
    setError('')

    const payload = {
      mensaje: form.mensaje.trim(),
      nombre:  form.nombre.trim()  || null,
      email:   form.email.trim()   || null,
      user_id: user ? user.id : null,
    }

    const { error: err } = await supabase.from('mensajes').insert(payload)

    setSending(false)
    if (err) {
      // Show the real Supabase error so it's diagnosable
      setError(`Error (${err.code || 'unknown'}): ${err.message || JSON.stringify(err)}`)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-xl mx-auto px-4 py-16">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00D964]/15 border border-[#00D964]/25 flex items-center justify-center">
            <Mail size={18} className="text-[#00D964]" />
          </div>
          <h1 className="text-2xl font-black">Contacto</h1>
        </div>
        <p className="text-white/40 text-sm mb-10 ml-[52px]">
          ¿Tienes preguntas sobre el servicio? Escríbenos y te respondemos pronto.
        </p>

        {sent ? (
          <div className="bg-[#111111] border border-[#00D964]/25 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-black text-white mb-2">¡Mensaje enviado!</h2>
            <p className="text-white/50 text-sm mb-6">Te responderemos pronto.</p>
            <Link
              to="/"
              className="inline-block px-7 py-2.5 bg-[#00D964] text-black font-bold rounded-lg hover:bg-[#00B856] transition-colors text-sm"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#111111] border border-white/8 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => field('nombre', e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => field('email', e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">Mensaje *</label>
              <textarea
                value={form.mensaje}
                onChange={e => field('mensaje', e.target.value)}
                required
                rows={5}
                placeholder="¿En qué podemos ayudarte?"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !form.mensaje.trim()}
              className="w-full py-3 bg-[#00D964] text-black font-bold rounded-lg hover:bg-[#00B856] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {sending ? (
                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Enviando...</>
              ) : (
                <><Send size={15} /> Enviar mensaje</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
