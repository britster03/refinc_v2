"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, Phone, Video, MoreVertical, Smile } from "lucide-react"
import { DatabaseService } from "@/lib/database"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: Date
  attachments?: string[]
}

interface ChatInterfaceProps {
  conversationId: string
  currentUserId: string
  otherUser: {
    id: string
    name: string
    avatar?: string
    role: string
    status: "online" | "offline" | "away"
  }
}

export function ChatInterface({ conversationId, currentUserId, otherUser }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()

    // Subscribe to real-time messages
    const subscription = DatabaseService.subscribeToMessages(conversationId, (payload) => {
      if (payload.eventType === "INSERT") {
        const newMessage = payload.new
        setMessages((prev) => [
          ...prev,
          {
            id: newMessage.id,
            content: newMessage.content,
            senderId: newMessage.sender_id,
            senderName: newMessage.sender?.name || "Unknown",
            senderAvatar: newMessage.sender?.avatar_url,
            timestamp: new Date(newMessage.created_at),
            attachments: newMessage.attachments,
          },
        ])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const data = await DatabaseService.getMessagesByConversationId(conversationId)
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        senderName: msg.sender?.name || "Unknown",
        senderAvatar: msg.sender?.avatar_url,
        timestamp: new Date(msg.created_at),
        attachments: msg.attachments,
      }))
      setMessages(formattedMessages)
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await DatabaseService.createMessage({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
                <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  otherUser.status === "online"
                    ? "bg-green-500"
                    : otherUser.status === "away"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{otherUser.name}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {otherUser.role}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">{otherUser.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[70%] ${
                      message.senderId === currentUserId ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.senderAvatar || "/placeholder.svg"} alt={message.senderName} />
                      <AvatarFallback className="text-xs">{message.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="text-xs opacity-75">
                              📎 {attachment}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs opacity-75 mt-1">
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Smile className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
