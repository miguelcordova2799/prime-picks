export function LogoIcon({ height = 40 }) {
  return (
    <img
      src="/logo.png"
      alt="Prime Picks"
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className="object-contain"
    />
  )
}

export function LogoFull({ height = 40 }) {
  return <LogoIcon height={height} />
}
