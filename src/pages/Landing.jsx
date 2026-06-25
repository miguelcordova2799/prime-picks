import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TrendingUp, Shield, Zap, Star, CheckCircle, Lock, Target, BookOpen, Newspaper, Users, BarChart2, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatOdds } from '../lib/odds'

/* ── TRANSLATIONS ─────────────────────────────────────────── */
const T = {
  es: {
    // Hero
    heroBadge: 'Picks disponibles hoy',
    heroTitle1: 'Apuesta con',
    heroTitle2: 'inteligencia',
    heroSub: 'Picks deportivos con análisis real, edge detectado y récord transparente. El servicio de tipster premium en México.',
    heroCTA: 'Ver picks de hoy →',
    heroPlans: 'Ver planes',

    // Quiénes somos
    aboutTitle: '¿Quiénes somos?',
    aboutText: 'Prime Picks nació con una misión clara: hacer que apostar sea rentable, inteligente y responsable. No somos adivinos ni vendemos sueños — somos analistas que usan estadística, probabilidad y datos reales para encontrar ventaja real contra las casas de apuestas. Cada pick que publicamos tiene un fundamento matemático detrás: edge detectado, probabilidad calculada y comparación de momios entre múltiples casas. Nuestra única misión es que conviertas las apuestas en un hobby rentable, no en una adicción. Apostamos por el juego responsable, la transparencia total en nuestros resultados y la educación como herramienta principal. Aquí no ganarás siempre — pero aprenderás a apostar mejor que el 99% de la gente.',
    aboutStat1: 'Porcentaje de acierto',
    aboutStat2: 'Retorno sobre inversión',
    aboutStat3: 'Picks analizados',

    // Stats bar
    stats: [
      { label: 'Acierto', sub: 'Últimos 90 días' },
      { label: 'ROI', sub: 'Retorno sobre inversión' },
      { label: 'Picks', sub: 'Picks analizados' },
      { label: 'Racha actual', sub: 'Picks consecutivos' },
    ],

    // Why us
    whyTitle: 'Por qué',
    whySub: 'No somos adivinos. Somos analistas. Cada pick tiene el razonamiento detrás.',
    features: [
      'Análisis estadístico con edge % real',
      'Picks verificados con historial público',
      'Notificación inmediata al publicar',
      'Estrellas de confianza 1–3 por pick',
    ],

    // Services
    servicesTitle: 'Nuestros Servicios',
    servicesSub: 'Todo lo que necesitas para apostar de manera inteligente y rentable.',
    services: [
      { title: 'Picks Diarios', desc: 'Análisis estadístico de cada partido con edge detectado, cuota recomendada y stake sugerido.' },
      { title: 'Prime Academy', desc: 'Aprende a leer estadísticas, identificar value bets, manejar tu bankroll y pensar como un apostador profesional.' },
      { title: 'Noticias Deportivas', desc: 'Cobertura diaria del Mundial 2026 y las principales ligas. Información que impacta las líneas antes que nadie.' },
      { title: 'Comunidad VIP', desc: 'Acceso a un grupo privado de apostadores serios donde se discuten estrategias, picks y oportunidades en tiempo real.' },
    ],

    // Pick preview
    pickPreviewTitle: 'Así se ven los picks',
    pickPreviewSub: 'Vista real de un pick publicado (suscriptores ven el análisis completo)',
    pickDate: 'Hoy · 20:00 · Bet365',
    pickMatch: 'Real Madrid vs Barcelona',
    pickLabel: 'Pick',
    oddsLabel: 'Cuota',
    edgeLabel: 'Edge',
    analysisLabel: 'Análisis',
    pickValue: 'Ambos anotan',
    analysisBlur: 'El Clásico en fase de grupos de Champions presenta una dinámica ofensiva especial. Ambos equipos necesitan la victoria...',
    lockedLabel: 'Análisis para suscriptores',
    lockedCTA: 'Suscríbete →',

    // Pricing
    pricingTitle: 'Planes y precios',
    pricingSub: 'Sin contratos. Sin letra chica. Cancela cuando quieras.',
    popular: 'Más popular',
    perMonth: '/mes',
    oneTime: 'pago único',
    planCTA: 'Empezar ahora',
    plans: [
      {
        name: 'Prime Starter',
        price: '$149',
        period: 'mes',
        one_time: false,
        desc: 'Para el apostador que está empezando. 1-2 picks semanales con análisis básico y acceso a noticias.',
        features: ['1-2 picks semanales', 'Análisis básico', 'Acceso a noticias', 'Soporte por WhatsApp'],
        highlight: false,
        gold: false,
      },
      {
        name: 'Prime Plus',
        price: '$349',
        period: 'mes',
        one_time: false,
        desc: 'Picks diarios con análisis completo, edge detectado, alertas antes del partido y historial de ROI en tiempo real.',
        features: ['Picks diarios', 'Análisis completo con edge', 'Alertas pre-partido', 'Historial de ROI en tiempo real', 'Soporte prioritario'],
        highlight: true,
        gold: false,
      },
      {
        name: 'Prime Academy',
        price: '$599',
        period: 'mes',
        one_time: false,
        desc: 'Todo lo anterior más curso completo de bankroll, guías de value betting, psicología del apostador y grupo VIP privado.',
        features: ['Todo Prime Plus', 'Curso completo de bankroll', 'Guías de value betting', 'Psicología del apostador', 'Grupo VIP privado'],
        highlight: false,
        gold: false,
      },
      {
        name: 'Mundial 2026',
        price: '$499',
        period: '',
        one_time: true,
        desc: 'Acceso completo durante todo el torneo. Picks de cada partido, análisis especial y cobertura exclusiva del Mundial.',
        features: ['Picks de cada partido', 'Análisis especial del torneo', 'Cobertura exclusiva', 'Acceso por todo el Mundial'],
        highlight: false,
        gold: true,
      },
    ],

    // Testimonials
    testimonialsTitle: 'Lo que dicen los miembros',
    testimonials: [
      { name: 'Carlos M.', city: 'CDMX', text: 'Llevo 3 meses y mi bankroll creció un 22%. Los análisis son brutales.' },
      { name: 'Rodrigo V.', city: 'Monterrey', text: 'El mejor servicio de picks en México sin duda. ROI real, sin mentiras.' },
      { name: 'Ana L.', city: 'Guadalajara', text: 'Finalmente un tipster transparente. Muestran hasta los picks perdidos.' },
    ],

    // CTA
    ctaTitle: '¿Listo para apostar mejor?',
    ctaSub: 'Únete a cientos de apostadores que ya confían en nuestro análisis.',
    ctaBtn: 'Comenzar gratis →',

    // Responsible gambling
    rgTitle: 'Juega Responsable',
    rgText: 'Las apuestas son entretenimiento, no una fuente de ingresos garantizada. Nunca apuestes más de lo que puedes perder. Si sientes que el juego está afectando tu vida, busca ayuda.',

    // Footer
    footerLinks: ['Noticias', 'Picks', 'Academia', 'Contacto'],
    footerCopy: '© 2026 Prime Picks. Todos los derechos reservados.',
  },

  en: {
    heroBadge: "Today's picks available",
    heroTitle1: 'Bet with',
    heroTitle2: 'intelligence',
    heroSub: 'Sports picks with real analysis, detected edge, and transparent records. The premium tipster service in Mexico.',
    heroCTA: "See today's picks →",
    heroPlans: 'See plans',

    aboutTitle: 'Who We Are',
    aboutText: "Prime Picks was built with one clear mission: make sports betting profitable, intelligent, and responsible. We're not fortune tellers and we don't sell dreams — we're analysts who use statistics, probability, and real data to find a genuine edge against the bookmakers. Every pick we publish has mathematical reasoning behind it: detected edge, calculated probability, and odds comparison across multiple sportsbooks. Our only mission is to help you turn betting into a profitable hobby, not an addiction. We believe in responsible gambling, full transparency in our results, and education as the primary tool. You won't win every bet here — but you'll learn to bet smarter than 99% of people.",
    aboutStat1: 'Hit rate',
    aboutStat2: 'Return on investment',
    aboutStat3: 'Picks analyzed',

    stats: [
      { label: 'Hit Rate', sub: 'Last 90 days' },
      { label: 'ROI', sub: 'Return on investment' },
      { label: 'Picks', sub: 'Picks analyzed' },
      { label: 'Current streak', sub: 'Consecutive picks' },
    ],

    whyTitle: 'Why',
    whySub: "We're not fortune tellers. We're analysts. Every pick has reasoning behind it.",
    features: [
      'Statistical analysis with real edge %',
      'Verified picks with public history',
      'Immediate notification when published',
      'Confidence stars 1–3 per pick',
    ],

    servicesTitle: 'Our Services',
    servicesSub: 'Everything you need to bet intelligently and profitably.',
    services: [
      { title: 'Daily Picks', desc: 'Statistical analysis of every game with detected edge, recommended odds, and suggested stake.' },
      { title: 'Prime Academy', desc: 'Learn to read statistics, identify value bets, manage your bankroll, and think like a professional bettor.' },
      { title: 'Sports News', desc: 'Daily coverage of the 2026 World Cup and major leagues. Information that moves the lines before anyone else.' },
      { title: 'VIP Community', desc: 'Access to a private group of serious bettors where strategies, picks, and opportunities are discussed in real time.' },
    ],

    pickPreviewTitle: 'What picks look like',
    pickPreviewSub: 'Real view of a published pick (subscribers see the full analysis)',
    pickDate: 'Today · 8:00 PM · Bet365',
    pickMatch: 'Real Madrid vs Barcelona',
    pickLabel: 'Pick',
    oddsLabel: 'Odds',
    edgeLabel: 'Edge',
    analysisLabel: 'Analysis',
    pickValue: 'Both to score',
    analysisBlur: 'El Clásico in the Champions League group stage presents a special offensive dynamic. Both teams need the win...',
    lockedLabel: 'Analysis for subscribers',
    lockedCTA: 'Subscribe →',

    pricingTitle: 'Plans & pricing',
    pricingSub: 'No contracts. No fine print. Cancel anytime.',
    popular: 'Most popular',
    perMonth: '/mo',
    oneTime: 'one-time',
    planCTA: 'Get started',
    plans: [
      {
        name: 'Prime Starter',
        price: '$149',
        period: 'mo',
        one_time: false,
        desc: 'For the bettor just getting started. 1-2 weekly picks with basic analysis and news access.',
        features: ['1-2 weekly picks', 'Basic analysis', 'News access', 'WhatsApp support'],
        highlight: false,
        gold: false,
      },
      {
        name: 'Prime Plus',
        price: '$349',
        period: 'mo',
        one_time: false,
        desc: 'Daily picks with full analysis, detected edge, pre-game alerts, and real-time ROI history.',
        features: ['Daily picks', 'Full analysis with edge', 'Pre-game alerts', 'Real-time ROI history', 'Priority support'],
        highlight: true,
        gold: false,
      },
      {
        name: 'Prime Academy',
        price: '$599',
        period: 'mo',
        one_time: false,
        desc: 'Everything above plus full bankroll course, value betting guides, bettor psychology, and private VIP group.',
        features: ['Everything in Prime Plus', 'Full bankroll course', 'Value betting guides', 'Bettor psychology', 'Private VIP group'],
        highlight: false,
        gold: false,
      },
      {
        name: 'World Cup 2026',
        price: '$499',
        period: '',
        one_time: true,
        desc: 'Full access for the entire tournament. Picks for every game, special analysis, and exclusive World Cup coverage.',
        features: ['Picks for every game', 'Special tournament analysis', 'Exclusive coverage', 'Access all tournament long'],
        highlight: false,
        gold: true,
      },
    ],

    testimonialsTitle: 'What members say',
    testimonials: [
      { name: 'Carlos M.', city: 'CDMX', text: "3 months in and my bankroll grew 22%. The analysis is outstanding." },
      { name: 'Rodrigo V.', city: 'Monterrey', text: 'Best picks service in Mexico, no doubt. Real ROI, no lies.' },
      { name: 'Ana L.', city: 'Guadalajara', text: 'Finally a transparent tipster. They show even the losing picks.' },
    ],

    ctaTitle: 'Ready to bet smarter?',
    ctaSub: 'Join hundreds of bettors who already trust our analysis.',
    ctaBtn: 'Get started free →',

    rgTitle: 'Gamble Responsibly',
    rgText: "Betting is entertainment, not a guaranteed income source. Never bet more than you can afford to lose. If you feel gambling is affecting your life, please seek help.",

    footerLinks: ['News', 'Picks', 'Academy', 'Contact'],
    footerCopy: '© 2026 Prime Picks. All rights reserved.',
  },
}

