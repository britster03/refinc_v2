"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Camera,
  Users,
  MessageSquare,
  Circle,
  StopCircle,
  MoreVertical,
  Send
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import VideoCallNotifications, { useVideoCallNotifications } from "@/components/video-call-notifications"
import { authClient } from "@/lib/auth"

interface VideoCallInterfaceProps {
  conversationId: string
  participantName: string
  userRole: "employee" | "candidate"
  onEndCall: () => void
  onStartCall?: () => void
  isCallActive: boolean
  currentUserName?: string
}

export default function VideoCallInterface({ 
  conversationId, 
  participantName, 
  userRole, 
  onEndCall,
  onStartCall,
  isCallActive,
  currentUserName
}: VideoCallInterfaceProps) {
  console.log('VideoCallInterface rendered with:', { conversationId, participantName, userRole, isCallActive })
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [audioLevel, setAudioLevel] = useState([75])
  const [videoQuality, setVideoQuality] = useState("HD")
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "reconnecting" | "failed">("connecting")
  const [chatMessages, setChatMessages] = useState<{id: string, sender: string, content: string, timestamp: string}[]>([])
  const [chatMessage, setChatMessage] = useState("")
  const [incomingCall, setIncomingCall] = useState<{callerName: string, callerId: string} | null>(null)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([])

  // Video call notifications
  const {
    notifications,
    dismissNotification,
    notifyUserJoined,
    notifyUserLeft,
    notifyUserMuted,
    notifyUserUnmuted,
    notifyVideoOn,
    notifyVideoOff,
    notifyConnectionIssue,
    notifyReconnected,
    notifyCallStarted,
    notifyCallEnded,
    notifyRecordingStarted,
    notifyRecordingStopped,
    notifyScreenShareStarted,
    notifyScreenShareStopped
  } = useVideoCallNotifications()

  // Initialize WebSocket connection for notifications
  useEffect(() => {
    console.log('useEffect for WebSocket initialization triggered, conversationId:', conversationId)
    console.log('userRole:', userRole, 'isCallActive:', isCallActive)
    
    // Always connect to WebSocket for incoming call notifications
    const connectWebSocket = async () => {
      try {
        console.log('Attempting to initialize WebSocket...')
        await initializeWebSocket()
        console.log('WebSocket initialization successful')
      } catch (error) {
        console.warn("Failed to connect to WebSocket for call notifications:", error)
      }
    }
    
    connectWebSocket()
    
    return () => {
      console.log('Cleaning up WebSocket connection')
      cleanupEverything() // Close everything when component unmounts
    }
  }, []) // Remove conversationId dependency to ensure it runs once

  // Initialize full call when isCallActive becomes true
  useEffect(() => {
    if (isCallActive) {
      initializeCall()
    } else {
      cleanup() // Only cleanup media streams, not WebSocket
    }
    return () => {
      if (!isCallActive) {
        cleanup() // Only cleanup media streams, not WebSocket
      }
    }
  }, [isCallActive])

  // Send call initiation when call becomes active (for the caller)
  useEffect(() => {
    if (isCallActive && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Call became active, sending call_initiate message...')
      // Send call initiation message to notify other participants
      sendWebSocketMessage({
        type: 'call_initiate',
        caller_name: currentUserName || (userRole === "employee" ? "Employee" : "Candidate"),
        timestamp: new Date().toISOString()
      })
    }
  }, [isCallActive, userRole, currentUserName])

  // Also send call_initiate when WebSocket connects if call is already active
  const sendCallInitiateIfNeeded = () => {
    if (isCallActive && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket connected and call is active, sending call_initiate message...')
      sendWebSocketMessage({
        type: 'call_initiate',
        caller_name: currentUserName || (userRole === "employee" ? "Employee" : "Candidate"),
        timestamp: new Date().toISOString()
      })
    }
  }

  const sendWebSocketMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message.type, message)
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.log("Cannot send WebSocket message - not connected:", message.type, 'WebSocket state:', wsRef.current?.readyState)
    }
  }

  const initializeCall = async () => {
    try {
      // WebSocket is already connected from the first useEffect
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Setup peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun.stunprotocol.org:3478' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }

      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream')
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          sendWebSocketMessage({
            type: 'ice_candidate',
            target_user: 'other_participant', // Will be determined by server
            candidate: event.candidate
          })
        } else if (event.candidate) {
          console.log("ICE candidate generated but WebSocket not connected:", event.candidate)
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState
        console.log('Connection state:', state)
        
        if (state === "connected") {
          setConnectionStatus("connected")
          notifyReconnected(participantName)
        } else if (state === "disconnected") {
          setConnectionStatus("reconnecting")
          notifyConnectionIssue(participantName)
        } else if (state === "failed") {
          setConnectionStatus("failed")
          notifyConnectionIssue(participantName)
        }
      }

      setConnectionStatus("connected")
      notifyCallStarted()
      
    } catch (error) {
      console.error("Error initializing call:", error)
      setConnectionStatus("failed")
      
      let title = "Call Connection Failed"
      let description = "Unable to connect to the video call server."
      
      if (error instanceof Error) {
        if (error.message.includes("authentication")) {
          title = "Authentication Error"
          description = "Please log in again to join the call."
        } else if (error.message.includes("getUserMedia") || error.name === "NotAllowedError") {
          title = "Camera/Microphone Error"
          description = "Please allow camera and microphone access to join the call."
        } else if (error.message.includes("video call server")) {
          title = "Connection Error"
          description = "Unable to connect to the video call server. Please check your internet connection."
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive"
      })
    }
  }

  const initializeWebSocket = async () => {
    return new Promise<void>((resolve, reject) => {
      // Get token from authClient
      const session = authClient.getSession()
      const token = session?.access_token
      
      console.log('Initializing WebSocket connection...')
      console.log('Session:', session ? 'Found' : 'Not found')
      console.log('Token:', token ? 'Present' : 'Missing')
      
      if (!token) {
        console.error('No authentication token available')
        reject(new Error("No authentication token available"))
        return
      }
      
      const wsUrl = `ws://localhost:8000/video-calls/ws/${conversationId}?token=${token}`
      console.log('WebSocket URL:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        sendCallInitiateIfNeeded()
        resolve()
      }

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data)
          await handleWebSocketMessage(message)
        } catch (error) {
          console.error('Error handling WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        if (isCallActive) {
          // Attempt to reconnect
          setTimeout(() => {
            initializeWebSocket()
          }, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        console.log('WebSocket readyState:', ws.readyState)
        setConnectionStatus("failed")
        reject(new Error("Failed to connect to video call server"))
      }
    })
  }

  const handleWebSocketMessage = async (message: any) => {
    const { type } = message
    console.log('Received WebSocket message:', type, message)

    switch (type) {
      case 'user_joined':
        notifyUserJoined(message.user_id === 'other_user' ? participantName : 'Unknown')
        break

      case 'user_left':
        notifyUserLeft(message.user_id === 'other_user' ? participantName : 'Unknown')
        break

      case 'incoming_call':
        // Handle incoming call (for the receiver)
        console.log('Incoming call from:', message.caller_name, 'Full message:', message)
        setIncomingCall({
          callerName: message.caller_name || 'Unknown Caller',
          callerId: message.caller_id
        })
        toast({
          title: "Incoming Video Call",
          description: `${message.caller_name || 'Someone'} is calling you`,
          variant: "default"
        })
        break

      case 'call_accepted':
        // Start WebRTC connection process
        await createOffer()
        break

      case 'sdp_offer':
        await handleSdpOffer(message.sdp)
        break

      case 'sdp_answer':
        await handleSdpAnswer(message.sdp)
        break

      case 'ice_candidate':
        await handleIceCandidate(message.candidate)
        break

      case 'media_state_changed':
        handleMediaStateChanged(message)
        break

      case 'screen_share_changed':
        if (message.sharing) {
          notifyScreenShareStarted(participantName)
        } else {
          notifyScreenShareStopped(participantName)
        }
        break

      case 'chat_message':
        addChatMessage(message.user_id, message.content, message.timestamp)
        break

      case 'call_ended':
        endCall()
        break

      default:
        console.log('Unknown message type:', type)
    }
  }

  const createOffer = async () => {
    if (!peerConnectionRef.current) return

    try {
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      
      sendWebSocketMessage({
        type: 'sdp_offer',
        target_user: 'other_participant',
        sdp: offer
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  const handleSdpOffer = async (sdp: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(sdp)
      
      // Process any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate)
      }
      pendingCandidatesRef.current = []

      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      
      sendWebSocketMessage({
        type: 'sdp_answer',
        target_user: 'other_participant',
        sdp: answer
      })
    } catch (error) {
      console.error('Error handling SDP offer:', error)
    }
  }

  const handleSdpAnswer = async (sdp: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(sdp)
      
      // Process any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate)
      }
      pendingCandidatesRef.current = []
    } catch (error) {
      console.error('Error handling SDP answer:', error)
    }
  }

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return

    try {
      if (peerConnectionRef.current.remoteDescription) {
        await peerConnectionRef.current.addIceCandidate(candidate)
      } else {
        // Store candidates until remote description is set
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate))
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  const handleMediaStateChanged = (message: any) => {
    const { user_id, media_type, enabled } = message
    
    if (media_type === 'audio') {
      if (enabled) {
        notifyUserUnmuted(participantName)
      } else {
        notifyUserMuted(participantName)
      }
    } else if (media_type === 'video') {
      if (enabled) {
        notifyVideoOn(participantName)
      } else {
        notifyVideoOff(participantName)
      }
    }
  }

  const addChatMessage = (senderId: string, content: string, timestamp: string) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: senderId === 'current_user' ? 'You' : participantName,
      content,
      timestamp
    }
    setChatMessages(prev => [...prev, newMessage])
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    // Don't close WebSocket here - keep it open for incoming call notifications
  }

  const cleanupEverything = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
        
        // Notify other participants
        sendWebSocketMessage({
          type: 'media_state',
          media_type: 'video',
          enabled: !isVideoEnabled
        })
        
        toast({
          title: isVideoEnabled ? "Camera Off" : "Camera On",
          description: isVideoEnabled ? "Your camera has been turned off" : "Your camera has been turned on",
        })
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
        
        // Notify other participants
        sendWebSocketMessage({
          type: 'media_state',
          media_type: 'audio',
          enabled: !isAudioEnabled
        })
        
        toast({
          title: isAudioEnabled ? "Microphone Off" : "Microphone On",
          description: isAudioEnabled ? "Your microphone has been muted" : "Your microphone has been unmuted",
        })
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        
        // Replace video track
        if (peerConnectionRef.current && localStreamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0]
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          )
          if (sender) {
            await sender.replaceTrack(videoTrack)
          }
        }
        
        setIsScreenSharing(true)
        
        // Notify other participants
        sendWebSocketMessage({
          type: 'screen_share',
          sharing: true
        })
        
        notifyScreenShareStarted('You')

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          sendWebSocketMessage({
            type: 'screen_share',
            sharing: false
          })
          notifyScreenShareStopped('You')
        }
      } else {
        // Stop screen sharing and return to camera
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0]
          const sender = peerConnectionRef.current?.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          )
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack)
          }
        }
        setIsScreenSharing(false)
        
        sendWebSocketMessage({
          type: 'screen_share',
          sharing: false
        })
      }
    } catch (error) {
      console.error("Error with screen sharing:", error)
      toast({
        title: "Screen Share Error",
        description: "Could not start screen sharing",
        variant: "destructive"
      })
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
      notifyRecordingStarted()
    } else {
      setIsRecording(false)
      notifyRecordingStopped()
    }
  }

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return

    sendWebSocketMessage({
      type: 'chat_message',
      content: chatMessage
    })

    // Add to local chat
    addChatMessage('current_user', chatMessage, new Date().toISOString())
    setChatMessage('')
  }

  const acceptCall = async () => {
    if (!incomingCall) return
    
    setIncomingCall(null)
    
    // Send call acceptance message
    sendWebSocketMessage({
      type: 'call_accept',
      timestamp: new Date().toISOString()
    })
    
    // Start the call on this side
    if (onStartCall) {
      onStartCall()
    }
    
    toast({
      title: "Call Accepted",
      description: "Joining the video call...",
      variant: "default"
    })
  }
  
  const rejectCall = () => {
    if (!incomingCall) return
    
    setIncomingCall(null)
    
    // Send call rejection message
    sendWebSocketMessage({
      type: 'call_reject',
      reason: 'Call declined',
      timestamp: new Date().toISOString()
    })
    
    toast({
      title: "Call Declined",
      description: "You declined the incoming call",
      variant: "default"
    })
  }

  const endCall = () => {
    sendWebSocketMessage({
      type: 'call_end'
    })
    
    cleanupEverything() // Close everything including WebSocket when call officially ends
    notifyCallEnded()
    onEndCall()
    
    toast({
      title: "Call Ended",
      description: "The video call has been ended",
    })
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "bg-green-500"
      case "connecting": return "bg-yellow-500"
      case "reconnecting": return "bg-orange-500"
      case "failed": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  if (!isCallActive) {
    return (
      <>
        {/* Incoming Call Dialog - shown even when call is not active */}
        <Dialog open={!!incomingCall} onOpenChange={() => rejectCall()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Incoming Video Call
              </DialogTitle>
              <DialogDescription>
                {incomingCall?.callerName || 'Someone'} is calling you
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center justify-center gap-6 py-6">
              <Button
                variant="destructive"
                size="lg"
                onClick={rejectCall}
                className="rounded-full w-16 h-16"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              
              <Button
                variant="default"
                size="lg"
                onClick={acceptCall}
                className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              The call will start automatically when you accept
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Video Call Notifications */}
        <VideoCallNotifications
          events={notifications}
          onDismiss={dismissNotification}
          position="top-left"
        />
      </>
    )
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
          <div className="text-white">
            <h3 className="font-semibold">{participantName}</h3>
            <p className="text-sm text-gray-300 capitalize">{connectionStatus}</p>
          </div>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Circle className="w-3 h-3 mr-1 fill-current" />
              REC
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-white/20"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-white hover:bg-white/20"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
            You ({userRole})
          </div>
        </div>

        {/* Connection overlay */}
        {connectionStatus !== "connected" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg capitalize">{connectionStatus}...</p>
              {connectionStatus === "failed" && (
                <p className="text-sm text-gray-300 mt-2">Check your internet connection</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4">
          {/* Audio Control */}
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-14 h-14"
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* Video Control */}
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "default" : "secondary"}
            size="lg"
            onClick={toggleScreenShare}
            className="rounded-full w-14 h-14"
          >
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </Button>

          {/* Recording */}
          <Button
            variant={isRecording ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleRecording}
            className="rounded-full w-14 h-14"
          >
            {isRecording ? <StopCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-14 h-14 ml-8"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Call Settings</DialogTitle>
            <DialogDescription>
              Adjust your video call preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Audio Volume</label>
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={audioLevel}
                  onValueChange={setAudioLevel}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Current: {audioLevel[0]}%</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Video Quality</label>
              <div className="flex gap-2">
                {["480p", "720p", "1080p"].map((quality) => (
                  <Button
                    key={quality}
                    variant={videoQuality === quality ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVideoQuality(quality)}
                  >
                    {quality}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Recording Enabled</label>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={toggleRecording}
              >
                {isRecording ? "Stop" : "Start"} Recording
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Chat Sidebar */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-sm border-l border-white/20 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h3 className="text-white font-semibold">Chat</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(false)}
              className="text-white hover:bg-white/20"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`${
                msg.sender === 'You' ? 'ml-auto bg-blue-600' : 'mr-auto bg-gray-700'
              } max-w-[80%] rounded-lg p-3`}>
                <div className="text-white text-sm">{msg.content}</div>
                <div className="text-xs text-gray-300 mt-1">
                  {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-white/20">
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendChatMessage()
                  }
                }}
                placeholder="Type a message..."
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button onClick={sendChatMessage} size="sm" disabled={!chatMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Dialog - also shown during active calls */}
      <Dialog open={!!incomingCall} onOpenChange={() => rejectCall()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              Incoming Video Call
            </DialogTitle>
            <DialogDescription>
              {incomingCall?.callerName || 'Someone'} is calling you
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center gap-6 py-6">
            <Button
              variant="destructive"
              size="lg"
              onClick={rejectCall}
              className="rounded-full w-16 h-16"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            
            <Button
              variant="default"
              size="lg"
              onClick={acceptCall}
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            The call will start automatically when you accept
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Call Notifications */}
      <VideoCallNotifications
        events={notifications}
        onDismiss={dismissNotification}
        position="top-left"
      />
    </div>
  )
} 