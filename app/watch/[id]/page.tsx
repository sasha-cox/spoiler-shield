import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!YOUTUBE_VIDEO_ID.test(id)) notFound()

  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,67,0.06),transparent_60%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#141414_0%,transparent_60%)]"
      />

      <div className="relative w-full max-w-6xl mx-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-gold hover:bg-gold/5 gap-1.5 px-2 group"
              render={<span />}
            >
              <ArrowLeft className="size-4 text-gold transition-transform group-hover:-translate-x-0.5" />
              <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
                Back to feed
              </span>
            </Button>
          </Link>

          <div className="flex items-center gap-1.5 text-zinc-600">
            <Shield className="size-3 text-gold/60" />
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]">
              Now Watching
            </span>
          </div>
        </div>

        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-xl bg-gradient-to-br from-gold/30 via-transparent to-gold/10 opacity-60 blur-md"
          />
          <div
            className="relative w-full overflow-hidden rounded-lg ring-1 ring-gold/20 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            style={{ paddingBottom: '56.25%' }}
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
              title="Video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  )
}
