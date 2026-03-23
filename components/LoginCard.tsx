'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

interface LoginCardProps {
  signInAction: () => Promise<void>
}

export function LoginCard({ signInAction }: LoginCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-sm"
    >
      <Card className="bg-[#141414] ring-[#D4A843]/15 text-center">
        <CardContent className="flex flex-col items-center py-8 px-6">
          {/* Shield icon */}
          <Shield className="size-16 text-[#D4A843] mb-6" strokeWidth={1.5} />

          <h1 className="font-display text-3xl font-bold text-white uppercase tracking-widest mb-2">
            Spoiler Shield
          </h1>
          <p className="text-zinc-500 mb-8">Spoiler-free LoL esports VODs</p>

          <form action={signInAction} className="w-full">
            <Button
              type="submit"
              className="w-full bg-white text-black font-semibold hover:bg-zinc-200 ring-1 ring-[#D4A843]/30 hover:ring-[#D4A843]/60 cursor-pointer h-11"
              size="lg"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
