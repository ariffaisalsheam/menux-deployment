import React, { useEffect, useState } from 'react'
import { adminApprovalsAPI, type ApprovalDto } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

export const AdminApprovals: React.FC = () => {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [items, setItems] = useState<ApprovalDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [noteEdits, setNoteEdits] = useState<Record<number, string>>({})
  const { success, error: showError } = useToast()

  const extractError = (e: any) => e?.response?.data?.error || e?.message || 'Something went wrong'

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const list = await adminApprovalsAPI.list(status === 'ALL' ? undefined : status)
      setItems(list)
    } catch (e: any) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const onApprove = async (id: number, note?: string) => {
    try {
      await adminApprovalsAPI.approve(id, note)
      success('Approval completed')
      await load()
    } catch (e: any) {
      showError(extractError(e))
    }
  }

  const onReject = async (id: number, note?: string) => {
    try {
      await adminApprovalsAPI.reject(id, note)
      success('Approval rejected')
      await load()
    } catch (e: any) {
      showError(extractError(e))
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Approvals</h1>
      <p className="text-sm text-muted-foreground mb-4">Review and decide on pending approvals. Use notes for better audit trails.</p>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-muted-foreground">Status</span>
          <div role="tablist" aria-label="Filter by status" className="inline-flex w-full md:w-auto overflow-x-auto rounded border">
            {(['PENDING','APPROVED','REJECTED','ALL'] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={status === s}
                onClick={() => setStatus(s as any)}
                className={`px-3 py-1.5 text-sm border-r last:border-r-0 whitespace-nowrap ${status === s ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-3 py-1 rounded border text-sm hover:bg-slate-50">Refresh</button>
        </div>
      </div>

      {error && <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.length === 0 && <div className="text-sm text-muted-foreground">No items.</div>}
          {items.map((a) => (
            <div key={a.id} className="bg-white border rounded p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-lg">{a.type} <span className="text-sm text-muted-foreground">— ID: {a.id}</span></div>
                  <div className="text-xs text-muted-foreground">Requested By: {a.requestedBy}</div>
                  {a.approverId != null && (
                    <div className="text-xs text-muted-foreground">Approver: {a.approverId}</div>
                  )}
                  {a.reason && (
                    <div className="text-xs text-muted-foreground">Reason: {a.reason}</div>
                  )}
                  <div className="text-xs text-muted-foreground">Created: {new Date(a.createdAt).toLocaleString()}</div>
                  {a.decidedAt && (
                    <div className="text-xs text-muted-foreground">Decided: {new Date(a.decidedAt).toLocaleString()}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${a.status === 'APPROVED' ? 'bg-green-100 text-green-700' : a.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span>
                  <button onClick={() => setExpanded((prev) => ({ ...prev, [a.id]: !prev[a.id] }))} className="px-2 py-1 rounded border text-xs hover:bg-slate-50">
                    {expanded[a.id] ? 'Hide' : 'Details'}
                  </button>
                  {a.status === 'PENDING' && (
                    <>
                      <button onClick={() => onApprove(a.id)} className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700">Approve</button>
                      <button onClick={() => onReject(a.id)} className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700">Reject</button>
                    </>
                  )}
                </div>
              </div>

              {expanded[a.id] && (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-sm mb-1">Payload</div>
                    <pre className="text-xs bg-slate-50 border rounded p-2 overflow-auto max-h-64">{JSON.stringify(a.payload ?? null, null, 2)}</pre>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Admin Note</label>
                    <textarea
                      rows={3}
                      value={noteEdits[a.id] !== undefined ? noteEdits[a.id] : (a.reason || '')}
                      onChange={(e) => setNoteEdits((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      placeholder="Add an optional note for audit trail..."
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 text-sm"
                    />
                    {a.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onApprove(a.id, (noteEdits[a.id] ?? a.reason ?? '').trim() || undefined)}
                          className="px-3 py-1 rounded border text-sm hover:bg-slate-50"
                          title="Approve with the note above"
                        >Approve with Note</button>
                        <button
                          onClick={() => onReject(a.id, (noteEdits[a.id] ?? a.reason ?? '').trim() || undefined)}
                          className="px-3 py-1 rounded border text-sm hover:bg-slate-50"
                          title="Reject with the note above"
                        >Reject with Note</button>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">Actions disabled: only pending approvals can be decided.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminApprovals
