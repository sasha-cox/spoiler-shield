import { cn } from '@/lib/utils'

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-zinc-800', className)} />
  )
}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gold/20">
        <div className="flex items-center gap-2">
          <Shimmer className="size-6 rounded-full" />
          <Shimmer className="h-7 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-20 rounded-md" />
          <Shimmer className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-2 px-4 pt-3">
        {['w-12', 'w-16', 'w-14', 'w-16', 'w-12'].map((w, i) => (
          <Shimmer key={i} className={cn('h-8 rounded-full', w)} />
        ))}
      </div>

      {/* Feed skeleton */}
      <div className="px-4 py-4 flex flex-col gap-8">
        {[0, 1].map((dayIndex) => (
          <div key={dayIndex} className="flex flex-col gap-4">
            <Shimmer className="h-5 w-24 mb-2" />
            {[0, 1, 2].map((cardIndex) => (
              <div key={cardIndex} className="rounded-lg border-l-2 border-l-gold/30 bg-surface p-4">
                <div className="flex items-center justify-center gap-5 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <Shimmer className="h-6 w-12" />
                    <Shimmer className="h-3 w-20" />
                  </div>
                  <Shimmer className="h-4 w-6" />
                  <div className="flex flex-col items-center gap-1">
                    <Shimmer className="h-6 w-12" />
                    <Shimmer className="h-3 w-20" />
                  </div>
                </div>
                <Shimmer className="h-3 w-40 mx-auto mb-3" />
                <Shimmer className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
