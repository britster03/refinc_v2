"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Send, Paperclip, Video, Phone, FileText } from "lucide-react"

interface Message {
  id: string
  sender: "employee" | "candidate" | "system"
  content: string
  timestamp: string
  attachments?: { name: string; url: string }[]
}

export default function PremiumConversationPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  const role = searchParams.get("role") || "candidate" // Default to candidate if not specified
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "system",
      content: "Your premium conversation has started. You have 30 minutes remaining.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      sender: "employee",
      content:
        "Hi there! I've reviewed your resume and the job description. What specific aspects would you like feedback on?",
      timestamp: new Date().toISOString(),
    },
  ])
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes in seconds

  // Mock employee data
  const employee = {
    id: 1,
    name: "John Doe",
    role: "Senior Developer",
    company: "Tech Solutions Inc.",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "JD",
  }

  // Mock job data
  const job = {
    position: "Senior Frontend Developer",
    company: "Tech Solutions Inc.",
  }

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: role as "candidate" | "employee",
      content: message,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")

    // Simulate response after a delay from the other party
    setTimeout(() => {
      const responseRole = role === "candidate" ? "employee" : "candidate"
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: responseRole as "employee" | "candidate",
        content:
          role === "candidate" 
            ? "That's a great question. Based on the job description, I'd recommend highlighting your experience with React and TypeScript more prominently. The company is looking for someone who can lead frontend architecture decisions."
            : "Thank you for that insight! I'll definitely emphasize those skills in my application. Could you also review my portfolio structure?",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, response])
    }, 3000)
  }

  return (
    <DashboardLayout role={role as "candidate" | "employee"}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Premium Conversation</h1>
          <p className="text-muted-foreground">
            Session ID: {sessionId || "N/A"} • {job.position} at {job.company}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                    <AvatarFallback>{employee.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{employee.name}</CardTitle>
                    <CardDescription className="text-xs">{employee.role}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(timeRemaining)}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.sender === "system" ? "justify-center" : ""}`}>
                      {msg.sender === "system" ? (
                        <div className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">{msg.content}</div>
                      ) : msg.sender === "employee" ? (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                            <AvatarFallback>{employee.initials}</AvatarFallback>
                          </Avatar>
                          <div className="rounded-md bg-muted px-4 py-2 text-sm max-w-[80%]">
                            {msg.content}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((attachment, i) => (
                                  <div key={i} className="flex items-center gap-2 rounded bg-background p-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs">{attachment.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1" />
                          <div className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground max-w-[80%]">
                            {msg.content}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((attachment, i) => (
                                  <div key={i} className="flex items-center gap-2 rounded bg-primary-foreground/10 p-2">
                                    <FileText className="h-4 w-4 text-primary-foreground" />
                                    <span className="text-xs text-primary-foreground">{attachment.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-primary-foreground/80">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="You" />
                            <AvatarFallback>You</AvatarFallback>
                          </Avatar>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="p-3">
                <div className="flex w-full items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Time Remaining</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Employee</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                      <AvatarFallback>{employee.initials}</AvatarFallback>
                    </Avatar>
                    <span>{employee.name}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Job Position</p>
                  <p className="text-sm">{job.position}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Company</p>
                  <p className="text-sm">{job.company}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Video className="mr-2 h-4 w-4" />
                  Start Video Call
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Share Resume
                </Button>
                <Button variant="outline" className="w-full" disabled={timeRemaining <= 0}>
                  <Clock className="mr-2 h-4 w-4" />
                  Extend Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
