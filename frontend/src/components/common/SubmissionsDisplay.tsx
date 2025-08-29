import React from 'react'
import { mediaProxyUrl } from '../../services/api'

interface SubmissionItem {
  id: number
  amount: number
  trxId: string
  senderMsisdn: string
  screenshotPath?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  note?: string | null
  createdAt: string
}

interface SubmissionsDisplayProps {
  submissions: SubmissionItem[]
  loading?: boolean
  title?: string
  className?: string
}

const formatBDT = (n?: number) =>
  typeof n === 'number' && !isNaN(n) ? new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n) : ''

const formatDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' })
}

export const SubmissionsDisplay: React.FC<SubmissionsDisplayProps> = ({
  submissions,
  loading = false,
  title = "My Submissions",
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-lg shadow p-4 md:p-5 ${className}`}>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div>
          {submissions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No submissions yet.</div>
          ) : (
            <div className="border rounded divide-y">
              {submissions.map((p) => (
                <div key={p.id} className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{formatBDT(p.amount)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDateTime(p.createdAt)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">TRX: {p.trxId}</div>
                    <div className="text-xs text-muted-foreground truncate">From: {p.senderMsisdn}</div>
                    {p.note && <div className="text-xs mt-1">Note: {p.note}</div>}
                    {p.screenshotPath && (
                      <div className="mt-1 flex items-center gap-2">
                        <img 
                          src={mediaProxyUrl(p.screenshotPath)} 
                          alt="Payment proof" 
                          className="h-12 w-12 object-cover rounded border" 
                        />
                        <a 
                          className="text-xs underline" 
                          href={mediaProxyUrl(p.screenshotPath)} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          View full
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className={`text-xs px-2 py-1 rounded ${
                      p.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-700' 
                        : p.status === 'REJECTED' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SubmissionsDisplay
