import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Mundial() {
  const [bracket, setBracket] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('16avos')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('mundial_bracket')
        .select('*')
        .order('llave_numero', { ascending: true })
      if (data) {
        const grouped = data.reduce((acc, m) => {
          if (!acc[m.ronda]) acc[m.ronda] = []
          acc[m.ronda].push(m)
          return acc
        }, {})
        setBracket(grouped)
      }
      setLoading(false)
    }
    load()
  }, [])

  const rondas = ['16avos', '8avos', 'cuartos', 'semifinal', 'final']
  const tabLabels = { '16avos': '16avos', '8avos': '8avos', 'cuartos': 'Cuartos', 'semifinal': 'Semis', 'final': 'Final' }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s16 = bracket['16avos'] || []
  const s8 = bracket['8avos'] || []
  const sq = bracket['cuartos'] || []
  const ssf = bracket['semifinal'] || []
  const sf = bracket['final'] || []

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="border-b border-white/8 px-4 py-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00D964]/15 border border-[#00D964]/30 text-[#00D964] text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D964] animate-pulse" />
          En vivo
        </div>
        <h1 className="text-3xl font-black mb-1">🏆 Copa Mundial FIFA 2026</h1>
        <p className="text-white/40 text-sm">Bracket — Fase Eliminatoria</p>
      </div>

      <div className="md:hidden flex gap-1 p-3 overflow-x-auto border-b border-white/8">
        {rondas.map(r => (
          <button key={r} onClick={() => setActiveTab(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === r ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'}`}>
            {tabLabels[r]}
          </button>
        ))}
      </div>

      <div className="md:hidden p-4 space-y-3">
        {(bracket[activeTab] || []).map(m => <MatchCard key={m.id} match={m} />)}
        {(bracket[activeTab] || []).length === 0 && (
          <div className="text-center text-white/30 py-12 text-sm">Por definir</div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto p-8">
        <div style={{ minWidth: '1400px' }}>
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <RoundColumn label="16avos" matches={s16.slice(0, 8)} gap={8} />
              <ConnectorGroup count={4} />
              <RoundColumn label="8avos" matches={s8.slice(0, 4)} gap={20} />
              <ConnectorGroup count={2} />
              <RoundColumn label="Cuartos" matches={sq.slice(0, 2)} gap={52} />
              <ConnectorGroup count={1} />
              <RoundColumn label="Semis" matches={ssf.slice(0, 1)} gap={120} />
              <div style={{ width: '20px', height: '2px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </div>

            <div className="flex flex-col items-center px-2">
              <div className="text-[10px] text-[#EF9F27] font-bold mb-2">🏆 FINAL</div>
              {sf[0] ? <MatchCard match={sf[0]} gold /> : <EmptyCard gold />}
              <div className="text-[10px] text-white/20 mt-1">19 jul · MetLife Stadium</div>
            </div>

            <div className="flex items-center">
              <div style={{ width: '20px', height: '2px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <RoundColumn label="Semis" matches={ssf.slice(1, 2)} gap={120} />
              <ConnectorGroup count={1} flip />
              <RoundColumn label="Cuartos" matches={sq.slice(2, 4)} gap={52} />
              <ConnectorGroup count={2} flip />
              <RoundColumn label="8avos" matches={s8.slice(4, 8)} gap={20} />
              <ConnectorGroup count={4} flip />
              <RoundColumn label="16avos" matches={s16.slice(8, 16)} gap={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoundColumn({ label, matches, gap }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: `${gap * 4}px`, padding: '0 4px' }}>
      {matches.map(m => <MatchCard key={m.id} match={m} />)}
      {matches.length === 0 && <EmptyCard />}
    </div>
  )
}

function ConnectorGroup({ count, flip }) {
  return (
    <div className="flex flex-col justify-around" style={{ width: '20px', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: '20px', height: '60px',
          borderTop: flip ? 'none' : '1px solid rgba(255,255,255,0.1)',
          borderBottom: flip ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRight: flip ? 'none' : '1px solid rgba(255,255,255,0.1)',
          borderLeft: flip ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }} />
      ))}
    </div>
  )
}

function MatchCard({ match, gold }) {
  const isMexico = match.equipo1 === 'México' || match.equipo2 === 'México'
  const pending = !match.resultado || match.resultado === 'Por definir'
  return (
    <div style={{
      width: '170px', backgroundColor: '#111111', flexShrink: 0,
      border: gold ? '1px solid #EF9F27' : isMexico ? '1px solid #00D964' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', overflow: 'hidden',
    }}>
      <TeamRow bandera={match.bandera1} nombre={match.equipo1} isWinner={match.ganador === match.equipo1} pending={pending} />
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <TeamRow bandera={match.bandera2} nombre={match.equipo2} isWinner={match.ganador === match.equipo2} pending={pending} />
      {match.fecha && (
        <div style={{ padding: '3px 8px', fontSize: '9px', color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {match.fecha}
        </div>
      )}
    </div>
  )
}

function TeamRow({ bandera, nombre, isWinner, pending }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px',
      backgroundColor: isWinner ? 'rgba(0,217,100,0.08)' : 'transparent',
    }}>
      <span style={{ fontSize: '13px' }}>{bandera || '🏳️'}</span>
      <span style={{
        fontSize: '11px', fontWeight: isWinner ? 700 : 400, flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: pending ? 'rgba(255,255,255,0.3)' : isWinner ? '#00D964' : 'rgba(255,255,255,0.8)',
      }}>
        {nombre || 'Por definir'}
      </span>
    </div>
  )
}

function EmptyCard({ gold }) {
  return (
    <div style={{
      width: '170px', height: '68px', backgroundColor: '#0D0D0D',
      border: gold ? '1px dashed rgba(239,159,39,0.3)' : '1px dashed rgba(255,255,255,0.08)',
      borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Por definir</span>
    </div>
  )
}
