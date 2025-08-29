# Test subscription API to verify grace period fixes
try {
    # Login
    $loginData = @{
        username = 'admin'
        password = 'admin123'
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/auth/login' -Method POST -Body $loginData -Headers @{'Content-Type'='application/json'} -TimeoutSec 10
    $token = ($loginResponse.Content | ConvertFrom-Json).token
    Write-Host "✅ Login successful"
    
    # Get all restaurants first to find a valid ID
    $authHeader = "Bearer $token"
    $restaurantsResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/admin/restaurants' -Method GET -Headers @{'Authorization'=$authHeader; 'Content-Type'='application/json'} -TimeoutSec 10
    $restaurants = $restaurantsResponse.Content | ConvertFrom-Json

    if ($restaurants.Count -gt 0) {
        $restaurantId = $restaurants[0].id
        Write-Host "✅ Found restaurant ID: $restaurantId"

        # Get subscription status for this restaurant
        $subResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/admin/subscriptions/$restaurantId" -Method GET -Headers @{'Authorization'=$authHeader; 'Content-Type'='application/json'} -TimeoutSec 10
    } else {
        Write-Host "❌ No restaurants found"
        return
    }
    
    Write-Host "✅ Subscription API Response:"
    $subData = $subResponse.Content | ConvertFrom-Json
    Write-Host $subResponse.Content
    
    # Check if graceDaysRemaining is present
    if ($subData.PSObject.Properties.Name -contains 'graceDaysRemaining') {
        Write-Host "✅ graceDaysRemaining field found: $($subData.graceDaysRemaining)"
    } else {
        Write-Host "❌ graceDaysRemaining field missing"
    }
    
    # Check if graceEndAt is present
    if ($subData.PSObject.Properties.Name -contains 'graceEndAt') {
        Write-Host "✅ graceEndAt field found: $($subData.graceEndAt)"
    } else {
        Write-Host "❌ graceEndAt field missing"
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
}
