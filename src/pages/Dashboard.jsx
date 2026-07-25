import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useAppSettings } from '../context/AppSettingsContext'
import { useLang } from '../context/LanguageContext'
import { Lock, TrendingUp, Trophy, Target, ChevronRight, X, Download, LayoutDashboard, Receipt } from 'lucide-react'
import { formatOdds } from '../lib/odds'

const DASH_T = {
  es: {
    recentPicks: 'Picks recientes',
    won: 'Ganados',
    lost: 'Perdidos',
    push: 'Push',
    utility: 'Utilidad',
    totalPicks: 'Total picks',
    all: 'Todos',
    unlockAll: 'Desbloquea todos los picks',
    usedFreePicksLead: (n) => `✓ Ya usaste tus ${n} picks gratis — suscríbete por `,
    subscribeSuffix: ' para ver todos',
    perMonth: '/mes',
    picksHistory: 'Historial de picks',
    exclusiveContent: 'Contenido exclusivo para suscriptores Prime',
  },
  en: {
    recentPicks: 'Recent picks',
    won: 'Won',
    lost: 'Lost',
    push: 'Push',
    utility: 'Utility',
    totalPicks: 'Total picks',
    all: 'All',
    unlockAll: 'Unlock all picks',
    usedFreePicksLead: (n) => `✓ You've used your ${n} free picks — subscribe for `,
    subscribeSuffix: ' to see them all',
    perMonth: '/mo',
    picksHistory: 'Picks history',
    exclusiveContent: 'Exclusive content for Prime subscribers',
  },
}

const RESULT_STYLES = {
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  won:     'bg-[#00D964]/12 text-[#00D964] border border-[#00D964]/25',
  lost:    'bg-red-500/15 text-red-400 border border-red-500/20',
  push:    'bg-amber-500/15 text-amber-400 border border-amber-500/20',
}
const RESULT_LABELS = { pending: 'Pendiente', won: 'Ganado ✓', lost: 'Perdido ✗', push: 'Push ↩️' }

