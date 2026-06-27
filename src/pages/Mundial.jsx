import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, MapPin, Calendar, BarChart2 } from 'lucide-react'

const ROUNDS = [
  { key: '16avos',   label: 'Dieciseisavos de Final' },
  { key: '8avos',    label: 'Octavos de Final' },
  { key: 'cuartos',  label: 'Cuartos de Final' },
  { key: 'semifinal', label: 'Semifinales' },
  { key: 'final',    label: 'Final' },
]

function fmtFecha(val) {
  if (!val) return null
  const d = new Date(val)
  if (isNaN(d.getTime())) return val // fallback: return raw string if not parseable
  return d.toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function Mundial() {
  const [bracket, setBracket] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('mundial_bracket')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data }) => {
        setBracket(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const byRound = key => bracket.filter(m => m.ronda === key)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#111111]">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy size={28} className="text-[#EF9F27]" />
            <h1 className="text-3xl font-black">Copa Mundial 2026</h1>
          </div>
          <p className="text-white/40 text-sm">Fase eliminatoria</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-14">
        {ROUNDS.map(({ key, label }) => {
          const matches = byRound(key)
          if (matches.length === 0) return null
          return (
            <section key={key}>
              <h2 className="text-xl font-black mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#00D964] rounded-full inline-block" />
                {label}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {matches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          )
        })}

        {bracket.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
            <p>El bracket se actualizará cuando empiece la fase eliminatoria</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MatchCard({ match }) {
  const [tooltip, setTooltip] = useState(false)
  const isMexico = match.equipo1?.includes('México') || match.equipo2?.includes('México')
  const hasResult = match.resultado && match.resultado !== 'Por definir'
  const tbd = !match.equipo1 || match.equipo1 === 'Por definir'

  return (
    <div className={`rounded-xl bg-[#111111] border overflow-hidden ${
      isMexico ? 'border-[#00D964]/45' : 'border-white/8'
    }`}>
      {isMexico && (
        <div className="px-4 py-1.5 bg-[#00D964]/10 border-b border-[#00D964]/20 text-xs font-semibold text-[#00D964]">
          🇲🇽 México
        </div>
      )}

      <div className="p-4">
        {tbd ? (
          <div className="text-center py-6 text-white/25 text-sm">Por definir</div>
        ) : (
          <>
            {/* Teams row */}
            <div className="flex items-center justify-between gap-3 mb-4">
              {/* Team 1 */}
              <div className={`flex-1 text-center transition-opacity ${
                hasResult && match.ganador !== match.equipo1 ? 'opacity-35' : ''
              }`}>
                <div className="text-3xl mb-1.5">{match.bandera1 || '🏳️'}</div>
                <div className="text-sm font-bold leading-tight">{match.equipo1}</div>
              </div>

              {/* Score / VS */}
              <div className="shrink-0 text-center">
                {hasResult
                  ? <span className="text-xl font-black text-[#00D964] font-mono">{match.resultado}</span>
                  : <span className="text-white/25 text-sm font-bold">VS</span>
                }
              </div>

              {/* Team 2 */}
              <div className={`flex-1 text-center transition-opacity ${
                hasResult && match.ganador !== match.equipo2 ? 'opacity-35' : ''
              }`}>
                <div className="text-3xl mb-1.5">{match.bandera2 || '🏳️'}</div>
                <div className="text-sm font-bold leading-tight">{match.equipo2}</div>
              </div>
            </div>

            {/* Winner badge */}
            {match.ganador && hasResult && (
              <div className="text-center mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00D964]/12 text-[#00D964] border border-[#00D964]/25">
                  ✓ Avanza {match.ganador}
                </span>
              </div>
            )}

            {/* Date / Venue */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/30">
              {match.fecha && (
                <span className="flex items-center gap-1">
                  <Calendar size={10} />{fmtFecha(match.fecha)}
                </span>
              )}
              {match.sede && (
                <span className="flex items-center gap-1">
                  <MapPin size={10} />{match.sede}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          hasResult
            ? 'bg-[#00D964]/12 text-[#00D964] border border-[#00D964]/25'
            : 'bg-white/5 text-white/25 border border-white/8'
        }`}>
          {hasResult ? 'Finalizado' : 'Por definir'}
        </span>

        <div className="relative">
          <button
            onMouseEnter={() => setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
            className="flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors px-2.5 py-1 rounded-lg border border-white/8 hover:border-white/15"
          >
            <BarChart2 size={11} /> Ver pick
          </button>
          {tooltip && (
            <div className="absolute right-0 bottom-full mb-2 px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-xs text-white/50 whitespace-nowrap z-10">
              Pick disponible próximamente
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
