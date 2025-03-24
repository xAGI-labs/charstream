"use client"

import { useState, useEffect } from "react"
import { usePostHog } from "posthog-js/react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth"
import { withAdminAuth } from "@/lib/with-admin-auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  Users, 
  ArrowLeft,
  Shield, 
  Calendar,
  RefreshCcw,
  Loader2,
  LineChart,
  MousePointerClick,
  Eye
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RealTimeAnalytics } from "@/components/admin/real-time-analytics"

// Analytics data interface
interface AnalyticsData {
  activeUsers: {
    today: number;
    weekly: number;
    monthly: number;
  };
  pageViews: {
    total: number;
    unique: number;
    topPages: Array<{
      url: string;
      views: number;
    }>;
  };
  events: {
    total: number;
    types: number;
    topEvents: Array<{
      name: string;
      count: number;
    }>;
  };
  isLoading: boolean;
}

function AdminAnalyticsContent() {
  const posthog = usePostHog()
  const { logout } = useAdminAuth()
  const router = useRouter()
  const [period, setPeriod] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  const [lastRefreshed, setLastRefreshed] = useState<string>('')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    activeUsers: {
      today: 0,
      weekly: 0,
      monthly: 0
    },
    pageViews: {
      total: 0,
      unique: 0,
      topPages: []
    },
    events: {
      total: 0,
      types: 0,
      topEvents: []
    },
    isLoading: true
  })

  useEffect(() => {
    if (posthog) {
      posthog.capture("$pageview", {
        "$current_url": window.location.href,
        "page": "/admin/analytics",
      })
    }
  }, [posthog])

  useEffect(() => {
    fetchAnalyticsData(period)
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchAnalyticsData(period)
    }, 5 * 60 * 1000)
    
    return () => clearInterval(refreshInterval)
  }, [period])

  const fetchAnalyticsData = async (selectedPeriod: string) => {
    try {
      setAnalyticsData(prev => ({ ...prev, isLoading: true }))
      
      // Display timestamp of last refresh
      const now = new Date()
      setLastRefreshed(now.toLocaleTimeString())
      
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      
      if (!response.ok) {
        throw new Error(`Error fetching analytics: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        toast.error(`Analytics error: ${data.error}`)
      }
      
      // Update the state with real data
      setAnalyticsData({
        activeUsers: data.activeUsers || { today: 0, weekly: 0, monthly: 0 },
        pageViews: data.pageViews || { total: 0, unique: 0, topPages: [] },
        events: data.events || { total: 0, types: 0, topEvents: [] },
        isLoading: false
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to load analytics data')
      setAnalyticsData(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleRefresh = () => {
    fetchAnalyticsData(period)
  }

  const navigateBack = () => {
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={navigateBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value)}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-xs text-muted-foreground mr-2">
            {lastRefreshed ? `Last updated: ${lastRefreshed}` : ''}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={analyticsData.isLoading}
          >
            {analyticsData.isLoading ? 
              <Loader2 className="h-4 w-4 animate-spin" /> : 
              <RefreshCcw className="h-4 w-4 mr-2" />
            }
            {!analyticsData.isLoading && "Refresh"}
          </Button>
        </div>
      </header>
      
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="pageviews">
              <Eye className="h-4 w-4 mr-2" />
              Page Views
            </TabsTrigger>
            <TabsTrigger value="events">
              <MousePointerClick className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>
          
          {analyticsData.isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="overview" className="mt-0">
                {/* Add Real-Time Analytics at the top */}
                <RealTimeAnalytics refreshInterval={30000} />
                
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Period Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Active Users</CardTitle>
                        <CardDescription>User activity summary</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analyticsData.activeUsers.today.toLocaleString()}</div>
                        <div className="text-xs mt-1 text-muted-foreground">Today</div>
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">7-day: </span>
                          <span className="font-medium">{analyticsData.activeUsers.weekly.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">30-day: </span>
                          <span className="font-medium">{analyticsData.activeUsers.monthly.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Page Views</CardTitle>
                        <CardDescription>For selected period</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analyticsData.pageViews.total.toLocaleString()}</div>
                        <div className="text-xs mt-1 text-muted-foreground">Total page views</div>
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Unique views: </span>
                          <span className="font-medium">{analyticsData.pageViews.unique.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Events</CardTitle>
                        <CardDescription>User interactions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analyticsData.events.total.toLocaleString()}</div>
                        <div className="text-xs mt-1 text-muted-foreground">Total events</div>
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Event types: </span>
                          <span className="font-medium">{analyticsData.events.types}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Activity Trend</CardTitle>
                      <CardDescription>Active users over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
                      <div className="flex flex-col items-center">
                        <LineChart className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">User activity chart will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Page Views Trend</CardTitle>
                      <CardDescription>Views over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
                      <div className="flex flex-col items-center">
                        <BarChart3 className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Page views chart will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="users" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>User Analytics</CardTitle>
                    <CardDescription>Active users, retention, and engagement</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">User data summary</h3>
                      <p className="mt-2 text-muted-foreground">
                        Daily Active Users: {analyticsData.activeUsers.today.toLocaleString()}<br/>
                        Weekly Active Users: {analyticsData.activeUsers.weekly.toLocaleString()}<br/>
                        Monthly Active Users: {analyticsData.activeUsers.monthly.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pageviews" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Pages</CardTitle>
                    <CardDescription>Most viewed pages in the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.pageViews.topPages && analyticsData.pageViews.topPages.length > 0 ? (
                      <div className="space-y-4">
                        {analyticsData.pageViews.topPages.map((page, index) => (
                          <div key={index} className="flex justify-between items-center pb-2 border-b">
                            <div className="truncate max-w-[70%]">{page.url}</div>
                            <div className="font-medium">{page.views.toLocaleString()} views</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No page view data available for the selected period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="events" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Events</CardTitle>
                    <CardDescription>Most frequent user interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.events.topEvents && analyticsData.events.topEvents.length > 0 ? (
                      <div className="space-y-4">
                        {analyticsData.events.topEvents.map((event, index) => (
                          <div key={index} className="flex justify-between items-center pb-2 border-b">
                            <div className="font-medium">{event.name}</div>
                            <div>{event.count.toLocaleString()} times</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No event data available for the selected period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}

// Wrap the component with admin auth protection
const ProtectedAdminAnalytics = withAdminAuth(AdminAnalyticsContent);

// Export a wrapper component that provides the auth context
export default function AdminAnalytics() {
  return (
    <AdminAuthProvider>
      <ProtectedAdminAnalytics />
    </AdminAuthProvider>
  );
}