// Format a UTC ISO string to CDMX local time: "24 jun · 7:00 PM"
function fmtCDMX(iso) {
  const d = new Date(iso)
  const tz = 'America/Mexico_City'
  const day = d.toLocaleDateString('es-MX', { timeZone: tz, day: 'numeric', month: 'short' })
    .replace(' de ', ' ').replace('.', '')
  const time = d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} · ${time}`
}

// "YYYY-MM" key for a pick's published_at, in CDMX local time
function monthKeyOf(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit' })
}

// "YYYY-MM" -> "Jul 2026"
function monthLabelOf(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  const label = d.toLocaleDateString('es-MX', { timeZone: 'UTC', month: 'short', year: 'numeric' }).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}


export default function Dashboard() {
  const { user, profile, loading: authLoading, isSubscribed, hasFullAccess } = useAuth()
  const { settings } = useAppSettings()
  const { lang } = useLang()
  const dt = DASH_T[lang]
  const trialLimit = parseInt(settings?.trial_picks || '2', 10)
  const planPriceDyn = settings?.plan_precio ? `$${settings.plan_precio}` : '$899'
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)

  // null = still determining (blocks render until Supabase confirms), [] = full access
  const [trialPickIds, setTrialPickIds] = useState(null)
  const [trialSaveError, setTrialSaveError] = useState('')

  // null = "no explicit selection yet" -> defaults to the most recent month once picks load
  const [selectedMonth, setSelectedMonth] = useState(null)

  useEffect(() => {
    fetchPicks()
  }, [])

  const availableMonths = useMemo(() => {
    const map = new Map()
    picks.forEach(p => {
      const key = monthKeyOf(p.published_at)
      if (!map.has(key)) map.set(key, monthLabelOf(key))
    })
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }))
  }, [picks])

  const effectiveMonth = selectedMonth ?? (availableMonths[0]?.key ?? 'all')

  const filteredPicks = useMemo(() => (
    effectiveMonth === 'all' ? picks : picks.filter(p => monthKeyOf(p.published_at) === effectiveMonth)
  ), [picks, effectiveMonth])

  const filteredStats = useMemo(() => {
    const resolved = filteredPicks.filter(p => ['won', 'lost', 'push'].includes(p.result))
    const wins = resolved.filter(p => p.result === 'won').length
    const losses = resolved.filter(p => p.result === 'lost').length
    const pushes = resolved.filter(p => p.result === 'push').length
    const utility = resolved.reduce((sum, p) => {
      const stake = parseFloat(p.stake_percent) || 2
      if (p.result === 'won') return sum + stake * (parseFloat(p.odds) - 1)
      if (p.result === 'lost') return sum - stake
      return sum // push: +0
    }, 0)
    return { wins, losses, pushes, utility: Math.round(utility * 100) / 100, total: wins + losses + pushes }
  }, [filteredPicks])

  const filteredHistory = useMemo(() => (
    filteredPicks.filter(p => ['won', 'lost', 'push'].includes(p.result))
  ), [filteredPicks])

  // Read trial_pick_ids DIRECTLY from Supabase every mount — never rely on cached profile.
  // This guarantees reload always shows the correct unlocked picks.
  useEffect(() => {
    if (authLoading || loading || !user) return
    if (hasFullAccess) { setTrialPickIds([]); return }
    fetchTrialIds()
  }, [authLoading, loading, user, hasFullAccess])

  async function fetchTrialIds() {
    const { data, error } = await supabase
      .from('profiles')
      .select('trial_pick_ids')
      .eq('id', user.id)
      .single()

    if (error) {
      // Column may not exist yet — default to empty (no picks unlocked)
      setTrialPickIds([])
      return
    }

    const saved = data?.trial_pick_ids
    if (saved) {
      try { setTrialPickIds(JSON.parse(saved)) } catch { setTrialPickIds([]) }
    } else {
      setTrialPickIds([])
    }
  }

  async function unlockPick(pickId) {
    const newIds = [...trialPickIds, pickId]
    // Optimistic update
    setTrialPickIds(newIds)
    setTrialSaveError('')

    const { error } = await supabase
      .from('profiles')
      .update({
        trial_pick_ids: JSON.stringify(newIds),
        picks_viewed:   newIds.length,
      })
      .eq('id', user.id)

    if (error) {
      // Revert — save failed (most likely missing RLS UPDATE policy)
      setTrialPickIds(trialPickIds)
      setTrialSaveError(`No se pudo guardar el pick desbloqueado: ${error.message}`)
    }
  }

  async function fetchPicks() {
    const { data } = await supabase
      .from('picks')
      .select('*')
      .order('published_at', { ascending: false })
    setPicks(data || [])
    setLoading(false)
  }

  // Block render until picks, auth, and trial assignment are all confirmed.
  // trialPickIds === null means we haven't decided which picks are free yet.
  if (loading || authLoading || trialPickIds === null) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-display relative isolate">
      <div aria-hidden className="absolute inset-0 -z-10 page-ambient-bg" />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <LayoutDashboard size={22} className="text-[#00D964]" />
            Dashboard{' '}
            {!hasFullAccess && (
              <span className="text-[10px] font-mono-label uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/40 ml-1">Plan gratuito</span>
            )}
          </h1>
          <p className="text-white/40 text-sm">
            {hasFullAccess ? 'Acceso completo a todos los picks' : 'Suscríbete para ver el análisis completo'}
          </p>
        </div>

        {/* Subscription banner */}
        {!hasFullAccess && (
          <div className="mb-6 p-6 rounded-2xl glass-card premium-glow border border-[#00D964]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-white mb-1">{dt.unlockAll}</div>
              <div className="text-sm text-white/50">$899 MXN/mes · Cancela cuando quieras</div>
            </div>
            <Link
              to="/#pricing"
              className="shrink-0 px-5 py-2.5 bg-[#00D964] text-black text-sm font-bold rounded-lg hover:bg-[#00B856] active:scale-95 transition-all flex items-center gap-1"
            >
              Ver planes <ChevronRight size={15} />
            </Link>
          </div>
        )}

        {/* Month selector — filters stats, picks list, and history together */}
        {availableMonths.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedMonth('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border active:scale-95 ${
                effectiveMonth === 'all'
                  ? 'bg-[#00D964]/15 border-[#00D964] text-[#00D964]'
                  : 'bg-[#111111] border-white/10 text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              {dt.all}
            </button>
            {availableMonths.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedMonth(key)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border active:scale-95 ${
                  effectiveMonth === key
                    ? 'bg-[#00D964]/15 border-[#00D964] text-[#00D964]'
                    : 'bg-[#111111] border-white/10 text-white/50 hover:text-white hover:border-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard icon={Trophy} label={dt.won} value={filteredStats.wins} color="text-[#00D964]" />
          <StatCard icon={Target} label={dt.lost} value={filteredStats.losses} color="text-red-400" />
          <StatCard icon={TrendingUp} label={`${dt.push} ↩️`} value={filteredStats.pushes ?? 0} color="text-amber-400" />
          <StatCard
            icon={TrendingUp}
            label={dt.utility}
            value={`${filteredStats.utility >= 0 ? '+' : ''}${Number(filteredStats.utility).toFixed(2)}%`}
            color={filteredStats.utility >= 0 ? 'text-[#00D964]' : 'text-red-400'}
            glow
          />
          <StatCard icon={TrendingUp} label={dt.totalPicks} value={filteredStats.total} color="text-white/70" />
        </div>

        {/* Picks list */}
        <div>
          <h2 className="text-lg font-bold mb-4">{dt.recentPicks}</h2>

          {/* RLS save error — shown when unlockPick fails to persist */}
          {trialSaveError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠️ {trialSaveError} — <span className="text-white/50">El administrador debe agregar la política RLS: <code className="text-xs bg-white/5 px-1 rounded">CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);</code></span>
            </div>
          )}

          {/* Trial status banner */}
          {!hasFullAccess && (
            trialPickIds.length < trialLimit ? (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[#00D964]/8 border border-[#00D964]/20">
                <p className="text-sm text-[#00D964] font-medium">
                  🎁 Te {trialPickIds.length === 0 ? 'quedan' : 'queda'}{' '}
                  <span className="font-bold">{trialLimit - trialPickIds.length}</span>{' '}
                  pick{trialLimit - trialPickIds.length !== 1 ? 's' : ''} gratis de prueba — elige cuál desbloquear
                </p>
              </div>
            ) : (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[#111111] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-white/60">
                  {dt.usedFreePicksLead(trialLimit)}<span className="text-white font-semibold">{planPriceDyn}{dt.perMonth}</span>{dt.subscribeSuffix}
                </p>
                <Link to="/#pricing" className="shrink-0 text-xs font-bold text-[#00D964] hover:underline whitespace-nowrap">
                  Ver plan →
                </Link>
              </div>
            )
          )}

          {trialPickIds === null ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : picks.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Target size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aún no hay picks publicados</p>
            </div>
          ) : filteredPicks.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Target size={40} className="mx-auto mb-3 opacity-30" />
              <p>No hay picks en este período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPicks.map(pick => (
                <PickCard
                  key={pick.id}
                  pick={pick}
                  isSubscribed={hasFullAccess}
                  trialPickIds={trialPickIds}
                  trialLimit={trialLimit}
                  onUnlock={unlockPick}
                  watermarkText={user?.email || ''}
                />
              ))}
            </div>
          )}
        </div>

        {/* History table */}
        <HistoryTable history={filteredHistory} isSubscribed={hasFullAccess} />

      </div>

    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, glow = false }) {
  return (
    <div className={`glass-card ${glow ? 'premium-glow' : ''} border border-white/8 rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.2em] font-mono-label font-bold text-white/40">{label}</div>
        <Icon size={14} className="text-white/30" />
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  )
}

