'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-20">
      <Shield className="size-12 text-gold/40 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
      <p className="text-zinc-500 text-sm mb-6 text-center max-w-sm">
        We couldn&apos;t load the feed. This is usually temporary.
      </p>
      <Button
        onClick={() => unstable_retry()}
        className="bg-gold text-black font-semibold hover:bg-[#e0b84d]"
      >
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  )
}
