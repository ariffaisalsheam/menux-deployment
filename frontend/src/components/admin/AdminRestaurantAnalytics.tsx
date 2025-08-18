import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { LoadingSkeleton } from '../common/LoadingSpinner'
import { ErrorDisplay } from '../common/ErrorDisplay'
import { useApi } from '../../hooks/useApi'
import { analyticsAPI, restaurantAPI } from '../../services/api'

interface RestaurantSummary {
  id: number
  name: string
  subscriptionPlan?: 'BASIC' | 'PRO'
  ownerName?: string
}

interface RestaurantAnalytics {
  revenue: { current: number; previous: number; change: number }
  orders: { current: number; previous: number; change: number }
  customers: { current: number; previous: number; change: number }
  rating: { current: number; previous: number; change: number }
  topSellingItems: Array<{ name: string; orders: number; revenue: number }>
  weeklyTrends: Array<{ period: string; revenue: number; orders: number; change: number }>
}

export const AdminRestaurantAnalytics: React.FC = () => {
  const { id } = useParams()
  const restaurantId = Number(id)

  const { data: restaurant, loading: loadingRestaurant } = useApi<RestaurantSummary>(() => restaurantAPI.getRestaurantById(restaurantId))
  const { data: analytics, loading, error, refetch } = useApi<RestaurantAnalytics>(() => analyticsAPI.getRestaurantAnalytics(restaurantId))

  if (loading || loadingRestaurant) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{restaurant?.name || 'Restaurant'} Analytics</h1>
          <p className="text-muted-foreground">Per-restaurant analytics (admin view)</p>
        </div>
        <div className="flex items-center gap-2">
          {restaurant?.subscriptionPlan && (
            <Badge variant={restaurant.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
              {restaurant.subscriptionPlan}
            </Badge>
          )}
          <Link to={`/admin/restaurants`}>
            <Button variant="outline">Back to Restaurants</Button>
          </Link>
        </div>
      </div>

      {!analytics ? (
        <ErrorDisplay error="Analytics not available" onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">৳{Number(analytics.revenue.current || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{Number(analytics.orders.current || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{Number(analytics.customers.current || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Customers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{Number(analytics.rating.current || 0).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Best performers</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topSellingItems?.length ? (
                <ul className="text-sm space-y-2">
                  {analytics.topSellingItems.slice(0, 10).map((t, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>{t.name}</span>
                      <span className="text-muted-foreground">{t.orders} orders · ৳{t.revenue.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default AdminRestaurantAnalytics
