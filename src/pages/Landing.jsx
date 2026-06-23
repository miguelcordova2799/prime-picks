import { Link } from 'react-router-dom'
import { TrendingUp, Shield, Zap, CheckCircle, Lock, Star } from 'lucide-react'

const STATS = [
  { label: 'Acierto', value: '67%', sub: 'Últimos 90 días' },
  { label: 'ROI', value: '+18.4%', sub: 'Retorno sobre inversión' },
  { label: 'Picks', value: '240+', sub: 'Picks analizados' },
  { label: 'Racha actual', value: '8W', sub: 'Picks consecutivos' },
]

const FEATURES = [
  { icon: TrendingUp, text: 'Análisis estadístico con edge % real' },
  { icon: Shield, text: 'Picks verificados con historial público' },
  { icon: Zap, text: 'Notificación inmediata al publicar' },
  { icon: Star, text: 'Estrellas de confianza 1–3 por pick' },
]

const TESTIMONIALS = [
  { name: 'Carlos M.', city: 'CDMX', text: 'Llevo 3 meses y mi bankroll creció un 22%. Los análisis son brutales.' },
  { name: 'Rodrigo V.', city: 'Monterrey', text: 'El mejor servicio de picks en México sin duda. ROI real, sin mentiras.' },
  { name: 'Ana L.', city: 'Guadalajara', text: 'Finalmente un tipster transparente. Muestran hasta los picks perdidos.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D964]/6 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#00D964]/4 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D964]/30 bg-[#00D964]/10 text-[#00D964] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D964] animate-pulse" />
            Picks disponibles hoy
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            Apuesta con
            <span className="block text-[#00D964]">inteligencia</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Picks deportivos con análisis real, edge detectado y récord transparente.
            El servicio de tipster premium en México.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-[#00D964] text-black font-bold rounded-xl hover:bg-[#00B856] transition-all hover:scale-105 text-base"
            >
              Ver picks de hoy →
            </Link>
            <a
              href="#pricing"
              className="px-8 py-4 border border-white/20 text-white rounded-xl hover:border-white/40 transition-colors text-base"
            >
              Ver planes
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/8 bg-[#111111]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ label, value, sub }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-[#00D964] mb-1">{value}</div>
                <div className="text-sm font-semibold text-white mb-0.5">{label}</div>
                <div className="text-xs text-white/40">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Por qué <span className="text-[#00D964]">Prime Picks</span>
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            No somos adivinos. Somos analistas. Cada pick tiene el razonamiento detrás.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4 p-5 rounded-xl bg-[#111111] border border-white/8">
              <div className="w-10 h-10 rounded-lg bg-[#00D964]/12 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-[#00D964]" />
              </div>
              <span className="text-white/80 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sample pick preview */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black mb-2">Así se ven los picks</h2>
          <p className="text-white/40 text-sm">Vista real de un pick publicado (suscriptores ven el análisis completo)</p>
        </div>

        <div className="max-w-lg mx-auto rounded-2xl bg-[#111111] border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/8 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40 mb-1">Hoy · 20:00 · Bet365</div>
              <div className="font-bold text-white">Real Madrid vs Barcelona</div>
            </div>
            <div className="flex gap-0.5">
              {[1,2,3].map(i => <Star key={i} size={13} className="fill-[#EF9F27] text-[#EF9F27]" />)}
            </div>
          </div>
          <div className="p-5 grid grid-cols-3 gap-4 border-b border-white/8 text-center">
            <div>
              <div className="text-xs text-white/40 mb-1">Pick</div>
              <div className="text-sm font-bold text-white">Ambos anotan</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Cuota</div>
              <div className="text-sm font-bold text-white/80">1.85</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Edge</div>
              <div className="text-sm font-bold text-[#00D964]">+12.4%</div>
            </div>
          </div>
          <div className="p-5 relative">
            <div className="text-sm text-white/60 leading-relaxed blur-sm select-none">
              El Clásico en fase de grupos de Champions presenta una dinámica ofensiva especial. Ambos equipos necesitan la victoria y han alternado defensas...
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/60 backdrop-blur-[1px]">
              <div className="text-center">
                <Lock size={22} className="text-[#EF9F27] mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">Análisis para suscriptores</div>
                <Link to="/login" className="text-xs text-[#00D964] hover:underline mt-1 block">Suscríbete →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#111111] border-y border-white/8 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Planes y precios</h2>
            <p className="text-white/40">Sin contratos. Sin letra chica. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Monthly */}
            <div className="rounded-2xl bg-[#161616] border border-white/10 p-7 flex flex-col">
              <div className="text-sm text-white/50 mb-2">Mensual</div>
              <div className="text-4xl font-black text-white mb-1">
                $199 <span className="text-lg font-normal text-white/40">MXN</span>
              </div>
              <div className="text-xs text-white/30 mb-6">por mes · renueva automáticamente</div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Todos los picks del día', 'Análisis completo', 'Historial 30 días', 'Soporte por WhatsApp'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle size={15} className="text-[#00D964] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="w-full py-3 rounded-xl border border-[#00D964]/40 text-[#00D964] text-sm font-semibold text-center hover:bg-[#00D964]/8 transition-colors"
              >
                Empezar ahora
              </Link>
            </div>

            {/* World / One-time — gold accent (premium) */}
            <div className="rounded-2xl bg-gradient-to-b from-[#EF9F27]/12 to-[#161616] border border-[#EF9F27]/35 p-7 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#EF9F27] text-black text-xs font-bold rounded-full">
                MEJOR VALOR
              </div>
              <div className="text-sm text-[#EF9F27] mb-2">Mundial · Pago único</div>
              <div className="text-4xl font-black text-white mb-1">
                $299 <span className="text-lg font-normal text-white/40">MXN</span>
              </div>
              <div className="text-xs text-white/30 mb-6">acceso de por vida · un solo pago</div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Todo lo del plan mensual', 'Acceso permanente', 'Historial completo', 'Alertas por email y WhatsApp', 'Grupo VIP de análisis'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle size={15} className="text-[#EF9F27] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-[#00D964] text-black text-sm font-bold text-center hover:bg-[#00B856] transition-colors"
              >
                Quiero acceso vitalicio →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">Lo que dicen los miembros</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, city, text }) => (
            <div key={name} className="p-6 rounded-xl bg-[#111111] border border-white/8">
              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-[#EF9F27] text-[#EF9F27]" />)}
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">"{text}"</p>
              <div className="text-xs text-white/40">{name} · {city}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#111111] border-t border-white/8 py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">¿Listo para apostar mejor?</h2>
          <p className="text-white/40 mb-8">Únete a cientos de apostadores que ya confían en nuestro análisis.</p>
          <Link
            to="/login"
            className="inline-block px-10 py-4 bg-[#00D964] text-black font-bold rounded-xl hover:bg-[#00B856] transition-all hover:scale-105 text-base"
          >
            Comenzar gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 text-center text-white/30 text-xs">
        <p>© 2026 Prime Picks · Servicio de análisis deportivo · México</p>
        <p className="mt-1">Las apuestas deportivas son para mayores de 18 años. Apuesta con responsabilidad.</p>
      </footer>
    </div>
  )
}
