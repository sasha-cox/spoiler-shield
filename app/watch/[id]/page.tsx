import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,#141414_0%,#0a0a0a_70%)] flex items-center justify-center">
      <div className="relative w-full max-w-6xl mx-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <a href="/">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-white gap-1.5 px-2"
              render={<span />}
            >
              <ArrowLeft className="size-4 text-gold" />
              Back to feed
            </Button>
          </a>
        </div>
        <div className="relative w-full ring-1 ring-gold/10 rounded-lg" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title="Video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
