import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { LoadingSpinner } from './LoadingSpinner'
import { paymentsAPI, mediaAPI, mediaProxyUrl, publicSettingsAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import bkashSvg from '../../assets/bkash.svg'

interface ManualPaymentFormProps {
  onPaymentSubmitted?: () => void
  title?: string
  subtitle?: string
  className?: string
}

export const ManualPaymentForm: React.FC<ManualPaymentFormProps> = ({
  onPaymentSubmitted,
  title = "bKash Payment",
  subtitle = "Manual submission for Menu.X Pro",
  className = ""
}) => {
  const { success, error: toastError } = useToast()
  
  // Form state
  const [amount, setAmount] = useState('')
  const [trxId, setTrxId] = useState('')
  const [senderMsisdn, setSenderMsisdn] = useState('')
  const [screenshotPath, setScreenshotPath] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Settings state
  const [merchantNumber, setMerchantNumber] = useState<string>('')
  const [instructionsEn, setInstructionsEn] = useState<string>('')
  const [instructionsBn, setInstructionsBn] = useState<string>('')
  const [lang, setLang] = useState<'EN' | 'BN'>('EN')
  const [minAmount, setMinAmount] = useState<number>(0)
  
  // Form errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  
  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // bKash logo (prefer public webp/png; fallback to bundled SVG)
  const [logoSrc, setLogoSrc] = useState<string>('/bkash.webp')
  const handleLogoError = () => {
    setLogoSrc((prev) => (prev.endsWith('.webp') ? '/bkash.png' : bkashSvg))
  }

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [m, iEn, iBn, min] = await Promise.all([
        publicSettingsAPI.getSetting('PAYMENT_BKASH_MERCHANT_NUMBER').catch(() => null),
        publicSettingsAPI.getSetting('PAYMENT_BKASH_INSTRUCTIONS_EN').catch(() => null),
        publicSettingsAPI.getSetting('PAYMENT_BKASH_INSTRUCTIONS_BN').catch(() => null),
        publicSettingsAPI.getSetting('PAYMENT_BKASH_MIN_AMOUNT').catch(() => null),
      ])

      setMerchantNumber(m?.value || '01744758189')
      
      const enVal = iEn?.value || ''
      const bnVal = iBn?.value || ''
      setInstructionsEn(enVal)
      setInstructionsBn(bnVal)
      
      const minVal = min?.value ? parseInt(min.value, 10) : 1500
      setMinAmount(isNaN(minVal) ? 1500 : minVal)

      // Choose language: prefer stored value if available and valid, otherwise prefer BN when present
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

  const uploadScreenshot = async (file: File) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toastError('File too large (max 2MB)')
      return
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toastError('Invalid file type (PNG, JPG, WebP only)')
      return
    }
    
    setUploadBusy(true)
    try {
      const resp = await mediaAPI.uploadFile(file)
      setScreenshotPath(resp.path)
    } catch (e: any) {
      toastError(e?.message || 'Upload failed')
    } finally {
      setUploadBusy(false)
    }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadScreenshot(file)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!amount.trim()) errors.amount = 'Amount is required'
    else if (isNaN(Number(amount)) || Number(amount) <= 0) errors.amount = 'Invalid amount'
    else if (minAmount && Number(amount) < minAmount) errors.amount = `Minimum amount is ${minAmount} BDT`
    
    if (!trxId.trim()) errors.trxId = 'Transaction ID is required'
    if (!senderMsisdn.trim()) errors.senderMsisdn = 'Sender number is required'
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    if (!validateForm()) return
    
    setSubmitting(true)
    try {
      await paymentsAPI.submitManualPayment({
        amount: Number(amount),
        trxId: trxId.trim(),
        senderMsisdn: senderMsisdn.trim(),
        screenshotPath: screenshotPath || undefined,
      })
      
      success('Payment submitted for review')
      
      // Reset form
      setAmount('')
      setTrxId('')
      setSenderMsisdn('')
      setScreenshotPath('')
      setFieldErrors({})
      
      onPaymentSubmitted?.()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Submission failed'
      setFormError(msg)
      toastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const minAmountText = minAmount ? `Minimum: BDT ${minAmount.toLocaleString()}` : ''

  return (
    <div className={`rounded-xl overflow-hidden border shadow ${className}`}>
      {/* bKash themed header */}
      <div className="bg-gradient-to-r from-[#e72f73] to-[#c2185b] px-4 md:px-6 py-4 text-white flex items-center gap-3">
        <span className="inline-flex items-center justify-center bg-white/90 rounded px-1.5 py-0.5 shadow-sm">
          <img src={logoSrc} onError={handleLogoError} alt="bKash" className="h-6 w-auto" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-xs opacity-90 truncate">{subtitle}</p>
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
              {instructionsEn && instructionsBn && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setLang('EN'); localStorage.setItem('bkash_instr_lang', 'EN') }}
                    className={`text-xs px-2 py-0.5 rounded ${lang === 'EN' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLang('BN'); localStorage.setItem('bkash_instr_lang', 'BN') }}
                    className={`text-xs px-2 py-0.5 rounded ${lang === 'BN' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
                  >
                    বাং
                  </button>
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
  )
}
