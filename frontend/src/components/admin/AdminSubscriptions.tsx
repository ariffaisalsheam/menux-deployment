import React, { useMemo, useState } from 'react'
import { Crown, Search } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { SubscriptionDetailView } from './SubscriptionDetailView';
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { restaurantAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useApi } from '../../hooks/useApi'
import { LoadingSkeleton } from '../common/LoadingSpinner'
import { ErrorDisplay } from '../common/ErrorDisplay'
 

interface AdminRestaurant {
  id: number
  name: string
  ownerName?: string
  subscriptionPlan: 'BASIC' | 'PRO'
  address?: string
}

export const AdminSubscriptions: React.FC = () => {
  // Load restaurants to act on
  const { data: restaurants = [], loading, error, refetch } = useApi<AdminRestaurant[]>(() => restaurantAPI.getAllRestaurants())

  // Filters
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | 'BASIC' | 'PRO'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'TRIALING' | 'ACTIVE' | 'EXPIRED'>('all')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null)

  const [bulkBusy, setBulkBusy] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)
  const { info, success, error: toastError } = useToast()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (restaurants || []).filter(r => {
      const matchesPlan = planFilter === 'all' || r.subscriptionPlan === planFilter
      if (!term) return matchesPlan
      const hay = `${r.name || ''} ${r.ownerName || ''}`.toLowerCase()
      return matchesPlan && hay.includes(term)
    })
  }, [restaurants, search, planFilter])

  const exportLoadedCsv = () => {
    info('Exporting loaded rows…')
    // TODO: Implement export logic
    toastError('CSV export not implemented yet')
  }

  const loadStatusesForAll = async () => {
    if (!filtered || filtered.length === 0) return
    setBulkBusy(true)
    try {
      // This logic will be updated later
      info('Requested status load for listed restaurants…')
    } finally {
      setBulkBusy(false)
      success('Status load triggered')
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={2} className="w-64" />
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-4">
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
      {/* Master List */}
      <div className="space-y-4 xl:border-r xl:pr-6">
        {/* Sticky header + filters */}
        <div className="sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Subscriptions
            </h1>
            <p className="text-muted-foreground">Administer restaurant subscriptions, trials, and grants</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="outline" onClick={loadStatusesForAll} disabled={bulkBusy}>
                    {bulkBusy ? 'Loading…' : 'Load Statuses'}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Fetch subscription status for every listed restaurant</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="secondary" onClick={exportLoadedCsv}>Export Loaded CSV</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Export currently loaded subscription rows as CSV</TooltipContent>
            </Tooltip>
          </div>
          </div>

          {/* Filters */}
          <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center gap-2">
              {/* Centered Search */}
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by restaurant or owner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {/* Filters Toggle */}
              <Button size="sm" variant="outline" onClick={() => setFiltersOpen(v => !v)} aria-expanded={filtersOpen} aria-controls="adminsubs-filters-panel">
                Filters
              </Button>
              {/* Collapsible Filters */}
              {filtersOpen && (
                <div id="adminsubs-filters-panel" className="w-full max-w-sm flex flex-col gap-2 pt-1">
                  <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as 'all' | 'BASIC' | 'PRO')}>
                    <SelectTrigger className="h-9 w-full sm:min-w-[10rem] whitespace-nowrap [&>span]:truncate">
                      <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'TRIALING' | 'ACTIVE' | 'EXPIRED')}>
                    <SelectTrigger className="h-9 w-full sm:min-w-[16rem] whitespace-nowrap [&>span]:truncate" title="Filters only loaded rows by subscription status">
                      <SelectValue placeholder="All Status (loaded rows)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status (loaded rows)</SelectItem>
                      <SelectItem value="TRIALING">TRIALING</SelectItem>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          <div className="space-y-2" role="listbox" aria-label="Restaurants">
            {filtered.map(r => {
              const isSelected = selectedRestaurantId === r.id;
              return (
                <div
                  key={r.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 border-blue-500' : 'hover:bg-muted/40'}`}
                  onClick={() => setSelectedRestaurantId(r.id)}
                  aria-selected={isSelected}
                  role="option"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-sm text-muted-foreground truncate">Owner: {r.ownerName || '—'}</div>
                    </div>
                    <Badge variant={r.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
                      {r.subscriptionPlan}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Detail View */}
      <div className="p-0">
        {selectedRestaurantId ? (
          <SubscriptionDetailView restaurantId={selectedRestaurantId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a restaurant to view details
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default AdminSubscriptions;
