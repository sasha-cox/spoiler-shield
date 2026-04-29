import { cn } from '@/lib/utils'

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-zinc-900/80', className)} />
  )
}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gold/10">
        <div className="flex items-center gap-2.5">
          <Shimmer className="size-6 rounded-full" />
          <Shimmer className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="size-7 rounded-full" />
          <Shimmer className="h-7 w-32 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pt-4">
        <div className="flex gap-1.5">
          {['w-12', 'w-16', 'w-14', 'w-16', 'w-12', 'w-14'].map((w, i) => (
            <Shimmer key={i} className={cn('h-7 rounded-full', w)} />
          ))}
        </div>
        <div className="flex gap-1.5">
          {['w-14', 'w-14', 'w-14', 'w-12', 'w-12'].map((w, i) => (
            <Shimmer key={i} className={cn('h-7 rounded-full', w)} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-10">
        {[0, 1].map((dayIndex) => (
          <div key={dayIndex} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3 mb-1">
              <Shimmer className="h-6 w-24" />
              <Shimmer className="h-px flex-1" />
              <Shimmer className="h-3 w-16" />
            </div>
            {[0, 1, 2].map((cardIndex) => (
              <div key={cardIndex} className="relative overflow-hidden rounded-xl bg-surface ring-1 ring-surface-border">
                <span className="absolute inset-y-0 left-0 w-[3px] bg-zinc-800" />
                <div className="px-4 py-3.5 pl-5">
                  <div className="flex items-center justify-between mb-3">
                    <Shimmer className="h-3 w-32" />
                    <Shimmer className="h-3 w-10" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <Shimmer className="h-7 w-14" />
                      <Shimmer className="h-3 w-20" />
                    </div>
                    <Shimmer className="h-4 w-6" />
                    <div className="flex flex-col items-start gap-1.5">
                      <Shimmer className="h-7 w-14" />
                      <Shimmer className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.04] pt-3 mt-3">
                    <Shimmer className="h-3 w-24" />
                    <Shimmer className="h-3 w-14" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
