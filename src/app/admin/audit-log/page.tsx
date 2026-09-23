import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Admin — Audit log' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Math.min(1000, Number(pageParam) || 1))

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count(),
  ])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Security-relevant events: {total.toLocaleString('en-US')} recorded. Append-only.
        </p>
      </div>

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-white/5">
              <tr>
                <th className="th">When</th>
                <th className="th">Action</th>
                <th className="th">Actor</th>
                <th className="th">Target</th>
                <th className="th">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="td text-center text-slate-500">
                    No audit entries yet.
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="td whitespace-nowrap text-slate-400">
                    {e.createdAt.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="td">
                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-indigo-200">{e.action}</code>
                  </td>
                  <td className="td text-slate-400">{e.actorEmail ?? e.actorId ?? 'anonymous'}</td>
                  <td className="td text-slate-400">
                    {e.targetType ? `${e.targetType}${e.targetId ? ` · ${e.targetId.slice(0, 10)}` : ''}` : '—'}
                  </td>
                  <td className="td text-slate-500">{e.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/audit-log?page=${page - 1}`} className="btn-small">← Prev</Link>
            )}
            {page < pages && (
              <Link href={`/admin/audit-log?page=${page + 1}`} className="btn-small">Next →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
