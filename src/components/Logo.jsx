export function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#111111"/>
      {/* Ascending bars */}
      <rect x="5" y="27" width="7" height="9" rx="1.5" fill="#00D964" opacity="0.45"/>
      <rect x="16" y="19" width="7" height="17" rx="1.5" fill="#00D964" opacity="0.7"/>
      <rect x="27" y="11" width="7" height="25" rx="1.5" fill="#00D964"/>
      {/* Gold football overlapping the tallest bar */}
      <circle cx="30.5" cy="9.5" r="7.5" fill="#EF9F27"/>
      <path d="M30.5 5.8 L33.6 8.1 L32.5 11.6 L28.5 11.6 L27.4 8.1 Z" fill="rgba(0,0,0,0.28)"/>
      <circle cx="30.5" cy="9.5" r="1.6" fill="rgba(0,0,0,0.18)"/>
      {/* Trend line connecting bar tops */}
      <polyline points="8.5,23.5 19.5,15.5 27.5,8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function LogoFull() {
  return (
    <span className="flex items-center gap-2">
      <LogoIcon size={32} />
      <span className="font-black text-white text-lg tracking-tight leading-none">
        Prime<span className="text-[#00D964]">Picks</span>
      </span>
    </span>
  )
}
