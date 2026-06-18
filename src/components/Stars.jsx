import { Star } from 'lucide-react'

export default function Stars({ count, max = 3 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < count ? 'fill-[#EF9F27] text-[#EF9F27]' : 'text-white/20'}
        />
      ))}
    </div>
  )
}
