import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { LoadingSkeleton } from '../common/LoadingSpinner'
import { ErrorDisplay } from '../common/ErrorDisplay'
import { useApi } from '../../hooks/useApi'
import { restaurantAPI } from '../../services/api'

interface AdminRestaurant {
  id: number
  name: string
  description?: string
  address: string
  phone?: string
  email?: string
  subscriptionPlan: 'BASIC' | 'PRO'
  status: string
  joinDate?: string
  ownerName?: string
  ownerEmail?: string
  totalOrders: number
  monthlyRevenue: number
}

export const AdminRestaurantDetails: React.FC = () => {
  const { id } = useParams()
  const restaurantId = Number(id)

  const { data: restaurant, loading, error, refetch } = useApi<AdminRestaurant>(() => restaurantAPI.getRestaurantById(restaurantId))

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={2} className="w-64" />
        <LoadingSkeleton lines={8} />
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />
  }

  if (!restaurant) {
    return <ErrorDisplay error="Restaurant not found" onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
          <p className="text-muted-foreground">Restaurant details (admin view)</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={restaurant.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
            {restaurant.subscriptionPlan}
          </Badge>
          <Badge variant={(restaurant.status || '').toLowerCase() === 'active' ? 'default' : 'destructive'}>
            {restaurant.status}
          </Badge>
          <Link to={`/admin/restaurants/${restaurant.id}/subscription`}>
            <Button>Subscription</Button>
          </Link>
          <Link to={`/admin/restaurants`}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Core details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Owner</div>
            <div className="font-medium">{restaurant.ownerName || '—'}</div>
            <div className="text-muted-foreground mt-2">Owner Email</div>
            <div className="font-medium">{restaurant.ownerEmail || '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Phone</div>
            <div className="font-medium">{restaurant.phone || '—'}</div>
            <div className="text-muted-foreground mt-2">Email</div>
            <div className="font-medium">{restaurant.email || '—'}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-muted-foreground">Address</div>
            <div className="font-medium">{restaurant.address}</div>
          </div>
          {restaurant.description && (
            <div className="md:col-span-2">
              <div className="text-muted-foreground">Description</div>
              <div className="font-medium">{restaurant.description}</div>
            </div>
          )}
          <div>
            <div className="text-muted-foreground">Monthly Revenue</div>
            <div className="font-medium">৳{(restaurant.monthlyRevenue || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Orders</div>
            <div className="font-medium">{restaurant.totalOrders ?? 0}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <p className="text-sm text-amber-900">
            Editing is disabled: no admin update endpoint exists yet. This page is read-only for now.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminRestaurantDetails
