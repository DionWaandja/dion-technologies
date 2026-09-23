'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      className="btn-ghost"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          signOut({ redirect: false }).then(() => {
            router.push('/')
            router.refresh()
          })
        })
      }
    >
      {pending ? '…' : 'Log out'}
    </button>
  )
}
