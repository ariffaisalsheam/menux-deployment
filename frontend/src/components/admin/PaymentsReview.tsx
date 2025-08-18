import React, { useEffect, useState } from 'react'
import { adminPaymentsAPI, mediaProxyUrl, platformConfigAPI } from '../../services/api'
import bkashSvg from '../../assets/bkash.svg'
import type { ManualPaymentDto } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

export const PaymentsReview: React.FC = () => {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [items, setItems] = useState<ManualPaymentDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Settings state (bKash public settings)
  const [merchantNumber, setMerchantNumber] = useState('')
  const [minAmount, setMinAmount] = useState('')
  // Instructions are now stored per language
  const [instructionsEn, setInstructionsEn] = useState('')
  const [instructionsBn, setInstructionsBn] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')
  const [initLoading, setInitLoading] = useState(false)
  const [logoSrc, setLogoSrc] = useState<string>('/bkash.webp') // prefer WebP in frontend/public/bkash.webp; fallback to png, then SVG
  const handleLogoError = () => {
    setLogoSrc((prev) => (prev.endsWith('.webp') ? '/bkash.png' : bkashSvg))
  }
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [noteEdits, setNoteEdits] = useState<Record<number, string>>({})
  const { success, error: showError } = useToast()

  // Collapsible settings panel (persisted)
  const [showSettings, setShowSettings] = useState<boolean>(() => {
    const v = localStorage.getItem('payments_review_show_settings')
    return v ? v === '1' : false
  })
  useEffect(() => {
    localStorage.setItem('payments_review_show_settings', showSettings ? '1' : '0')
  }, [showSettings])

  const extractError = (e: any) => {
    return e?.response?.data?.error || e?.message || 'Something went wrong'
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const list = await adminPaymentsAPI.list(status === 'ALL' ? undefined : status)
      setItems(list)
    } catch (e: any) {
      setError(e?.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    setSettingsLoading(true)
    setSettingsError('')
    setSettingsSuccess('')
    try {
      // Try fetching each key; backend returns 404 if missing
      const merchant = await platformConfigAPI
        .getPlatformSettingByKey('PAYMENT_BKASH_MERCHANT_NUMBER')
        .catch(() => null)
      const minAmt = await platformConfigAPI
        .getPlatformSettingByKey('PAYMENT_BKASH_MIN_AMOUNT')
        .catch(() => null)
      // New bilingual keys with fallback to legacy single key
      const instrEn = await platformConfigAPI
        .getPlatformSettingByKey('PAYMENT_BKASH_INSTRUCTIONS_EN')
        .catch(() => null)
      const instrBn = await platformConfigAPI
        .getPlatformSettingByKey('PAYMENT_BKASH_INSTRUCTIONS_BN')
        .catch(() => null)
      const legacyInstr = await platformConfigAPI
        .getPlatformSettingByKey('PAYMENT_BKASH_INSTRUCTIONS')
        .catch(() => null)

      setMerchantNumber(merchant?.value ?? '')
      setMinAmount((minAmt?.value ?? '').toString())
      setInstructionsEn(instrEn?.value ?? legacyInstr?.value ?? '')
      setInstructionsBn(instrBn?.value ?? '')
    } catch (e: any) {
      setSettingsError(e?.message || 'Failed to load settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    // Load settings once when component mounts
    loadSettings()
  }, [])

  const onSaveSettings = async () => {
    setSettingsError('')
    setSettingsSuccess('')
    // Basic validation
    if (!merchantNumber.trim()) {
      setSettingsError('Merchant number is required.')
      return
    }
    const amt = parseFloat(minAmount)
    if (isNaN(amt) || amt <= 0) {
      setSettingsError('Minimum amount must be a number greater than 0.')
      return
    }
    try {
      setSettingsLoading(true)
      // Fetch existing keys to decide create vs update (merchant/min only)
      const [existingMerchant, existingMin] = await Promise.all([
        platformConfigAPI.getPlatformSettingByKey('PAYMENT_BKASH_MERCHANT_NUMBER').catch(() => null),
        platformConfigAPI.getPlatformSettingByKey('PAYMENT_BKASH_MIN_AMOUNT').catch(() => null),
      ])

      const ops: Promise<any>[] = []

      // Merchant number (STRING)
      if (existingMerchant) {
        ops.push(
          platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_MERCHANT_NUMBER', {
            value: merchantNumber.trim(),
            isPublic: true,
          })
        )
      } else {
        ops.push(
          platformConfigAPI.createPlatformSetting({
            key: 'PAYMENT_BKASH_MERCHANT_NUMBER',
            value: merchantNumber.trim(),
            valueType: 'STRING',
            description: 'Public bKash merchant number for manual payments',
            isPublic: true,
          })
        )
      }

      // Minimum amount (INTEGER)
      const minAsInt = String(Math.floor(amt))
      if (existingMin) {
        ops.push(
          platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_MIN_AMOUNT', {
            value: minAsInt,
            isPublic: true,
          })
        )
      } else {
        ops.push(
          platformConfigAPI.createPlatformSetting({
            key: 'PAYMENT_BKASH_MIN_AMOUNT',
            value: minAsInt,
            valueType: 'INTEGER',
            description: 'Minimum manual bKash payment amount in BDT',
            isPublic: true,
          })
        )
      }

      await Promise.all(ops)
      setSettingsSuccess('Settings saved successfully.')
    } catch (e: any) {
      setSettingsError(e?.message || 'Failed to save settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  // Modal for editing bilingual instructions
  const [showInstrModal, setShowInstrModal] = useState(false)
  const [instrSaving, setInstrSaving] = useState(false)
  const [instrError, setInstrError] = useState('')
  const [instrSuccess, setInstrSuccess] = useState('')

  const onSaveInstructions = async () => {
    setInstrError('')
    setInstrSuccess('')
    try {
      setInstrSaving(true)
      const [existingEn, existingBn] = await Promise.all([
        platformConfigAPI.getPlatformSettingByKey('PAYMENT_BKASH_INSTRUCTIONS_EN').catch(() => null),
        platformConfigAPI.getPlatformSettingByKey('PAYMENT_BKASH_INSTRUCTIONS_BN').catch(() => null),
      ])

      const ops: Promise<any>[] = []
      if (existingEn) {
        ops.push(
          platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_INSTRUCTIONS_EN', {
            value: instructionsEn,
            isPublic: true,
          })
        )
      } else {
        ops.push(
          platformConfigAPI.createPlatformSetting({
            key: 'PAYMENT_BKASH_INSTRUCTIONS_EN',
            value: instructionsEn,
            valueType: 'STRING',
            description: 'Public EN instructions for manual bKash payment',
            isPublic: true,
          })
        )
      }

      if (existingBn) {
        ops.push(
          platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_INSTRUCTIONS_BN', {
            value: instructionsBn,
            isPublic: true,
          })
        )
      } else {
        ops.push(
          platformConfigAPI.createPlatformSetting({
            key: 'PAYMENT_BKASH_INSTRUCTIONS_BN',
            value: instructionsBn,
            valueType: 'STRING',
            description: 'Public BN instructions for manual bKash payment',
            isPublic: true,
          })
        )
      }

      await Promise.all(ops)
      setInstrSuccess('Instructions saved.')
      setShowInstrModal(false)
      // refresh to reflect any changes if needed
      await loadSettings()
    } catch (e: any) {
      setInstrError(e?.message || 'Failed to save instructions')
    } finally {
      setInstrSaving(false)
    }
  }

  const onInitializeDefaults = async () => {
    setSettingsError('')
    setSettingsSuccess('')
    try {
      setInitLoading(true)
      await platformConfigAPI.initializePlatformSettings()
      await loadSettings()
      setSettingsSuccess('Defaults initialized.')
    } catch (e: any) {
      setSettingsError(e?.message || 'Failed to initialize defaults (requires SUPER_ADMIN).')
    } finally {
      setInitLoading(false)
    }
  }

  const onApprove = async (id: number) => {
    try {
      await adminPaymentsAPI.approve(id)
      success('Payment approved and PRO plan activated')
      await load()
    } catch (e: any) {
      showError(extractError(e))
    }
  }

  const onReject = async (id: number, note?: string) => {
    try {
      await adminPaymentsAPI.reject(id, note)
      success('Payment rejected')
      await load()
    } catch (e: any) {
      showError(extractError(e))
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Manual Payments (bKash)</h1>
      <p className="text-sm text-muted-foreground mb-4">Review owner-submitted manual bKash payments. Approvals will set the owner's plan to PRO.</p>

      {/* Settings Panel (collapsible) */}
      <div className="bg-white border rounded mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoSrc} onError={handleLogoError} alt="bKash" className="h-6 w-auto" />
            <h2 className="font-medium truncate">bKash Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="px-3 py-1 rounded border text-sm hover:bg-slate-50"
              aria-expanded={showSettings}
              aria-controls="bkash-settings-body"
            >
              {showSettings ? 'Hide' : 'Show'}
            </button>
            {showSettings && (
              <>
                <button
                  onClick={onInitializeDefaults}
                  disabled={initLoading || settingsLoading}
                  title="One-time setup. Creates missing bKash settings with safe defaults. Does NOT overwrite existing values. Requires SUPER_ADMIN."
                  className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm disabled:opacity-50"
                >
                  {initLoading ? 'Initializing...' : 'Initialize Defaults'}
                </button>
                <button
                  onClick={() => setShowInstrModal(true)}
                  disabled={settingsLoading}
                  title="Edit English & Bangla instructions in a dedicated modal"
                  className="px-3 py-1 rounded bg-pink-600 text-white text-sm hover:bg-pink-700 disabled:opacity-50"
                >
                  Edit Instructions
                </button>
                <button
                  onClick={onSaveSettings}
                  disabled={settingsLoading}
                  title="Saves or creates the public bKash settings used by the Upgrade page."
                  className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </>
            )}
          </div>
        </div>
        {showSettings && (
          <div id="bkash-settings-body" className="p-4">
            {settingsError && (
              <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{settingsError}</div>
            )}
            {settingsSuccess && (
              <div className="mb-3 p-3 rounded border border-green-200 bg-green-50 text-green-700 text-sm">{settingsSuccess}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm">Merchant Number</label>
                <input
                  type="text"
                  value={merchantNumber}
                  onChange={(e) => setMerchantNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Minimum Amount (BDT)</label>
                <input
                  type="text"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="500"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-1"></div>
              <div className="md:col-span-3 text-sm text-muted-foreground">
                Payment instructions are now edited via the <span className="font-medium text-slate-800">Edit Instructions</span> button above.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      {showInstrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-[min(90vw,820px)]">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Edit Payment Instructions</h3>
              <button onClick={() => setShowInstrModal(false)} className="px-2 py-1 text-sm rounded border hover:bg-slate-50">Close</button>
            </div>
            <div className="p-4 space-y-3">
              {instrError && (
                <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{instrError}</div>
              )}
              {instrSuccess && (
                <div className="p-3 rounded border border-green-200 bg-green-50 text-green-700 text-sm">{instrSuccess}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm">Instructions (English)</label>
                  <textarea
                    rows={8}
                    value={instructionsEn}
                    onChange={(e) => setInstructionsEn(e.target.value)}
                    placeholder={`1) Open bKash and choose Send Money\n2) Send to merchant number\n3) Save TRX ID and screenshot\n4) Submit details in the Upgrade form`}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm">নির্দেশনা (বাংলা)</label>
                  <textarea
                    rows={8}
                    value={instructionsBn}
                    onChange={(e) => setInstructionsBn(e.target.value)}
                    placeholder={`১) বিকাশ খুলে Send Money নির্বাচন করুন\n২) মার্চেন্ট নম্বরে টাকা পাঠান\n৩) TRX আইডি ও স্ক্রিনশট সংরক্ষণ করুন\n৪) আপগ্রেড ফর্মে তথ্য দিন`}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <button onClick={() => setShowInstrModal(false)} className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={onSaveInstructions} disabled={instrSaving} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
                {instrSaving ? 'Saving...' : 'Save Instructions'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {items.map((p) => (
            <div key={p.id} className="bg-white border rounded p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-lg">৳ {p.amount} <span className="text-sm text-muted-foreground">— TRX: {p.trxId}</span></div>
                  <div className="text-xs text-muted-foreground">From: {p.senderMsisdn}</div>
                  <div className="text-xs text-muted-foreground">Owner: {p.ownerId} • Restaurant: {p.restaurantId}</div>
                  <div className="text-xs text-muted-foreground">Created: {new Date(p.createdAt).toLocaleString()}</div>
                  {p.verifiedAt && (
                    <div className="text-xs text-muted-foreground">Verified: {new Date(p.verifiedAt).toLocaleString()} {p.verifiedBy ? `(by ${p.verifiedBy})` : ''}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span>
                  <button onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))} className="px-2 py-1 rounded border text-xs hover:bg-slate-50">
                    {expanded[p.id] ? 'Hide' : 'Details'}
                  </button>
                  {p.status === 'PENDING' && (
                    <>
                      <button onClick={() => onApprove(p.id)} className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700">Approve</button>
                      <button onClick={() => onReject(p.id)} className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700">Reject</button>
                    </>
                  )}
                </div>
              </div>

              {expanded[p.id] && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-muted-foreground">TRX ID</div>
                      <div className="font-medium">{p.trxId}</div>
                      <button
                        className="text-xs px-2 py-0.5 border rounded hover:bg-slate-100"
                        title="Copy TRX ID"
                        onClick={() => navigator.clipboard.writeText(p.trxId)}
                      >Copy</button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-muted-foreground">Sender</div>
                      <div className="font-medium">{p.senderMsisdn}</div>
                      <button
                        className="text-xs px-2 py-0.5 border rounded hover:bg-slate-100"
                        title="Copy number"
                        onClick={() => navigator.clipboard.writeText(p.senderMsisdn)}
                      >Copy</button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-muted-foreground">Method</div>
                      <div className="font-medium">{p.method || '—'}</div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-muted-foreground">Currency</div>
                      <div className="font-medium">{p.currency || 'BDT'}</div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-muted-foreground">Owner ID</div>
                      <div className="font-medium">{p.ownerId}</div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-muted-foreground">Restaurant ID</div>
                      <div className="font-medium">{p.restaurantId}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Admin Note</label>
                    <textarea
                      rows={3}
                      value={noteEdits[p.id] !== undefined ? noteEdits[p.id] : (p.note || '')}
                      onChange={(e) => setNoteEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Add an optional note for audit trail..."
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 text-sm"
                    />
                    {p.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onApprove(p.id)}
                          title="Approve (without adding note)"
                          className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                        >Approve</button>
                        <button
                          onClick={() => onReject(p.id)}
                          className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                        >Reject</button>
                        <button
                          onClick={async () => {
                            const note = (noteEdits[p.id] ?? p.note ?? '').trim() || undefined
                            try {
                              await adminPaymentsAPI.approve(p.id, note)
                              success('Payment approved')
                              await load()
                            } catch (e: any) {
                              showError(extractError(e))
                            }
                          }}
                          className="px-3 py-1 rounded border text-sm hover:bg-slate-50"
                          title="Approve with the note above"
                        >Approve with Note</button>
                        <button
                          onClick={async () => {
                            const note = (noteEdits[p.id] ?? p.note ?? '').trim() || undefined
                            try {
                              await adminPaymentsAPI.reject(p.id, note)
                              success('Payment rejected')
                              await load()
                            } catch (e: any) {
                              showError(extractError(e))
                            }
                          }}
                          className="px-3 py-1 rounded border text-sm hover:bg-slate-50"
                          title="Reject with the note above"
                        >Reject with Note</button>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">Actions disabled: only pending payments can be approved or rejected.</div>
                    )}
                  </div>

                  {p.screenshotPath && (
                    <div>
                      <div className="text-sm mb-1">Proof Screenshot</div>
                      <a href={mediaProxyUrl(p.screenshotPath)} target="_blank" rel="noreferrer">
                        <img src={mediaProxyUrl(p.screenshotPath)} alt="Proof" className="h-48 rounded border" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PaymentsReview
