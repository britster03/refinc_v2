"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChatInterface } from "@/components/messaging/chat-interface"
import { Search, Plus, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string
    avatar?: string
    role: string
    status: "online" | "offline" | "away"
  }
  lastMessage: {
    content: string
    timestamp: Date
    senderId: string
  }
  unreadCount: number
  referralId?: string
}

const conversations: Conversation[] = [
  {
    id: "1",
    otherUser: {
      id: "emp1",
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Senior Developer",
      status: "online",
    },
    lastMessage: {
      content: "Thanks for your interest in the frontend position. I'd be happy to help with your referral!",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      senderId: "emp1",
    },
    unreadCount: 2,
    referralId: "ref1",
  },
  {
    id: "2",
    otherUser: {
      id: "emp2",
      name: "Michael Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Engineering Manager",
      status: "away",
    },
    lastMessage: {
      content: "I've reviewed your resume and it looks great. Let's schedule a call to discuss the role.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      senderId: "emp2",
    },
    unreadCount: 0,
    referralId: "ref2",
  },
  {
    id: "3",
    otherUser: {
      id: "emp3",
      name: "Emily Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Product Manager",
      status: "offline",
    },
    lastMessage: {
      content: "The product team is looking for someone with your background. Are you still interested?",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      senderId: "emp3",
    },
    unreadCount: 1,
    referralId: "ref3",
  },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations[0])
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with employees about your referral requests
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnread} unread
                </Badge>
              )}
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversations</span>
                <Badge variant="outline">{conversations.length}</Badge>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conversation.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage
                            src={conversation.otherUser.avatar || "/placeholder.svg"}
                            alt={conversation.otherUser.name}
                          />
                          <AvatarFallback>
                            {conversation.otherUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            conversation.otherUser.status === "online"
                              ? "bg-green-500"
                              : conversation.otherUser.status === "away"
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{conversation.otherUser.name}</h4>
                          <div className="flex items-center space-x-2">
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{conversation.otherUser.role}</p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.lastMessage.content}
                        </p>
                        {conversation.referralId && (
                          <Badge variant="outline" className="text-xs mt-2">
                            Referral #{conversation.referralId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatInterface
                conversationId={selectedConversation.id}
                currentUserId="current-user-id" // This would come from auth context
                otherUser={selectedConversation.otherUser}
              />
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
