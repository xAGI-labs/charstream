"use client"

import { useState, useEffect } from "react"
import { usePostHog } from "posthog-js/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, Eye, MousePointerClick } from "lucide-react"

interface RealTimeAnalyticsProps {
  refreshInterval?: number // in milliseconds
}

export function RealTimeAnalytics({ refreshInterval = 60000 }: RealTimeAnalyticsProps) {
  const posthog = usePostHog()
  const [activeUsers, setActiveUsers] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    const fetchRealTimeData = async () => {
      if (posthog) {
        // Send a custom event to PostHog for real-time analytics
        posthog.capture("real_time_analytics", {
          "event_type": "fetch_real_time_data",
          "timestamp": new Date().toISOString(),
        })
      }

      // Simulate fetching real-time data
      const randomOffset = Math.floor(Math.random() * 5) + 3 // Random number between 3-8
      setActiveUsers(randomOffset)
      setLastUpdated(new Date().toLocaleTimeString())
    }

    // Fetch immediately
    fetchRealTimeData()

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchRealTimeData, refreshInterval)

    return () => clearInterval(intervalId)
  }, [posthog, refreshInterval])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Real-Time Analytics</h3>
        <div className="text-xs text-muted-foreground">
          {isLoading ? 
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Updating...
            </span> : 
            <>Last updated: {lastUpdated}</>
          }
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Active Now</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <div className="text-xs text-muted-foreground">Current users on site</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Today's Views</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(50 + Math.random() * 30)}
            </div>
            <div className="text-xs text-muted-foreground">Page views today</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              <span>Current Sessions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(10 + Math.random() * 8)}
            </div>
            <div className="text-xs text-muted-foreground">Active sessions</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
