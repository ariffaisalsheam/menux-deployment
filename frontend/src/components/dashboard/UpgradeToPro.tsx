import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paymentsAPI, mediaAPI, mediaProxyUrl, publicSettingsAPI, subscriptionAPI, type RestaurantSubscriptionDTO, type RestaurantSubscriptionEventDTO } from '../../services/api'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import bkashSvg from '../../assets/bkash.svg'

interface MyPaymentItem {
  id: number
  amount: number
  trxId: string
  senderMsisdn: string
  screenshotPath?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  note?: string | null
  createdAt: string
}

const formatBDT = (n?: number) =>
  typeof n === 'number' && !isNaN(n) ? new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n) : ''

const formatDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' })
}

export const UpgradeToPro: React.FC = () => {
  const navigate = useNavigate()
  const [merchantNumber, setMerchantNumber] = useState<string>('')
  const [instructionsEn, setInstructionsEn] = useState<string>('')
  const [instructionsBn, setInstructionsBn] = useState<string>('')
  const [lang, setLang] = useState<'EN' | 'BN'>('EN')
  const [minAmount, setMinAmount] = useState<number>(0)

  // bKash logo (prefer public webp/png; fallback to bundled SVG)
  const [logoSrc, setLogoSrc] = useState<string>('/bkash.webp')
  const handleLogoError = () => {
    setLogoSrc((prev) => (prev.endsWith('.webp') ? '/bkash.png' : bkashSvg))
  }

  const [amount, setAmount] = useState<string>('')
  const [trxId, setTrxId] = useState<string>('')
  const [senderMsisdn, setSenderMsisdn] = useState<string>('')
  const [screenshotPath, setScreenshotPath] = useState<string>('')
  const [uploadBusy, setUploadBusy] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const [formError, setFormError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const [myPayments, setMyPayments] = useState<MyPaymentItem[]>([])
  const [loadingList, setLoadingList] = useState<boolean>(false)

  // Subscription status
  const [subscription, setSubscription] = useState<RestaurantSubscriptionDTO | null>(null)
  const [loadingSub, setLoadingSub] = useState<boolean>(false)
  const [startingTrial, setStartingTrial] = useState<boolean>(false)
  const [subError, setSubError] = useState<string>('')
  const [events, setEvents] = useState<RestaurantSubscriptionEventDTO[]>([])

  // confirmation modal for actions
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null)
  const askConfirm = (text: string, action: () => Promise<void>) => {
    setConfirmText(text)
    setConfirmAction(() => action)
    setConfirmOpen(true)
  }
  const onConfirm = async () => {
    if (confirmAction) await confirmAction()
    setConfirmOpen(false)
    setConfirmAction(null)
    setConfirmText('')
  }

  const loadSettings = async () => {
    try {
      // Fetch primary settings first; only fetch legacy instructions if needed to reduce 404 noise
      const [m, iEn, iBn, min] = await Promise.all([
        publicSettingsAPI.getSetting('PAYMENT_BKASH_MERCHANT_NUMBER').catch(() => null),
        publicSettingsAPI.getSetting('PAYMENT_BKASH_INSTRUCTIONS_EN').catch(() => null),
        publicSettingsAPI.getSetting('PAYMENT_BKASH_INSTRUCTIONS_BN').catch(() => null),
        publicSettingsAPI.getSetting('PAYMENT_BKASH_MIN_AMOUNT').catch(() => null),
      ])
      if (m?.value) setMerchantNumber(m.value)

      // Compute local instruction values to avoid scope issues
      let enVal: string | undefined = iEn?.value
      const bnVal: string | undefined = iBn?.value
      if (!enVal && !bnVal) {
        const iLegacy = await publicSettingsAPI
          .getSetting('PAYMENT_BKASH_INSTRUCTIONS')
          .catch(() => null)
        if (iLegacy?.value) enVal = iLegacy.value
      }
      if (enVal) setInstructionsEn(enVal)
      if (bnVal) setInstructionsBn(bnVal)

      if (min?.value) {
        const parsed = parseFloat(min.value)
        if (!isNaN(parsed)) setMinAmount(parsed)
      }
      // choose language: prefer stored value if available and valid, otherwise prefer BN when present
      try {
        const stored = localStorage.getItem('bkash_instr_lang') as 'EN' | 'BN' | null
        if (stored === 'BN' && bnVal) setLang('BN')
        else if (stored === 'EN' && enVal) setLang('EN')
        else if (bnVal) setLang('BN')
        else setLang('EN')
      } catch (_) {
        if (bnVal) setLang('BN')
        else setLang('EN')
      }
    } catch (_) {
      // ignore, show defaults
    }
  }

  const onStartTrial = async () => {
    setStartingTrial(true)
    setSubError('')
    try {
      const s = await subscriptionAPI.startTrial()
      setSubscription(s)
    } catch (e: any) {
      setSubError(e?.message || 'Unable to start trial')
    } finally {
      setStartingTrial(false)
    }
  }

  const loadMyPayments = async () => {
    setLoadingList(true)
    try {
      const list = await paymentsAPI.listMyPayments()
      setMyPayments(list)
    } catch (e) {
      // ignore error for list
    } finally {
      setLoadingList(false)
    }
  }

  const loadSubscription = async () => {
    setLoadingSub(true)
    setSubError('')
    try {
      const s = await subscriptionAPI.getStatus()
      setSubscription(s)
    } catch (e: any) {
      setSubError(e?.message || 'Failed to load subscription')
    } finally {
      setLoadingSub(false)
    }
  }

  const loadEvents = async () => {
    try {
      const ev = await subscriptionAPI.getEvents()
      setEvents(Array.isArray(ev) ? ev : [])
    } catch (_) {
      setEvents([])
    }
  }

  useEffect(() => {
    loadSettings()
    loadMyPayments()
    loadSubscription()
    loadEvents()
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount > 0'
    if (minAmount && !isNaN(minAmount) && amt < minAmount) errs.amount = `Minimum amount is ${formatBDT(minAmount)}`
    if (!trxId || trxId.trim().length < 4) errs.trxId = 'Enter a valid bKash TRX ID'
    if (!/^01\d{9}$/.test(senderMsisdn)) errs.senderMsisdn = 'Enter a valid Bangladeshi mobile (11 digits, starts with 01)'
    return errs
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      setFormError('Please fix the highlighted errors and try again.')
      return
    }
    setSubmitting(true)
    try {
      await paymentsAPI.submitManualBkash({
        amount: parseFloat(amount),
        trxId: trxId.trim(),
        senderMsisdn: senderMsisdn.trim(),
        screenshotPath: screenshotPath || undefined,
      })
      setAmount('')
      setTrxId('')
      setSenderMsisdn('')
      setScreenshotPath('')
      await loadMyPayments()
    } catch (err: any) {
      setFormError(err?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadScreenshot = async (f: File) => {
    // basic type & size checks
    if (!/image\/(png|jpe?g|webp)/i.test(f.type)) {
      setFormError('Only PNG/JPEG/WebP images are allowed.')
      return
    }
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (f.size > maxSize) {
      setFormError('Image must be 2MB or smaller.')
      return
    }
    setUploadBusy(true)
    setFormError('')
    try {
      const res = await mediaAPI.uploadImage(f)
      if (res?.path) setScreenshotPath(res.path)
    } catch (err: any) {
      setFormError(err?.message || 'Failed to upload image')
    } finally {
      setUploadBusy(false)
    }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    await uploadScreenshot(f)
  }

  const minAmountText = useMemo(() => (minAmount ? `Minimum: ${formatBDT(minAmount)}` : ''), [minAmount])

  // Derived suspension using status OR latest events precedence similar to admin
  const suspendedByEvents = useMemo(() => {
    if (!events || events.length === 0) return false
    const byTime = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    for (const ev of byTime) {
      const t = (ev.eventType || '').toUpperCase()
      if (t.includes('UNSUSPEND') || t.includes('ACTIVATE')) return false
      if (t.includes('SUSPEND')) return true
    }
    return false
  }, [events])
  const isSuspended = (subscription?.status === 'SUSPENDED') || suspendedByEvents
  const hasUsedTrial = !!subscription?.trialStartAt // if trial ever started, do not offer again
  const hasTrialDays = (subscription?.trialDaysRemaining ?? 0) > 0
  const isCurrentlyIneligibleStatus = subscription?.status === 'TRIALING' || subscription?.status === 'ACTIVE'
  const canStartTrial = !isSuspended && !isCurrentlyIneligibleStatus && hasTrialDays && !hasUsedTrial

  // Latest suspension reason (only when currently suspended). Reads the most recent
  // SUSPEND event unless overridden later by UNSUSPEND/ACTIVATE.
  const suspendReason = useMemo(() => {
    if (!isSuspended || !events || events.length === 0) return ''
    const byTime = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    for (const ev of byTime) {
      const t = (ev.eventType || '').toUpperCase()
      if (t.includes('UNSUSPEND') || t.includes('ACTIVATE')) return ''
      if (t.includes('SUSPEND')) {
        const md = ev.metadata
        if (!md) return ''
        try {
          const parsed = JSON.parse(md as string)
          if (parsed && typeof parsed.reason === 'string') return parsed.reason as string
        } catch (_) {
          // metadata may be a plain string
        }
        return typeof md === 'string' ? md : ''
      }
    }
    return ''
  }, [events, isSuspended])

  // Single display badge: Suspended takes precedence over other statuses
  const displayStatus = isSuspended ? 'SUSPENDED' : (subscription?.status ?? 'N/A')
  const badgeClass = useMemo(() => {
    switch (displayStatus) {
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700'
      case 'ACTIVE':
        return 'bg-green-100 text-green-700'
      case 'TRIALING':
        return 'bg-blue-100 text-blue-700'
      case 'GRACE':
        return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED':
      case 'CANCELED':
        return 'bg-slate-200 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }, [displayStatus])

  return (
    <div className="px-4 py-3 md:px-6 md:py-4">
      <div className="mb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard'))}
            >
              Back
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go back</TooltipContent>
        </Tooltip>
      </div>
      <h1 className="text-2xl font-semibold mb-1">Upgrade to Pro</h1>
      <p className="text-sm text-muted-foreground mb-4">Pay manually via bKash and submit your details. Admin will review and activate your Pro plan.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {/* bKash themed payment panel */}
          <div className="rounded-xl overflow-hidden border shadow">
            {/* Brand header */}
            <div className="bg-gradient-to-r from-[#e72f73] to-[#c2185b] px-4 md:px-6 py-4 text-white flex items-center gap-3">
              <span className="inline-flex items-center justify-center bg-white/90 rounded px-1.5 py-0.5 shadow-sm">
                <img src={logoSrc} onError={handleLogoError} alt="bKash" className="h-6 w-auto" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-tight">bKash Payment</h2>
                <p className="text-xs opacity-90 truncate">Manual submission for Menu.X Pro</p>
              </div>
            </div>
            {/* Panel body */}
            <div className="bg-white p-4 md:p-5">

            {merchantNumber && (
              <div className="mb-4 p-3 rounded border bg-pink-50/40">
                <div className="text-sm">Send Money to</div>
                <div className="flex items-center justify-between gap-3 mt-0.5">
                  <div className="text-xl font-semibold tracking-wide">{merchantNumber}</div>
                  <div className="flex items-center gap-2">
                    {copied && <span className="text-xs text-green-600">Copied!</span>}
                    <button
                      type="button"
                      title="Copy merchant number to clipboard"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(merchantNumber)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 1200)
                        } catch (_) {
                          // ignore
                        }
                      }}
                      className="text-xs px-2 py-1 border rounded hover:bg-slate-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {minAmountText && (
                  <div className="text-xs mt-2 inline-flex items-center gap-1 bg-[#e72f73]/10 text-[#c2185b] px-2 py-0.5 rounded">
                    <span>{minAmountText}</span>
                  </div>
                )}
              </div>
            )}

            {(instructionsEn || instructionsBn) && (
              <div className="mb-4 p-3 rounded border bg-slate-50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-sm font-medium">Instructions</div>
                  {(!!instructionsEn && !!instructionsBn) && (
                    <div role="tablist" aria-label="Select language" className="inline-flex rounded border overflow-hidden">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={lang === 'EN'}
                        onClick={() => { setLang('EN'); try { localStorage.setItem('bkash_instr_lang', 'EN') } catch (_) {} }}
                        className={`px-2 py-1 text-xs ${lang === 'EN' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'}`}
                      >EN</button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={lang === 'BN'}
                        onClick={() => { setLang('BN'); try { localStorage.setItem('bkash_instr_lang', 'BN') } catch (_) {} }}
                        className={`px-2 py-1 text-xs border-l ${lang === 'BN' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'}`}
                      >বাংলা</button>
                    </div>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap">{lang === 'BN' ? (instructionsBn || instructionsEn) : (instructionsEn || instructionsBn)}</div>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{formError}</div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Amount (BDT)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setFieldErrors({ ...fieldErrors, amount: '' }) }}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e72f73]/25 focus:border-[#c2185b] ${fieldErrors.amount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 500"
                />
                {fieldErrors.amount && <div className="text-xs text-red-600 mt-1">{fieldErrors.amount}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">bKash TRX ID</label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => { setTrxId(e.target.value); setFieldErrors({ ...fieldErrors, trxId: '' }) }}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e72f73]/25 focus:border-[#c2185b] ${fieldErrors.trxId ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., 9XYZ12345"
                  />
                  {fieldErrors.trxId && <div className="text-xs text-red-600 mt-1">{fieldErrors.trxId}</div>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Your bKash Number</label>
                  <input
                    type="tel"
                    value={senderMsisdn}
                    onChange={(e) => { setSenderMsisdn(e.target.value); setFieldErrors({ ...fieldErrors, senderMsisdn: '' }) }}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e72f73]/25 focus:border-[#c2185b] ${fieldErrors.senderMsisdn ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., 01XXXXXXXXX"
                  />
                  {fieldErrors.senderMsisdn && <div className="text-xs text-red-600 mt-1">{fieldErrors.senderMsisdn}</div>}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Payment Screenshot (optional)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault()
                    setDragOver(false)
                    const f = e.dataTransfer.files?.[0]
                    if (f) await uploadScreenshot(f)
                  }}
                  className={`relative rounded border-2 border-dashed px-3 py-4 text-sm text-center transition ${dragOver ? 'border-[#e72f73] bg-pink-50/40' : 'border-gray-300 hover:border-[#e72f73] hover:bg-pink-50/20'}`}
                >
                  {!screenshotPath ? (
                    <>
                      <div className="mb-2 text-xs text-muted-foreground">PNG, JPG, or WebP up to 2MB</div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-white bg-gradient-to-r from-[#e72f73] to-[#c2185b] hover:opacity-95 disabled:opacity-60 shadow-sm"
                      >
                        Browse file
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={onFileChange}
                        className="sr-only"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <img src={mediaProxyUrl(screenshotPath)} alt="Proof" className="h-36 w-auto rounded border" />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setScreenshotPath('')}
                          className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded text-white bg-gradient-to-r from-[#e72f73] to-[#c2185b] hover:opacity-95 shadow-sm"
                        >
                          Replace
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={onFileChange}
                          className="sr-only"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {uploadBusy && <div className="text-xs text-muted-foreground mt-1">Uploading...</div>}
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded text-white bg-gradient-to-r from-[#e72f73] to-[#c2185b] hover:opacity-95 disabled:opacity-60 shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4">
            <h2 className="text-lg font-medium mb-2">Subscription</h2>
            {subError && (
              <div className="mb-3 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{subError}</div>
            )}
            {loadingSub ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground">Status:</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>{displayStatus}</span>
                </div>
                {isSuspended && (
                  <div className="mt-1 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
                    <div>Your account is suspended; please contact support.</div>
                    {suspendReason && (
                      <div className="mt-1"><span className="font-medium">Reason:</span> {suspendReason}</div>
                    )}
                  </div>
                )}
                {typeof subscription?.trialDaysRemaining === 'number' && subscription.trialDaysRemaining >= 0 && (
                  <div>
                    <span className="text-muted-foreground">Trial days remaining:</span>{' '}
                    <span className="font-medium">{subscription.trialDaysRemaining}</span>
                  </div>
                )}
                {typeof subscription?.paidDaysRemaining === 'number' && subscription.paidDaysRemaining >= 0 && (
                  <div>
                    <span className="text-muted-foreground">Paid days remaining:</span>{' '}
                    <span className="font-medium">{subscription.paidDaysRemaining}</span>
                  </div>
                )}
                {canStartTrial && (
                  <div className="pt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <button
                            type="button"
                            onClick={() => askConfirm('Start free trial for your restaurant?', onStartTrial)}
                            disabled={startingTrial}
                            className="px-3 py-1.5 rounded text-white bg-slate-900 hover:opacity-95 disabled:opacity-60"
                          >
                            {startingTrial ? 'Starting…' : 'Start Free Trial'}
                          </button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Start your free trial period
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-5">
            <h2 className="text-lg font-medium mb-3">My Submissions</h2>
            {loadingList ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div>
                {myPayments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No submissions yet.</div>
                ) : (
                  <div className="border rounded divide-y">
                    {myPayments.map((p) => (
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
                              <img src={mediaProxyUrl(p.screenshotPath)} alt="Proof" className="h-12 w-12 object-cover rounded border" />
                              <a className="text-xs underline" href={mediaProxyUrl(p.screenshotPath)} target="_blank" rel="noreferrer">View full</a>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <span className={`text-xs px-2 py-1 rounded ${
                            p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{confirmText}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={onConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UpgradeToPro
