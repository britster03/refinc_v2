"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Clock, Zap, Crown, Gift } from "lucide-react"

interface WaitlistStats {
  totalUsers: number
  todaySignups: number
  averageWaitTime: string
  currentPosition?: number
  estimatedDays: number
}

export function WaitlistRealtime({ userPosition }: { userPosition?: number }) {
  const [stats, setStats] = useState<WaitlistStats>({
    totalUsers: 12847,
    todaySignups: 156,
    averageWaitTime: "2-3 days",
    currentPosition: userPosition,
    estimatedDays: userPosition ? Math.ceil(userPosition / 100) : 0,
  })

  const [realtimeUpdates, setRealtimeUpdates] = useState<string[]>([])

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats((prev) => {
        const newStats = {
          ...prev,
          totalUsers: prev.totalUsers + Math.floor(Math.random() * 5),
          todaySignups: prev.todaySignups + (Math.random() > 0.7 ? 1 : 0),
          currentPosition: prev.currentPosition
            ? Math.max(1, prev.currentPosition - (Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0))
            : undefined,
        }

        // Add real-time update notification
        if (prev.currentPosition && newStats.currentPosition && newStats.currentPosition < prev.currentPosition) {
          const positionChange = prev.currentPosition - newStats.currentPosition
          setRealtimeUpdates((updates) => [
            `You moved up ${positionChange} position${positionChange > 1 ? "s" : ""}! 🎉`,
            ...updates.slice(0, 4),
          ])
        }

        return newStats
      })
    }, 8000)

    // Add periodic updates
    const updateInterval = setInterval(() => {
      const updates = [
        "Sarah J. from Google just joined! 🚀",
        "New employee from Meta verified ✅",
        "Premium conversation unlocked 💎",
        "AI matching algorithm updated 🧠",
        "New company partnership added 🤝",
      ]

      setRealtimeUpdates((prev) => [updates[Math.floor(Math.random() * updates.length)], ...prev.slice(0, 4)])
    }, 12000)

    return () => {
      clearInterval(interval)
      clearInterval(updateInterval)
    }
  }, [])

  const progressPercentage = stats.currentPosition
    ? Math.max(0, 100 - (stats.currentPosition / stats.totalUsers) * 100)
    : 0

  const benefits = [
    { icon: Crown, title: "Early Access", description: "Be first to use new features" },
    { icon: Gift, title: "Free Premium", description: "3 months of premium features" },
    { icon: Zap, title: "Priority Support", description: "Skip the line for help" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total on Waitlist</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold"
                key={stats.totalUsers}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {stats.totalUsers.toLocaleString()}
              </motion.div>
              <p className="text-sm opacity-90">+{stats.todaySignups} today</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Average Wait Time</CardTitle>
              <Clock className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageWaitTime}</div>
              <p className="text-sm opacity-90">Getting faster! ⚡</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">+24%</div>
              <p className="text-sm opacity-90">This week 📈</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Position Card */}
      {stats.currentPosition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-50 to-white border-2 border-purple-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Your Waitlist Position</CardTitle>
              <CardDescription>You're making great progress! 🎯</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <motion.div
                  className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                  key={stats.currentPosition}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  #{stats.currentPosition}
                </motion.div>
                <p className="text-muted-foreground mt-2">in the queue</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress to launch</span>
                  <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="relative">
                  <Progress value={progressPercentage} className="h-3" />
                  <motion.div
                    className="absolute top-0 left-0 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.estimatedDays}</div>
                  <div className="text-sm text-purple-600">days estimated</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{Math.floor(progressPercentage)}%</div>
                  <div className="text-sm text-pink-600">complete</div>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Share & Move Up Faster
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Early Access Benefits</CardTitle>
            <CardDescription>What you'll get as an early member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="text-center p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mb-4">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Real-time Updates */}
      {realtimeUpdates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AnimatePresence>
                  {realtimeUpdates.map((update, index) => (
                    <motion.div
                      key={`${update}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg text-sm"
                    >
                      {update}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