function PickCard({ pick, isSubscribed, trialPickIds, trialLimit = 2, onUnlock, watermarkText = '' }) {
  const { lang } = useLang()
  const dt = DASH_T[lang]
  const alreadyUnlocked = isSubscribed || pick.is_free || (Array.isArray(trialPickIds) && trialPickIds.includes(pick.id))
  const isPending = pick.result === 'pending'
  const trialsLeft = trialLimit - (Array.isArray(trialPickIds) ? trialPickIds.length : 0)
  const canUnlock = !alreadyUnlocked && isPending && trialsLeft > 0
  const locked = !alreadyUnlocked
  const [showShare, setShowShare] = useState(false)

  const stake = parseFloat(pick.stake_percent) || 2
  const utility = pick.result === 'won'
    ? stake * (parseFloat(pick.odds) - 1)
    : pick.result === 'lost'
    ? -stake
    : pick.result === 'push'
    ? 0
    : null

  if (locked) {
    return (
      <div className="glass-card border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-4">
          <div className="text-xs text-white/35 mb-1">{fmtCDMX(pick.published_at)} · {pick.bookmaker}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{pick.match_name}</span>
            {pick.is_parlay && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                🔗 PARLAY
              </span>
            )}
            {pick.is_combined && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                🎯 COMBINADA
              </span>
            )}
          </div>
        </div>
        <div className="border-t border-white/5 px-4 py-5 flex flex-col items-center text-center gap-3">
          <div className="w-10 h-10 rounded-full glass-card border border-white/10 flex items-center justify-center">
            <Lock size={16} className="text-white/50" />
          </div>
          {canUnlock ? (
            <>
              <p className="text-sm text-white/70">Pick pendiente — puedes verlo gratis</p>
              <button
                onClick={() => onUnlock(pick.id)}
                className="px-5 py-2 bg-[#00D964] text-black text-xs font-bold rounded-lg hover:bg-[#00B856] active:scale-95 transition-all"
              >
                🔓 Desbloquear gratis (te {trialsLeft === 1 ? 'queda' : 'quedan'} {trialsLeft})
              </button>
            </>
          ) : isPending ? (
            <>
              <p className="text-sm font-semibold text-white">Ya usaste tus {trialLimit} picks de prueba gratis</p>
              <p className="text-xs text-white/40 mb-1">Suscríbete para ver todos los picks pendientes</p>
              <Link to="/#pricing" className="px-5 py-2 bg-[#00D964] text-black text-xs font-bold rounded-lg hover:bg-[#00B856] active:scale-95 transition-all">
                Ver planes
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-white">{dt.exclusiveContent}</p>
              <p className="text-xs text-white/40">$899 MXN/mes · Cancela cuando quieras</p>
              <Link to="/#pricing" className="px-5 py-2 bg-[#00D964] text-black text-xs font-bold rounded-lg hover:bg-[#00B856] active:scale-95 transition-all">
                Ver planes
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  // Pick desbloqueado — mostrar contenido completo
  return (
    <>
      <div className="glass-card border border-white/8 rounded-2xl overflow-hidden" style={{position:'relative'}}>
        {watermarkText && (
          <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'space-around',alignItems:'center',zIndex:10}}>
            {[0,1,2,3,4,5].map(i => (
              <span key={i} style={{transform:'rotate(-25deg)',color:'rgba(255,255,255,0.055)',fontSize:'11px',fontWeight:'600',letterSpacing:'2px',whiteSpace:'nowrap',userSelect:'none',marginLeft:i%2===0?'-60px':'60px'}}>
                {watermarkText}
              </span>
            ))}
          </div>
        )}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-white/35 mb-1">{fmtCDMX(pick.published_at)} · {pick.bookmaker}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">{pick.match_name}</span>
              {pick.is_parlay && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  🔗 PARLAY
                </span>
              )}
              {pick.is_combined && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  🎯 COMBINADA
                </span>
              )}
            </div>
            {pick.is_parlay && pick.parlay_legs?.length > 0 && (
              <div className="mt-2 space-y-1">
                {pick.parlay_legs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="text-white/25">⚽</span>
                    <span className="text-white/55">{leg.match}</span>
                    <span className="text-white/25">—</span>
                    <span className="text-white/80 font-medium">{leg.pick}</span>
                    <span className="text-white/35 font-mono">({leg.odds})</span>
                    {leg.result === 'won' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#00D964]/20 text-[#00D964]">✅</span>
                    )}
                    {leg.result === 'push' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/10 text-white/40">↩️ Push</span>
                    )}
                  </div>
                ))}
                {pick.parlay_legs.some(l => l.result === 'push') && (
                  <div className="text-xs text-amber-400 font-medium pt-1">
                    Momio ajustado: {formatOdds(pick.odds)} ({pick.parlay_legs.filter(l => l.result === 'push').length} push)
                  </div>
                )}
              </div>
            )}
            {pick.is_combined && pick.combined_bets?.length > 0 && (
              <div className="mt-2 space-y-1">
                {pick.combined_bets.map((bet, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="text-blue-400/60">✓</span>
                    <span className="text-white/45 font-medium">{bet.market}:</span>
                    <span className="text-white/80">{bet.selection}</span>
                    <span className="text-white/35 font-mono">({bet.odds})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RESULT_STYLES[pick.result] || RESULT_STYLES.pending}`}>
              {RESULT_LABELS[pick.result] || 'Pendiente'}
            </span>
          </div>
        </div>

        <div className="px-4 pb-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono-label font-bold text-white/35 mb-1">Pick</div>
            <div className="text-sm font-semibold text-white">{pick.pick_text}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono-label font-bold text-white/35 mb-1">
              {pick.is_parlay ? 'Momio total' : pick.is_combined ? 'Momio comb.' : 'Momio'}
            </div>
            <div className={`text-sm font-semibold ${pick.is_parlay ? 'text-orange-400' : pick.is_combined ? 'text-blue-400' : 'text-white/80'}`}>
              {formatOdds(pick.odds)}
              {(pick.is_parlay || pick.is_combined) && pick.odds && (
                <span className="text-xs text-white/30 font-normal ml-1">({parseFloat(pick.odds).toFixed(2)}x)</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono-label font-bold text-white/35 mb-1">Stake</div>
            <div className="text-sm font-semibold text-white/70">{stake}% del bank</div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="text-[10px] uppercase tracking-[0.2em] font-mono-label font-bold text-white/35 mb-2">Análisis</div>
          <p className="text-sm text-white/60 leading-relaxed">{pick.analysis}</p>
        </div>

        {utility !== null && (
          <div className="px-4 pb-3">
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono-label font-bold text-white/35 mb-1">Utilidad</div>
            {pick.result === 'push' ? (
              <div className="text-sm font-bold text-amber-400">
                +0.00% del bank <span className="text-xs font-normal text-white/35">(stake devuelto)</span>
              </div>
            ) : (
              <div className={`text-sm font-bold ${utility >= 0 ? 'text-[#00D964]' : 'text-red-400'}`}>
                {utility >= 0 ? '+' : ''}{utility.toFixed(2)}% del bank
              </div>
            )}
          </div>
        )}

        {pick.result === 'won' && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D964]/15 border border-[#00D964]/30 text-[#00D964] text-xs font-semibold hover:bg-[#00D964]/25 active:scale-95 transition-all"
            >
              📸 Compartir
            </button>
          </div>
        )}
      </div>

      {showShare && <ShareModal pick={pick} onClose={() => setShowShare(false)} userEmail={watermarkText} />}
    </>
  )
}
/* ── SHARE MODAL ───────────────────────────────────────────── */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = words[0]
  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = words[i]
    } else {
      line = test
    }
  }
  lines.push(line)
  return lines
}

function ShareModal({ pick, onClose, userEmail = 'primepicks.mx' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080
    const H = 1920
    canvas.width = W
    canvas.height = H

    // Background
    ctx.fillStyle = '#0A0A0A'
    ctx.fillRect(0, 0, W, H)

    // Green gradient top
    const grad = ctx.createLinearGradient(0, 0, 0, H * 0.45)
    grad.addColorStop(0, 'rgba(0,217,100,0.18)')
    grad.addColorStop(1, 'rgba(0,217,100,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    const font = '"Helvetica Neue", Helvetica, Arial, sans-serif'
    const CX = W / 2
    let y = 220

    // "PRIME PICKS" badge — rounded green pill, no external image needed
    const badgeW = 320, badgeH = 80, badgeR = 16
    const badgeX = CX - badgeW / 2
    ctx.fillStyle = '#00D964'
    ctx.beginPath()
    ctx.moveTo(badgeX + badgeR, y)
    ctx.lineTo(badgeX + badgeW - badgeR, y)
    ctx.quadraticCurveTo(badgeX + badgeW, y, badgeX + badgeW, y + badgeR)
    ctx.lineTo(badgeX + badgeW, y + badgeH - badgeR)
    ctx.quadraticCurveTo(badgeX + badgeW, y + badgeH, badgeX + badgeW - badgeR, y + badgeH)
    ctx.lineTo(badgeX + badgeR, y + badgeH)
    ctx.quadraticCurveTo(badgeX, y + badgeH, badgeX, y + badgeH - badgeR)
    ctx.lineTo(badgeX, y + badgeR)
    ctx.quadraticCurveTo(badgeX, y, badgeX + badgeR, y)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.font = `bold 52px ${font}`
    ctx.textAlign = 'center'
    ctx.fillText('PRIME PICKS', CX, y + 54)
    y += badgeH + 90

    // Green divider
    ctx.strokeStyle = '#00D964'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(W * 0.15, y)
    ctx.lineTo(W * 0.85, y)
    ctx.stroke()
    y += 100

    // ✅ PICK GANADO
    ctx.fillStyle = '#00D964'
    ctx.font = `bold 120px ${font}`
    ctx.fillText('✅ PICK GANADO', CX, y)
    y += 160

    // Match name (wrapped)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold 80px ${font}`
    const matchLines = wrapText(ctx, pick.match_name, W * 0.82)
    matchLines.forEach(line => {
      ctx.fillText(line, CX, y)
      y += 105
    })
    y += 50

    // Pick text
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = `600 65px ${font}`
    ctx.fillText(`Pick: ${pick.pick_text}`, CX, y)
    y += 100

    // Momio / Stake
    ctx.fillStyle = '#00D964'
    ctx.font = `bold 65px ${font}`
    ctx.fillText(`Momio: ${formatOdds(pick.odds)} | Stake: ${pick.stake_percent || 2}%`, CX, y)
    y += 110

    // Stars (solid gold ★)
    ctx.fillStyle = '#EF9F27'
    ctx.font = `bold 90px ${font}`
    ctx.fillText('★'.repeat(pick.stars || 3), CX, y)
    y += 120

    // Light divider
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(W * 0.15, y)
    ctx.lineTo(W * 0.85, y)
    ctx.stroke()
    y += 100

    // primepicks.mx
    ctx.fillStyle = '#00D964'
    ctx.font = `bold 70px ${font}`
    ctx.fillText('primepicks.mx', CX, y)
    y += 80

    // Tagline
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.font = `50px ${font}`
    ctx.fillText('Picks deportivos con análisis real', CX, y)

    // Watermark: user email in bottom corner
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#ffffff'
    ctx.font = `400 36px ${font}`
    ctx.textAlign = 'right'
    ctx.fillText(userEmail, W - 60, H - 60)
    ctx.restore()
  }, [pick, userEmail])

  const canShare = !!navigator.share && !!navigator.canShare

  function handleAction() {
    const canvas = canvasRef.current
    canvas.toBlob(blob => {
      if (canShare) {
        const file = new File([blob], 'primepicks-ganado.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'Pick Ganado - Prime Picks',
            text: 'primepicks.mx',
          }).catch(() => {})
          return
        }
      }
      // Fallback: direct download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'primepicks-ganado.png'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card border border-white/10 rounded-2xl p-5 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white">Story para Instagram</div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas preview — 1080×1920 displayed at 324×576 (30%) */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            style={{
              width: '324px',
              height: '576px',
              borderRadius: '12px',
              display: 'block',
            }}
          />
        </div>

        {/* Actions */}
        <button
          onClick={handleAction}
          className="w-full py-3 bg-[#00D964] text-black text-sm font-bold rounded-xl hover:bg-[#00B856] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {canShare ? (
            '📤 Compartir en Instagram Stories'
          ) : (
            <><Download size={16} /> Descargar imagen</>
          )}
        </button>
        <p className="text-center text-xs text-white/30 mt-3">
          {canShare
            ? 'Se abre el menú de compartir de tu iPhone — elige Instagram'
            : 'Imagen 1080×1920px lista para Instagram Stories'}
        </p>
      </div>
    </div>
  )
}

