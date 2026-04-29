'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Shield, EyeOff, Trophy, Zap } from 'lucide-react'

interface LoginCardProps {
  signInAction: () => Promise<void>
}

const FEATURES = [
  {
    icon: EyeOff,
    title: 'Spoiler-safe',
    body: 'No scores, no winners, no surprises ruined.',
  },
  {
    icon: Trophy,
    title: 'Every league',
    body: 'LCK, LEC, LCS, LPL, CBLOL — plus Caedrel and crew.',
  },
  {
    icon: Zap,
    title: 'Fresh VODs',
    body: 'Match uploads pulled directly from YouTube.',
  },
]

export function LoginCard({ signInAction }: LoginCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const fade = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

  return (
    <motion.div
      {...fade}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full max-w-md"
    >
      <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-[#0d0d0d] ring-1 ring-gold/10 shadow-[0_30px_80px_-20px_rgba(212,168,67,0.18)]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-32 h-64 bg-[radial-gradient(ellipse_at_center,rgba(212,168,67,0.18),transparent_70%)]"
        />

        <div className="relative flex flex-col px-7 pt-9 pb-7 text-center">
          <div className="relative mx-auto mb-5 flex size-16 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-gold/15 blur-xl"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full ring-1 ring-gold/30"
            />
            <Shield
              className="relative size-9 text-gold drop-shadow-[0_0_10px_rgba(212,168,67,0.55)]"
              strokeWidth={1.75}
            />
          </div>

          <p className="font-display text-[10px] uppercase tracking-[0.4em] text-gold/80 mb-3">
            Pro League Esports
          </p>

          <h1 className="font-display text-4xl font-bold uppercase tracking-[0.1em] leading-none mb-3">
            <span className="text-white">Spoiler</span>
            <span className="text-gold">Shield</span>
          </h1>

          <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto mb-7">
            Watch every pro match VOD without learning who won. A spoiler-free feed
            for League of Legends esports.
          </p>

          <ul className="flex flex-col gap-2.5 mb-7 text-left">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gold/10 ring-1 ring-gold/20">
                  <Icon className="size-3.5 text-gold" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-white">
                    {title}
                  </p>
                  <p className="text-xs text-text-secondary leading-snug mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <form action={signInAction} className="w-full">
            <Button
              type="submit"
              className="w-full bg-white text-black font-semibold hover:bg-zinc-100 ring-1 ring-gold/40 hover:ring-gold/70 hover:shadow-[0_0_24px_-4px_rgba(212,168,67,0.5)] cursor-pointer h-11 transition-all"
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

          <p className="mt-4 text-[11px] text-zinc-600 font-display uppercase tracking-[0.2em]">
            Free · No ads · Open source
          </p>
        </div>
      </div>
    </motion.div>
  )
}
