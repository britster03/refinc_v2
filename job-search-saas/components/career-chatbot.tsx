"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Lightbulb, FileText, Target, MessageSquare, Sparkles, Clock, Star } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "text" | "suggestion" | "action"
}

const quickActions = [
  { icon: FileText, label: "Resume Review", action: "review-resume" },
  { icon: Target, label: "Interview Prep", action: "interview-prep" },
  { icon: Lightbulb, label: "Career Advice", action: "career-advice" },
  { icon: MessageSquare, label: "Cover Letter Help", action: "cover-letter" },
]

const suggestedQuestions = [
  "How can I improve my resume?",
  "What should I ask in an interview?",
  "How do I negotiate salary?",
  "What are the latest industry trends?",
  "How do I transition to a new role?",
]

export function CareerChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm your AI Career Coach. I'm here to help you with resume optimization, interview preparation, career advice, and job search strategies. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(content)
      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateBotResponse = (userInput: string): Message => {
    const input = userInput.toLowerCase()

    let response = ""

    if (input.includes("resume") || input.includes("cv")) {
      response =
        "Great question about resumes! Here are some key tips:\n\n• Use action verbs like 'developed', 'implemented', 'led'\n• Quantify your achievements with numbers and percentages\n• Tailor your resume to each job application\n• Keep it to 1-2 pages maximum\n• Use a clean, ATS-friendly format\n\nWould you like me to review your current resume or help with a specific section?"
    } else if (input.includes("interview")) {
      response =
        "Interview preparation is crucial! Here's how to excel:\n\n• Research the company thoroughly\n• Practice common questions using the STAR method\n• Prepare thoughtful questions to ask them\n• Have specific examples ready for your achievements\n• Practice your elevator pitch\n\nWould you like me to help you practice specific interview questions or scenarios?"
    } else if (input.includes("salary") || input.includes("negotiate")) {
      response =
        "Salary negotiation is an important skill! Here's my advice:\n\n• Research market rates for your role and location\n• Wait for them to make the first offer\n• Consider the entire compensation package\n• Be confident but respectful\n• Have a backup plan\n\nBased on your profile, the market rate for your role is $120k-$150k. Would you like tips on how to present your case?"
    } else if (input.includes("career") || input.includes("advice")) {
      response =
        "I'd love to help with career guidance! Here are some general principles:\n\n• Continuously learn and upskill\n• Build a strong professional network\n• Set clear short and long-term goals\n• Seek feedback regularly\n• Consider lateral moves for growth\n\nWhat specific aspect of your career would you like to focus on?"
    } else {
      response =
        "That's an interesting question! I'm here to help with all aspects of your job search and career development. Could you provide more details about what you'd like assistance with? I can help with:\n\n• Resume and cover letter optimization\n• Interview preparation and practice\n• Career planning and goal setting\n• Job search strategies\n• Salary negotiation\n• Professional development"
    }

    return {
      id: Date.now().toString(),
      content: response,
      sender: "bot",
      timestamp: new Date(),
    }
  }

  const handleQuickAction = (action: string) => {
    const actionMessages = {
      "review-resume": "I'd like you to review my resume and provide feedback",
      "interview-prep": "Can you help me prepare for upcoming interviews?",
      "career-advice": "I need some career guidance and advice",
      "cover-letter": "Help me write a compelling cover letter",
    }

    handleSendMessage(actionMessages[action as keyof typeof actionMessages])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Career Coach
          </CardTitle>
          <CardDescription>Get personalized career advice, interview prep, and job search strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="flex items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Career Coach AI</h3>
                  <p className="text-xs text-muted-foreground">Online • Ready to help</p>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "bot" && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[80%] ${message.sender === "user" ? "order-first" : ""}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {message.sender === "user" && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about your career..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                  className="flex-1"
                />
                <Button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleSendMessage(question)}
                >
                  <span className="text-xs">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { topic: "Resume Optimization", time: "2 hours ago" },
                { topic: "Interview Questions", time: "1 day ago" },
                { topic: "Salary Negotiation", time: "3 days ago" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.topic}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Tip of the Day</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Customize your resume for each application to increase your match score by 25%
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Goal Progress</span>
                </div>
                <p className="text-xs text-muted-foreground">You're 80% towards your monthly application goal!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
