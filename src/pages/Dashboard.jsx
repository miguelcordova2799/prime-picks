import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Stars from '../components/Stars'
import { Lock, TrendingUp, Trophy, Target, ChevronRight } from 'lucide-react'
import { formatOdds } from '../lib/odds'

const RESULT_STYLES = {
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  won: 'bg-[#00D964]/12 text-[#00D964] border border-[#00D964]/25',
  lost: 'bg-red-500/15 text-red-400 border border-red-500/20',
}
const RESULT_LABELS = { pending: 'Pendiente', won: 'Ganado ✓', lost: 'Perdido ✗' }

export default function Dashboard() {
  const { isSubscribed } = useAuth()
  const [picks, setPicks] = useState([])
  const [stats, setStats] = useState({ wins: 0, losses: 0, roi: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPicks()
    fetchStats()
  }, [])

  async function fetchPicks() {
    const { data } = await supabase
      .from('picks')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(20)
    setPicks(data || [])
    setLoading(false)
  }

  async function fetchStats() {
    const { data } = await supabase
      .from('stats')
      .select('*')
      .single()
    if (data) setStats(data)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1">
            Dashboard{' '}
            {!isSubscribed && (
              <span className="text-sm font-normal text-white/30 ml-2">· Plan gratuito</span>
            )}
          </h1>
          <p className="text-white/40 text-sm">
            {isSubscribed ? 'Acceso completo a todos los picks' : 'Suscríbete para ver el análisis completo'}
          </p>
        </div>

        {/* Subscription banner */}
        {!isSubscribed && (
          <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-[#00D964]/12 to-[#00D964]/4 border border-[#00D964]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-white mb-1">Desbloquea todos los picks</div>
              <div className="text-sm text-white/50">Desde $199 MXN/mes · Cancela cuando quieras</div>
            </div>
            <Link
              to="/#pricing"
              className="shrink-0 px-5 py-2.5 bg-[#00D964] text-black text-sm font-bold rounded-lg hover:bg-[#00B856] transition-colors flex items-center gap-1"
            >
              Ver planes <ChevronRight size={15} />
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Trophy} label="Ganados" value={stats.wins} color="text-[#00D964]" />
          <StatCard icon={Target} label="Perdidos" value={stats.losses} color="text-red-400" />
          <StatCard
            icon={TrendingUp}
            label="ROI"
            value={`${Number(stats.roi || 0).toFixed(1)}%`}
            color={Number(stats.roi) >= 0 ? 'text-[#00D964]' : 'text-red-400'}
          />
          <StatCard icon={TrendingUp} label="Total picks" value={stats.total} color="text-white/70" />
        </div>

        {/* Picks list */}
        <div>
          <h2 className="text-lg font-bold mb-4">Picks recientes</h2>
          {picks.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Target size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aún no hay picks publicados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {picks.map(pick => (
                <PickCard key={pick.id} pick={pick} isSubscribed={isSubscribed} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#111111] border border-white/8 rounded-xl p-4">
      <div className="text-white/40 text-xs mb-2">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  )
}

function PickCard({ pick, isSubscribed }) {
  const locked = !isSubscribed
  const [copied, setCopied] = useState(false)
  const date = new Date(pick.published_at)
  const formattedDate = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  function handleShare() {
    const stars = '⭐'.repeat(pick.stars || 3)
    const text = [
      '✅ PICK GANADO — Prime Picks',
      `⚽ ${pick.match_name}`,
      `🎯 Pick: ${pick.pick_text}`,
      `📈 Cuota: ${formatOdds(pick.odds)} | Edge: +${pick.edge}%`,
      stars,
      '🔥 Seguimos sumando. Únete en primepicks.mx',
    ].join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  // Locked: show only match name + upsell, hide all pick details
  if (locked) {
    return (
      <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
        <div className="p-4">
          <div className="text-xs text-white/35 mb-1">{formattedDate} · {pick.bookmaker}</div>
          <div className="font-bold text-white truncate">{pick.match_name}</div>
        </div>
        <div className="border-t border-white/5 px-4 py-5 flex flex-col items-center text-center gap-3">
          <span className="text-xl">🔒</span>
          <p className="text-sm font-semibold text-white">Contenido exclusivo para suscriptores Prime</p>
          <Link
            to="/#pricing"
            className="px-5 py-2 bg-[#00D964] text-black text-xs font-bold rounded-lg hover:bg-[#00B856] transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-white/35 mb-1">{formattedDate} · {pick.bookmaker}</div>
          <div className="font-bold text-white truncate">{pick.match_name}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stars count={pick.stars} />
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RESULT_STYLES[pick.result] || RESULT_STYLES.pending}`}>
            {RESULT_LABELS[pick.result] || 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
        <div>
          <div className="text-xs text-white/35 mb-1">Pick</div>
          <div className="text-sm font-semibold text-white">{pick.pick_text}</div>
        </div>
        <div>
          <div className="text-xs text-white/35 mb-1">Cuota</div>
          <div className="text-sm font-semibold text-white/80">{formatOdds(pick.odds)}</div>
        </div>
        <div>
          <div className="text-xs text-white/35 mb-1">Edge</div>
          <div className="text-sm font-semibold text-[#00D964]">+{pick.edge}%</div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="text-xs text-white/35 mb-2">Análisis</div>
        <p className="text-sm text-white/60 leading-relaxed">{pick.analysis}</p>
      </div>

      {pick.result === 'won' && (
        <div className="px-4 pb-4 relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D964]/15 border border-[#00D964]/30 text-[#00D964] text-xs font-semibold hover:bg-[#00D964]/25 transition-colors"
          >
            📸 Compartir
          </button>
          {copied && (
            <div className="absolute left-4 bottom-full mb-2 px-3 py-2 bg-[#00D964] text-black text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap">
              ¡Copiado! Pégalo en tu historia de Instagram
              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#00D964]" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