/* ── HISTORY TABLE ─────────────────────────────────────────── */
function HistoryTable({ history, isSubscribed }) {
  const { lang } = useLang()
  const dt = DASH_T[lang]

  if (history.length === 0) return null

  const wins   = history.filter(p => p.result === 'won').length
  const losses = history.filter(p => p.result === 'lost').length
  const pushes = history.filter(p => p.result === 'push').length
  const rows = history

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Receipt size={18} className="text-[#00D964]" />
          {dt.picksHistory}
        </h2>
        <span className="text-sm font-mono-label bg-white/5 border border-white/8 px-3 py-1 rounded-lg">
          <span className="text-[#00D964] font-bold">{wins}</span>
          <span className="text-white/30">-</span>
          <span className="text-red-400 font-bold">{losses}</span>
          {pushes > 0 && (
            <><span className="text-white/30"> · </span><span className="text-amber-400 font-bold">{pushes}↩</span></>
          )}
        </span>
      </div>

      {!isSubscribed ? (
        <div className="rounded-2xl glass-card premium-glow border border-white/10 p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full glass-card border border-white/10 flex items-center justify-center">
            <Lock size={20} className="text-white/50" />
          </div>
          <p className="text-white/80 font-semibold mb-1">Historial completo disponible solo para suscriptores Prime</p>
          <p className="text-white/40 text-sm mb-5">Accede a todos los resultados, utilidades y estadísticas del historial.</p>
          <a
            href="/#pricing"
            className="inline-block px-7 py-2.5 bg-[#00D964] text-black font-bold rounded-lg hover:bg-[#00B856] active:scale-95 transition-all text-sm"
          >
            Ver planes
          </a>
        </div>
      ) : (
        <div className="rounded-2xl glass-card border border-white/8 overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/8">
                  {['Fecha', 'Partido', 'Pick', 'Momio', 'Stake', 'Utilidad', 'Resultado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono-label font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((pick, i) => {
                  const s = parseFloat(pick.stake_percent) || 2
                  const util = pick.result === 'won'
                    ? s * (parseFloat(pick.odds) - 1)
                    : pick.result === 'push' ? 0 : -s
                  const isPush = pick.result === 'push'
                  const utilPos = util >= 0
                  return (
                    <tr key={pick.id} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'}`}>
                      <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                        {fmtCDMX(pick.published_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80 max-w-[160px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="block truncate">{pick.match_name}</span>
                          {pick.is_parlay && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold bg-orange-500/20 text-orange-400">PARLAY</span>
                          )}
                          {pick.is_combined && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400">COMB.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {pick.is_parlay
                          ? <span className="text-orange-400 font-medium">🔗 Parlay {pick.parlay_legs?.length ?? 0} patas</span>
                          : pick.is_combined
                          ? <span className="text-blue-400 font-medium">🎯 Combinada {pick.combined_bets?.length ?? 0} sel.</span>
                          : pick.pick_text
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap font-mono">
                        {formatOdds(pick.odds)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50 whitespace-nowrap">
                        {s}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          isPush ? 'text-amber-400' : utilPos ? 'text-[#00D964]' : 'text-red-400'
                        }`}>
                          {utilPos ? '+' : ''}{util.toFixed(2)}%
                          {isPush && <span className="text-xs font-normal text-white/35 ml-1">(↩️)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESULT_STYLES[pick.result] || RESULT_STYLES.pending}`}>
                          {RESULT_LABELS[pick.result] || pick.result}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
