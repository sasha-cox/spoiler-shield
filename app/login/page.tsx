import { signIn, auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[radial-gradient(ellipse_at_center,#1a1a1a_0%,#0a0a0a_70%)]">
      <div className="w-full max-w-sm text-center animate-fade-in-up">
        {/* Shield icon */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-16 h-16 text-[#D4A843]"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M32 4L8 16v16c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V16L32 4z"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M32 12L14 21v11c0 10.8 7.68 20.88 18 24 10.32-3.12 18-13.2 18-24V21L32 12z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </div>

        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold text-white uppercase tracking-widest mb-2">
          Spoiler Shield
        </h1>
        <p className="text-[#8A8A8A] mb-8">Spoiler-free LoL esports VODs</p>

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-white text-black py-3 px-4 text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3 ring-1 ring-[#D4A843]/30 hover:ring-[#D4A843]/60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  )
}
