"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAdminAuth } from "@/lib/admin-auth"
import { withAdminAuth } from "@/lib/with-admin-auth"
import { useRouter } from "next/navigation"
import { CharacterManagement } from "@/components/admin/character-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2,
  LineChart
} from "lucide-react"
import { usePostHog } from 'posthog-js/react'

// Dashboard stats interface
interface DashboardStats {
  totalUsers: number;
  totalCharacters: number;
  totalConversations: number;
  userGrowth: number;
  characterGrowth: number;
  conversationGrowth: number;
  systemStatus: {
    apiResponseTime: string;
    databaseLoad: string;
    storageUsage: string;
    errorRate: string;
  };
  isLoading: boolean;
}

// PostHog stats interface
interface PostHogStats {
  activeUsers: {
    today: number;
    weekly: number;
    monthly: number;
  };
  pageViews: {
    total: number;
    unique: number;
  };
  events: {
    total: number;
    types: number;
  };
  isLoading: boolean;
}

function AdminDashboardContent() {
  const { logout } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'characters' | 'content'>('overview')
  const router = useRouter()
  const posthog = usePostHog()
  const [posthogStats, setPosthogStats] = useState<PostHogStats>({
    activeUsers: {
      today: 0,
      weekly: 0,
      monthly: 0
    },
    pageViews: {
      total: 0,
      unique: 0
    },
    events: {
      total: 0,
      types: 0
    },
    isLoading: true
  })
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCharacters: 0,
    totalConversations: 0,
    userGrowth: 0,
    characterGrowth: 0,
    conversationGrowth: 0,
    systemStatus: {
      apiResponseTime: "0ms",
      databaseLoad: "0%",
      storageUsage: "0%",
      errorRate: "0%"
    },
    isLoading: true
  })

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardStats();
      fetchPostHogStats();
    }
  }, [activeTab]);

  const fetchPostHogStats = async () => {
    try {
      setPosthogStats(prev => ({ ...prev, isLoading: true }));
      
      // Use our API endpoint that now provides simulated data
      const response = await fetch('/api/admin/analytics?period=7d');
      
      if (!response.ok) {
        throw new Error(`Error fetching analytics: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the state with the data from the API
      setPosthogStats({
        activeUsers: data.activeUsers || { today: 0, weekly: 0, monthly: 0 },
        pageViews: data.pageViews || { total: 0, unique: 0 },
        events: data.events || { total: 0, types: 0 },
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
      setPosthogStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setStats(prevStats => ({ ...prevStats, isLoading: true }));
      const response = await fetch('/api/admin/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const data = await response.json();
      setStats({
        ...data,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
      setStats(prevStats => ({ ...prevStats, isLoading: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
    } catch (error) {
      console.error('Logout error:', error)
      toast.error("Logout failed")
    }
  }

  const navigateToHome = () => {
    router.push('/')
  }

  const navigateToAnalytics = () => {
    router.push('/admin/analytics')
  }

  const handleRefresh = () => {
    if (activeTab === 'overview') {
      fetchDashboardStats();
      fetchPostHogStats();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="overflow-auto">
        <header className="p-4 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{
            activeTab === 'overview' ? 'Dashboard Overview' :
            activeTab === 'users' ? 'User Management' :
            activeTab === 'characters' ? 'Character Management' :
            'Content Moderation'
          }</h1>
          
          {activeTab === 'overview' && (
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={stats.isLoading}>
              {stats.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh Data"}
            </Button>
          )}
        </header>
        
        <main className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {stats.isLoading || posthogStats.isLoading ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading dashboard statistics...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Total Users</CardTitle>
                        <CardDescription>Active users in the platform</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                        <div className={`text-xs mt-1 ${stats.userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stats.userGrowth > 0 ? '+' : ''}{stats.userGrowth}% from last month
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Characters</CardTitle>
                        <CardDescription>Total AI characters created</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalCharacters.toLocaleString()}</div>
                        <div className={`text-xs mt-1 ${stats.characterGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stats.characterGrowth > 0 ? '+' : ''}{stats.characterGrowth}% from last month
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Conversations</CardTitle>
                        <CardDescription>Total conversations started</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalConversations.toLocaleString()}</div>
                        <div className={`text-xs mt-1 ${stats.conversationGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stats.conversationGrowth > 0 ? '+' : ''}{stats.conversationGrowth}% from last month
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>New users over time</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[280px] flex items-center justify-center bg-muted/30 rounded-md">
                        {/* We'll implement actual chart in a future update */}
                        <p className="text-muted-foreground">User growth data available: {stats.totalUsers} users</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>Current system health</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>API Response Time</span>
                          <span className="text-green-500">{stats.systemStatus.apiResponseTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Database Load</span>
                          <span className={parseFloat(stats.systemStatus.databaseLoad) < 50 ? "text-green-500" : parseFloat(stats.systemStatus.databaseLoad) < 80 ? "text-amber-500" : "text-red-500"}>
                            {stats.systemStatus.databaseLoad}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Storage Usage</span>
                          <span className={parseFloat(stats.systemStatus.storageUsage) < 50 ? "text-green-500" : parseFloat(stats.systemStatus.storageUsage) < 80 ? "text-amber-500" : "text-red-500"}>
                            {stats.systemStatus.storageUsage}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Error Rate</span>
                          <span className={parseFloat(stats.systemStatus.errorRate) < 1 ? "text-green-500" : parseFloat(stats.systemStatus.errorRate) < 5 ? "text-amber-500" : "text-red-500"}>
                            {stats.systemStatus.errorRate}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* PostHog Analytics Overview */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>Active Users</CardTitle>
                          <CardDescription>Currently active users</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{posthogStats.activeUsers.today.toLocaleString()}</div>
                          <div className="text-xs mt-1 text-muted-foreground">Today</div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">7-day: </span>
                            <span className="font-medium">{posthogStats.activeUsers.weekly.toLocaleString()}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">30-day: </span>
                            <span className="font-medium">{posthogStats.activeUsers.monthly.toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>Page Views</CardTitle>
                          <CardDescription>Last 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{posthogStats.pageViews.total.toLocaleString()}</div>
                          <div className="text-xs mt-1 text-muted-foreground">Total page views</div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Unique views: </span>
                            <span className="font-medium">{posthogStats.pageViews.unique.toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>Events</CardTitle>
                          <CardDescription>User interactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{posthogStats.events.total.toLocaleString()}</div>
                          <div className="text-xs mt-1 text-muted-foreground">Total events</div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Event types: </span>
                            <span className="font-medium">{posthogStats.events.types}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={navigateToAnalytics}
                        className="mt-2"
                      >
                        <LineChart className="h-4 w-4 mr-2" />
                        View Detailed Analytics
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="users">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-muted-foreground">User table placeholder - Coming soon</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="characters">
              <CharacterManagement />
            </TabsContent>
            
            <TabsContent value="content">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Moderation</CardTitle>
                    <CardDescription>Review and moderate conversations</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-muted-foreground">Content moderation tools - Coming soon</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

// Wrap the component with admin auth protection
const ProtectedAdminDashboard = withAdminAuth(AdminDashboardContent)

// Export a wrapper component that provides the auth context
export default function AdminDashboard() {
  return <ProtectedAdminDashboard />
}