const SERVICE_ICONS = [Target, BookOpen, Newspaper, Users]

/* ── LIVE STATS FROM SUPABASE ──────────────────────────────── */
function usePickStats() {
  const [stats, setStats] = useState({ hitRate: null, roi: null, total: null, streak: null })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('picks')
        .select('result, odds')
        .order('published_at', { ascending: false })

      if (!data || data.length === 0) return

      const resolved = data.filter(p => p.result !== 'pending')
      const won = resolved.filter(p => p.result === 'won')
      const lost = resolved.filter(p => p.result === 'lost')

      const hitRate = resolved.length > 0
        ? Math.round((won.length / resolved.length) * 100)
        : null

      const roiRaw = resolved.length > 0
        ? ((won.reduce((s, p) => s + (parseFloat(p.odds) - 1), 0) - lost.length) / resolved.length) * 100
        : null
      const roi = roiRaw !== null ? Math.round(roiRaw * 10) / 10 : null

      // Consecutive wins from most recent resolved pick
      let streak = 0
      for (const p of data) {
        if (p.result === 'pending') continue
        if (p.result === 'won') streak++
        else break
      }

      setStats({ hitRate, roi, total: data.length, streak })
    }
    load()
  }, [])

  return stats
}

/* ── COMPONENT ────────────────────────────────────────────── */
export default function Landing() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('pp_lang') || 'es' } catch { return 'es' }
  })

  useEffect(() => {
    const handler = (e) => setLang(e.detail)
    window.addEventListener('pp:langchange', handler)
    return () => window.removeEventListener('pp:langchange', handler)
  }, [])

  const { hitRate, roi, total, streak } = usePickStats()

  const fmtHit    = hitRate !== null ? `${hitRate}%`                        : '—'
  const fmtRoi    = roi     !== null ? `${roi >= 0 ? '+' : ''}${roi}%`     : '—'
  const fmtTotal  = total   !== null && total > 0 ? `${total}`              : '—'
  const fmtStreak = streak  > 0 ? `${streak}W`                              : '—'

  const STAT_LIVE = [fmtHit, fmtRoi, fmtTotal, fmtStreak]

  const t = T[lang]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D964]/6 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#00D964]/4 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 pt-16 pb-16 text-center">
          <div className="flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="Prime Picks"
              className="w-[280px] md:w-[340px] h-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 24px rgba(0, 217, 100, 0.3))' }}
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D964]/30 bg-[#00D964]/10 text-[#00D964] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D964] animate-pulse" />
            {t.heroBadge}
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            {t.heroTitle1}
            <span className="block text-[#00D964]">{t.heroTitle2}</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="px-8 py-4 bg-[#00D964] text-black font-bold rounded-xl hover:bg-[#00B856] transition-all hover:scale-105 text-base">
              {t.heroCTA}
            </Link>
            <a href="#pricing" className="px-8 py-4 border border-white/20 text-white rounded-xl hover:border-white/40 transition-colors text-base">
              {t.heroPlans}
            </a>
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section className="bg-[#111111] border-y border-white/8">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: visual stats card */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 space-y-0">
              <div className="pb-6">
                <div className="text-5xl font-black text-[#00D964]">{fmtHit}</div>
                <div className="text-sm text-white/40 mt-1">{t.aboutStat1}</div>
              </div>
              <div className="border-t border-white/8 py-6">
                <div className="text-5xl font-black text-[#00D964]">{fmtRoi}</div>
                <div className="text-sm text-white/40 mt-1">{t.aboutStat2}</div>
              </div>
              <div className="border-t border-white/8 pt-6">
                <div className="text-5xl font-black text-white">{fmtTotal}</div>
                <div className="text-sm text-white/40 mt-1">{t.aboutStat3}</div>
              </div>
            </div>

            {/* Right: text */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                {t.aboutTitle}
              </h2>
              <p className="text-white/60 leading-relaxed text-base">
                {t.aboutText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {t.stats.map(({ label, sub }, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-[#00D964] mb-1">{STAT_LIVE[i]}</div>
                <div className="text-sm font-semibold text-white mb-0.5">{label}</div>
                <div className="text-xs text-white/40">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {t.whyTitle} <span className="text-[#00D964]">Prime Picks</span>
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">{t.whySub}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {t.features.map((text, i) => {
            const icons = [TrendingUp, Shield, Zap, Star]
            const Icon = icons[i]
            return (
              <div key={i} className="flex items-center gap-4 p-5 rounded-xl bg-[#111111] border border-white/8">
                <div className="w-10 h-10 rounded-lg bg-[#00D964]/12 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#00D964]" />
                </div>
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section className="bg-[#111111] border-y border-white/8 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">{t.servicesTitle}</h2>
            <p className="text-white/40 text-base max-w-lg mx-auto">{t.servicesSub}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.services.map(({ title, desc }, i) => {
              const Icon = SERVICE_ICONS[i]
              return (
                <div key={i} className="bg-[#161616] border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#00D964]/25 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#00D964]/12 flex items-center justify-center">
                    <Icon size={24} className="text-[#00D964]" />
                  </div>
                  <div>
                    <div className="font-bold text-white mb-2">{title}</div>
                    <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PICK PREVIEW ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black mb-2">{t.pickPreviewTitle}</h2>
          <p className="text-white/40 text-sm">{t.pickPreviewSub}</p>
        </div>

        <div className="max-w-lg mx-auto rounded-2xl bg-[#111111] border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/8 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40 mb-1">{t.pickDate}</div>
              <div className="font-bold text-white">{t.pickMatch}</div>
            </div>
            <div className="flex gap-0.5">
              {[1,2,3].map(i => <Star key={i} size={13} className="fill-[#EF9F27] text-[#EF9F27]" />)}
            </div>
          </div>
          <div className="p-5 grid grid-cols-3 gap-4 border-b border-white/8 text-center">
            <div>
              <div className="text-xs text-white/40 mb-1">{t.pickLabel}</div>
              <div className="text-sm font-bold text-white">{t.pickValue}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">{t.oddsLabel}</div>
              <div className="text-sm font-bold text-white/80">{formatOdds(1.85)}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">{t.edgeLabel}</div>
              <div className="text-sm font-bold text-[#00D964]">+12.4%</div>
            </div>
          </div>
          <div className="p-5 relative">
            <div className="text-sm text-white/60 leading-relaxed blur-sm select-none">
              {t.analysisBlur}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/60 backdrop-blur-[1px]">
              <div className="text-center">
                <Lock size={22} className="text-[#EF9F27] mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">{t.lockedLabel}</div>
                <Link to="/login" className="text-xs text-[#00D964] hover:underline mt-1 block">{t.lockedCTA}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-[#111111] border-y border-white/8 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">{t.pricingTitle}</h2>
            <p className="text-white/40">{t.pricingSub}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#111111] border-t border-white/8 py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">{t.ctaTitle}</h2>
          <p className="text-white/40 mb-8">{t.ctaSub}</p>
          <Link to="/login" className="inline-block px-10 py-4 bg-[#00D964] text-black font-bold rounded-xl hover:bg-[#00B856] transition-all hover:scale-105 text-base">
            {t.ctaBtn}
          </Link>
        </div>
      </section>

      {/* ── JUEGO RESPONSABLE ── */}
      <section className="border-t border-white/8 py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{t.rgTitle}</span>
          </div>
          <p className="text-white/35 text-sm leading-relaxed">{t.rgText}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 bg-[#111111]">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src="/logo.png" alt="Prime Picks" className="h-9 object-contain opacity-80" />

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {t.footerLinks.map((link, i) => {
                const hrefs = ['/noticias', '/dashboard', '/dashboard', '/login']
                return (
                  <Link key={i} to={hrefs[i]} className="text-sm text-white/40 hover:text-white transition-colors">
                    {link}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="border-t border-white/8 mt-8 pt-6 text-center text-white/25 text-xs">
            {t.footerCopy}
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── PLAN CARD ── */
function PlanCard({ plan, t }) {
  const { name, price, period, one_time, desc, features, highlight, gold } = plan

  const borderClass = highlight
    ? 'border-[#00D964]/50'
    : gold
      ? 'border-[#EF9F27]/35'
      : 'border-white/10'

  const bgClass = highlight
    ? 'bg-gradient-to-b from-[#00D964]/10 to-[#161616]'
    : gold
      ? 'bg-gradient-to-b from-[#EF9F27]/10 to-[#161616]'
      : 'bg-[#161616]'

  const checkColor = highlight
    ? 'text-[#00D964]'
    : gold
      ? 'text-[#EF9F27]'
      : 'text-[#00D964]'

  const ctaClass = highlight
    ? 'bg-[#00D964] text-black hover:bg-[#00B856]'
    : gold
      ? 'bg-[#EF9F27] text-black hover:bg-[#D4891A]'
      : 'border border-[#00D964]/40 text-[#00D964] hover:bg-[#00D964]/8'

  const badge = highlight ? t.popular : gold ? (t.plans.find(p => p.gold)?.name || name) : null

  return (
    <div className={`relative rounded-2xl ${bgClass} border ${borderClass} p-6 flex flex-col`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00D964] text-black text-xs font-bold rounded-full whitespace-nowrap">
          {t.popular}
        </div>
      )}
      {gold && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#EF9F27] text-black text-xs font-bold rounded-full whitespace-nowrap">
          🏆 {name}
        </div>
      )}

      <div className="mb-4 mt-2">
        {!gold && <div className="text-sm text-white/50 mb-2">{name}</div>}
        {gold && <div className="h-5 mb-2" />}
        <div className="text-3xl font-black text-white">
          {price}
          {period && <span className="text-base font-normal text-white/40"> MXN/{period}</span>}
          {one_time && <span className="text-base font-normal text-white/40"> MXN</span>}
        </div>
        {one_time && <div className="text-xs text-white/30 mt-0.5">{t.oneTime}</div>}
      </div>

      <p className="text-xs text-white/50 leading-relaxed mb-5">{desc}</p>

      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-white/70">
            <CheckCircle size={13} className={`${checkColor} shrink-0 mt-0.5`} />
            {f}
          </li>
        ))}
      </ul>

      <Link to="/login" className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${ctaClass}`}>
        {t.planCTA}
      </Link>
    </div>
  )
}
