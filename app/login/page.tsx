import { signIn, auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginCard } from '@/components/LoginCard'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[radial-gradient(ellipse_at_center,#1a1a1a_0%,#0a0a0a_70%)]">
      <LoginCard
        signInAction={async () => {
          'use server'
          await signIn('google', { redirectTo: '/' })
        }}
      />
    </div>
  )
}
