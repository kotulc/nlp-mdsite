/**
 * Client-side redirect for auto-generated index pages.
 * Uses Next.js router.replace() so basePath is handled automatically.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/router'


export default function AutoRedirect({ to }) {
  const { replace } = useRouter()
  useEffect(() => { replace(to) }, [])
  return null
}
