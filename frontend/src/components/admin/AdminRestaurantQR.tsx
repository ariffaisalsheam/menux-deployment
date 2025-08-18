import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { LoadingSkeleton } from '../common/LoadingSpinner'
import { ErrorDisplay } from '../common/ErrorDisplay'
import { useApi } from '../../hooks/useApi'
import { restaurantAPI } from '../../services/api'

interface AdminRestaurant {
  id: number
  name: string
}

export const AdminRestaurantQR: React.FC = () => {
  const { id } = useParams()
  const restaurantId = Number(id)

  const { data: restaurant, loading, error, refetch } = useApi<AdminRestaurant>(() => restaurantAPI.getRestaurantById(restaurantId))

  const publicMenuUrl = `${window.location.origin}/menu/${restaurantId}`

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
          <h1 className="text-3xl font-bold tracking-tight">QR Code</h1>
          <p className="text-muted-foreground">Public menu link and QR (admin view)</p>
        </div>
        <Link to={`/admin/restaurants`}>
          <Button variant="outline">Back to Restaurants</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Menu Link</CardTitle>
          <CardDescription>Scan or share to open the restaurant menu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <div className="text-muted-foreground">Restaurant</div>
            <div className="font-medium">{restaurant.name}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <code className="px-2 py-1 rounded bg-muted text-sm break-all flex-1">{publicMenuUrl}</code>
            <a href={publicMenuUrl} target="_blank" rel="noreferrer">
              <Button>Open Public Menu</Button>
            </a>
          </div>

          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            Admin QR customization for arbitrary restaurants isn't available via API yet. Owners can manage QR styles in their dashboard. This page provides the shareable public menu URL for immediate use.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminRestaurantQR
