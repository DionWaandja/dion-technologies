'use client'

import { useCallback, useEffect, useState } from 'react'

type Message = {
  id: string
  name: string
  email: string
  company: string | null
  description: string
  budgetRange: string
  status: 'NEW' | 'READ' | 'ARCHIVED' | 'HANDLED'
  notes: string | null
  createdAt: string
}

type ListResponse = {
  items: Message[]
  total: number
  page: number
  pages: number
  counts: Record<'NEW' | 'READ' | 'ARCHIVED' | 'HANDLED', number>
}

const STATUS_BADGE: Record<Message['status'], string> = {
  NEW: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  READ: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  ARCHIVED: 'border-slate-500/30 bg-slate-500/10 text-slate-500',
  HANDLED: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
}

const TABS = ['ALL', 'NEW', 'READ', 'ARCHIVED', 'HANDLED'] as const

export default function MessagesInbox() {
  const [data, setData] = useState<ListResponse | null>(null)
  const [status, setStatus] = useState<(typeof TABS)[number]>('ALL')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ status, page: String(page) })
    if (q.trim()) params.set('q', q.trim())
    const res = await fetch(`/api/admin/messages?${params}`)
    if (res.ok) setData((await res.json()) as ListResponse)
    setLoading(false)
  }, [status, q, page])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  async function update(id: string, patch: { status?: Message['status']; notes?: string }) {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) load()
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setStatus(t)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                status === t
                  ? 'bg-indigo-500/20 font-medium text-indigo-200'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {t}
              {data && t !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">{data.counts[t]}</span>
              )}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search name, email, company, description…"
          className="input ml-auto max-w-xs"
          aria-label="Search messages"
        />
      </div>

      {/* List */}
      {loading && !data ? (
        <p className="text-sm text-slate-500">Loading inbox…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="glass p-8 text-center text-sm text-slate-500">No messages match this view.</p>
      ) : (
        <div className="glass divide-y divide-white/5">
          {data.items.map((m) => (
            <article key={m.id} className="p-5">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 text-left"
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{m.name}</span>
                    {m.company && <span className="text-sm text-slate-500">· {m.company}</span>}
                    <span className={`badge ${STATUS_BADGE[m.status]}`}>{m.status}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{m.email}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">{m.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-slate-300">{m.budgetRange}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </button>

              {expandedId === m.id && (
                <div className="mt-4 border-t border-white/5 pt-4">
                  <p className="whitespace-pre-wrap text-sm text-slate-300">{m.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {m.status !== 'READ' && (
                      <button type="button" className="btn-small" onClick={() => update(m.id, { status: 'READ' })}>
                        Mark read
                      </button>
                    )}
                    {m.status !== 'HANDLED' && (
                      <button type="button" className="btn-small" onClick={() => update(m.id, { status: 'HANDLED' })}>
                        Mark handled
                      </button>
                    )}
                    {m.status !== 'ARCHIVED' && (
                      <button type="button" className="btn-small" onClick={() => update(m.id, { status: 'ARCHIVED' })}>
                        Archive
                      </button>
                    )}
                    {m.status === 'ARCHIVED' && (
                      <button type="button" className="btn-small" onClick={() => update(m.id, { status: 'NEW' })}>
                        Unarchive
                      </button>
                    )}
                    <a className="btn-small" href={`mailto:${m.email}?subject=Your%20project%20request`}>
                      Reply by email
                    </a>
                  </div>

                  <NoteEditor
                    initial={m.notes ?? ''}
                    onSave={(notes) => update(m.id, { notes })}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Page {data.page} of {data.pages} · {data.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-small"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="btn-small"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteEditor({ initial, onSave }: { initial: string; onSave: (notes: string) => void }) {
  const [value, setValue] = useState(initial)
  const [saved, setSaved] = useState(false)

  return (
    <div className="mt-4">
      <label className="label">Internal notes (never shown to the client)</label>
      <textarea
        className="input resize-y"
        rows={2}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setSaved(false)
        }}
        maxLength={4000}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          className="btn-small"
          onClick={() => {
            onSave(value)
            setSaved(true)
          }}
        >
          Save notes
        </button>
        {saved && <span className="text-xs text-emerald-300">Saved</span>}
      </div>
    </div>
  )
}
