import { signIn, auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginCard } from '@/components/LoginCard'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/')

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 bg-[#050505] overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1c1810_0%,#0a0a0a_45%,#050505_70%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(212,168,67,0.18),transparent_60%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-[radial-gradient(ellipse_at_bottom,rgba(212,168,67,0.06),transparent_70%)]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }}
      />

      <div className="relative">
        <LoginCard
          signInAction={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}
        />
      </div>

      <p className="relative mt-6 text-[10px] text-zinc-700 font-display uppercase tracking-[0.3em]">
        Made for the LoL esports community
      </p>
    </div>
  )
}
