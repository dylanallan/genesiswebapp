'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LineChart, BarChart, PieChart } from '@/components/ui/charts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow, formatBytes } from '@/lib/utils'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  components: {
    database: ComponentStatus
    storage: ComponentStatus
    edge_functions: ComponentStatus
    auth: ComponentStatus
    ai_services: ComponentStatus
  }
  metrics: {
    response_time: number
    error_rate: number
    active_users: number
    storage_usage: number
  }
}

interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  last_checked: string
  details?: Record<string, unknown>
}

export default function DashboardPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchHealthStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/health-check')
      if (!response.ok) throw new Error('Failed to fetch health status')
      const data = await response.json()
      setHealthStatus(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    const interval = setInterval(fetchHealthStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [refreshKey])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'unhealthy':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  if (loading && !healthStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-genesis-600" />
        <span className="ml-4 text-lg text-gray-600">Loading system status...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setRefreshKey(k => k + 1)}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Badge
            variant={healthStatus?.status === 'healthy' ? 'success' : 'destructive'}
            className="text-sm"
          >
            {healthStatus?.status.toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(k => k + 1)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthStatus?.metrics.response_time.toFixed(2)}ms
                </div>
                <Progress
                  value={Math.min(100, (healthStatus?.metrics.response_time ?? 0) / 1000 * 100)}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(healthStatus?.metrics.error_rate * 100).toFixed(1)}%
                </div>
                <Progress
                  value={healthStatus?.metrics.error_rate * 100}
                  className="mt-2"
                  variant={healthStatus?.metrics.error_rate > 0.1 ? 'destructive' : 'default'}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthStatus?.metrics.active_users}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last 24 hours
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(healthStatus?.metrics.storage_usage ?? 0)}
                </div>
                <Progress
                  value={Math.min(100, (healthStatus?.metrics.storage_usage ?? 0) / (1024 * 1024 * 1024) * 100)}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={[
                  { time: '1h ago', value: 100 },
                  { time: '45m ago', value: 95 },
                  { time: '30m ago', value: 98 },
                  { time: '15m ago', value: 92 },
                  { time: 'Now', value: healthStatus?.status === 'healthy' ? 100 : 0 }
                ]}
                xField="time"
                yField="value"
                height={200}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          {Object.entries(healthStatus?.components ?? {}).map(([name, component]) => (
            <Card key={name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium capitalize">
                    {name.replace('_', ' ')}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(component.status)}
                    <Badge
                      variant={component.status === 'healthy' ? 'success' : 'destructive'}
                    >
                      {component.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Last checked: {formatDistanceToNow(new Date(component.last_checked))} ago
                  </div>
                  {component.message && (
                    <Alert variant={component.status === 'healthy' ? 'default' : 'destructive'}>
                      <AlertDescription>{component.message}</AlertDescription>
                    </Alert>
                  )}
                  {component.details && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Details</h4>
                      <pre className="bg-muted p-2 rounded-md text-sm overflow-auto">
                        {JSON.stringify(component.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={[
                    { range: '0-100ms', count: 45 },
                    { range: '100-500ms', count: 30 },
                    { range: '500ms-1s', count: 15 },
                    { range: '>1s', count: 10 }
                  ]}
                  xField="range"
                  yField="count"
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={[
                    { type: 'Database', value: 30 },
                    { type: 'Storage', value: 20 },
                    { type: 'Auth', value: 15 },
                    { type: 'AI Services', value: 35 }
                  ]}
                  angleField="value"
                  colorField="type"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Storage Usage by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={[
                  { type: 'Audio', usage: healthStatus?.metrics.storage_usage ?? 0 },
                  { type: 'Documents', usage: 1024 * 1024 * 100 },
                  { type: 'DNA Files', usage: 1024 * 1024 * 50 },
                  { type: 'User Uploads', usage: 1024 * 1024 * 200 }
                ]}
                xField="type"
                yField="usage"
                height={300}
                formatter={(value) => formatBytes(value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* This would be populated with actual logs from the database */}
                <div className="text-sm text-muted-foreground">
                  Logs will be implemented in a future update
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 