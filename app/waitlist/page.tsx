"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowRight, Clock, Users, CheckCircle } from "lucide-react"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [waitlistPosition, setWaitlistPosition] = useState(0)
  const [waitlistTotal, setWaitlistTotal] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState("")

  useEffect(() => {
    if (submitted) {
      // Simulate real-time updates to the waitlist position
      const interval = setInterval(() => {
        setWaitlistPosition((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 1
          }
          return prev - 1
        })
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !name || !company || !position) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Set mock waitlist data
      setWaitlistPosition(Math.floor(Math.random() * 10) + 5)
      setWaitlistTotal(Math.floor(Math.random() * 20) + 15)
      setEstimatedTime("1-2 days")

      setSubmitted(true)
    } catch (error) {
      console.error("Waitlist submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Building2 className="h-6 w-6 text-primary" />
            <span>ReferralInc</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container py-12">
        <div className="mx-auto max-w-3xl">
          {!submitted ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Join the Waitlist</CardTitle>
                <CardDescription>
                  We're currently matching candidates with employees. Join the waitlist to get notified when it's your
                  turn.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Target Company</Label>
                    <Select value={company} onValueChange={setCompany} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech-solutions">Tech Solutions Inc.</SelectItem>
                        <SelectItem value="global-innovations">Global Innovations</SelectItem>
                        <SelectItem value="digital-creations">Digital Creations</SelectItem>
                        <SelectItem value="future-systems">Future Systems</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position">Position You're Applying For</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific requirements or preferences"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Join Waitlist"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">You're on the Waitlist!</CardTitle>
                <CardDescription>
                  We'll notify you when we find a suitable employee match for your referral request.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Waitlist Position</span>
                    </div>
                    <Badge variant="outline" className="text-base font-medium">
                      {waitlistPosition} of {waitlistTotal}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Estimated wait time:</span>
                      <span className="font-medium">{estimatedTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Target company:</span>
                      <span className="font-medium">
                        {company === "tech-solutions" && "Tech Solutions Inc."}
                        {company === "global-innovations" && "Global Innovations"}
                        {company === "digital-creations" && "Digital Creations"}
                        {company === "future-systems" && "Future Systems"}
                        {company === "other" && "Other"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Position:</span>
                      <span className="font-medium">{position}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Real-time Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll update your position in real-time as employees become available.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button asChild className="w-full">
                  <Link href="/auth/register">
                    Create an Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Creating an account will allow you to track your waitlist position and get notified when it's your
                  turn.
                </p>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 ReferralInc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
