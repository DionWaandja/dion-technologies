import { SITE } from '@/lib/site'

/**
 * Brand wordmark: blue gradient text, no image assets. The supplied logo
 * artwork was retired in favor of this clean text mark.
 */
export default function Logo() {
  return (
    <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
      {SITE.name}
    </span>
  )
}
