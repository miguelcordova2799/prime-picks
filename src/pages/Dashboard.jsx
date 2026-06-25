import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Stars from '../components/Stars'
import { Lock, TrendingUp, Trophy, Target, ChevronRight, X, Download } from 'lucide-react'
import { formatOdds } from '../lib/odds'

const RESULT_STYLES = {
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  won: 'bg-[#00D964]/12 text-[#00D964] border border-[#00D964]/25',
  lost: 'bg-red-500/15 text-red-400 border border-red-500/20',
}
const RESULT_LABELS = { pending: 'Pendiente', won: 'Ganado ✓', lost: 'Perdido ✗' }

// Format a UTC ISO string to CDMX local time: "24 jun · 7:00 PM"
function fmtCDMX(iso) {
  const d = new Date(iso)
  const tz = 'America/Mexico_City'
  const day = d.toLocaleDateString('es-MX', { timeZone: tz, day: 'numeric', month: 'short' })
    .replace(' de ', ' ').replace('.', '')
  const time = d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} · ${time}`
}

export default function Dashboard() {
  const { isSubscribed } = useAuth()
  const [picks, setPicks] = useState([])
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ wins: 0, losses: 0, roi: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPicks()
    fetchStats()
    fetchHistory()
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
    const { data } = await supabase.from('stats').select('*').single()
    if (data) setStats(data)
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from('picks')
      .select('id, match_name, pick_text, odds, result, published_at')
      .in('result', ['won', 'lost'])
      .order('published_at', { ascending: false })
    setHistory(data || [])
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

        {/* History table */}
        <HistoryTable history={history} />

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
  const [showShare, setShowShare] = useState(false)

  // Locked: show only match name + upsell, hide all pick details
  if (locked) {
    return (
      <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
        <div className="p-4">
          <div className="text-xs text-white/35 mb-1">{fmtCDMX(pick.published_at)} · {pick.bookmaker}</div>
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
    <>
      <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-white/35 mb-1">{fmtCDMX(pick.published_at)} · {pick.bookmaker}</div>
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
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D964]/15 border border-[#00D964]/30 text-[#00D964] text-xs font-semibold hover:bg-[#00D964]/25 transition-colors"
            >
              📸 Compartir
            </button>
          </div>
        )}
      </div>

      {showShare && <ShareModal pick={pick} onClose={() => setShowShare(false)} />}
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

function ShareModal({ pick, onClose }) {
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

    // Cuota / Edge
    ctx.fillStyle = '#00D964'
    ctx.font = `bold 65px ${font}`
    ctx.fillText(`Cuota: ${formatOdds(pick.odds)} | Edge: +${pick.edge}%`, CX, y)
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
  }, [pick])

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
        className="bg-[#111111] border border-white/10 rounded-2xl p-5 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white">Story para Instagram</div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
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
          className="w-full py-3 bg-[#00D964] text-black text-sm font-bold rounded-xl hover:bg-[#00B856] transition-colors flex items-center justify-center gap-2"
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
function HistoryTable({ history }) {
  if (history.length === 0) return null

  const wins = history.filter(p => p.result === 'won').length
  const losses = history.filter(p => p.result === 'lost').length
  const rows = history

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">Historial de picks</h2>
        <span className="text-sm font-mono bg-[#111111] border border-white/8 px-3 py-1 rounded-lg">
          <span className="text-[#00D964] font-bold">{wins}</span>
          <span className="text-white/30">-</span>
          <span className="text-red-400 font-bold">{losses}</span>
        </span>
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="bg-[#161616] border-b border-white/8">
                {['Fecha', 'Partido', 'Pick', 'Cuota', 'Resultado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((pick, i) => (
                <tr key={pick.id} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#111111]'}`}>
                  <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                    {fmtCDMX(pick.published_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80 max-w-[160px]">
                    <span className="block truncate">{pick.match_name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">
                    {pick.pick_text}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                    {formatOdds(pick.odds)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      pick.result === 'won'
                        ? 'bg-[#00D964]/12 text-[#00D964] border border-[#00D964]/25'
                        : 'bg-red-500/15 text-red-400 border border-red-500/20'
                    }`}>
                      {pick.result === 'won' ? 'Ganado ✓' : 'Perdido ✗'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
