"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor,
  Settings,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface VideoCallRoomProps {
  conversationId: string
  participantName: string
  participantAvatar?: string
  userRole: "employee" | "candidate"
  onJoinCall: () => void
  onLeaveRoom: () => void
  sessionTimeRemaining?: number
}

export default function VideoCallRoom({ 
  conversationId, 
  participantName, 
  participantAvatar,
  userRole, 
  onJoinCall,
  onLeaveRoom,
  sessionTimeRemaining = 0
}: VideoCallRoomProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isTestingCamera, setIsTestingCamera] = useState(false)
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [cameraStatus, setCameraStatus] = useState<"checking" | "ready" | "error">("checking")
  const [micStatus, setMicStatus] = useState<"checking" | "ready" | "error">("checking")
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("")
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    initializeDevices()
    return () => {
      cleanup()
    }
  }, [])

  const initializeDevices = async () => {
    try {
      // Request permissions first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      // Get available devices
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      setDevices(deviceList)
      
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput')
      const audioDevices = deviceList.filter(device => device.kind === 'audioinput')
      
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId)
        setCameraStatus("ready")
      } else {
        setCameraStatus("error")
      }
      
      if (audioDevices.length > 0) {
        setSelectedMicrophone(audioDevices[0].deviceId)
        setMicStatus("ready")
      } else {
        setMicStatus("error")
      }
      
      // Set up preview
      streamRef.current = stream
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
      }
      
    } catch (error) {
      console.error("Error accessing media devices:", error)
      setCameraStatus("error")
      setMicStatus("error")
      toast({
        title: "Media Access Required",
        description: "Please allow camera and microphone access to join the video call.",
        variant: "destructive"
      })
    }
  }

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const testCamera = async () => {
    setIsTestingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined }
      })
      
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
      }
      
      setCameraStatus("ready")
      toast({
        title: "Camera Test Successful",
        description: "Your camera is working properly!",
      })
    } catch (error) {
      setCameraStatus("error")
      toast({
        title: "Camera Test Failed",
        description: "There was an issue with your camera.",
        variant: "destructive"
      })
    } finally {
      setIsTestingCamera(false)
    }
  }

  const testMicrophone = async () => {
    setIsTestingMic(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined }
      })
      
      // Test microphone by analyzing audio levels
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      microphone.connect(analyser)
      
      // Check for audio input
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length
        
        if (volume > 0) {
          setMicStatus("ready")
          toast({
            title: "Microphone Test Successful",
            description: "Your microphone is working properly!",
          })
        } else {
          setTimeout(checkAudioLevel, 100)
        }
      }
      
      checkAudioLevel()
      
      // Clean up
      setTimeout(() => {
        audioContext.close()
        stream.getTracks().forEach(track => track.stop())
      }, 2000)
      
    } catch (error) {
      setMicStatus("error")
      toast({
        title: "Microphone Test Failed",
        description: "There was an issue with your microphone.",
        variant: "destructive"
      })
    } finally {
      setIsTestingMic(false)
    }
  }

  const joinVideoCall = () => {
    if (cameraStatus === "error" && micStatus === "error") {
      toast({
        title: "Cannot Join Call",
        description: "Please fix your camera and microphone issues before joining.",
        variant: "destructive"
      })
      return
    }
    
    toast({
      title: "Joining Video Call",
      description: "Connecting you to the video conversation...",
    })
    
    onJoinCall()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
    }
  }

  const videoDevices = devices.filter(device => device.kind === 'videoinput')
  const audioDevices = devices.filter(device => device.kind === 'audioinput')

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Video Preview */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video bg-black relative">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  You ({userRole})
                </Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isVideoEnabled ? "secondary" : "destructive"}
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={isAudioEnabled ? "secondary" : "destructive"}
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Setup */}
        <div className="space-y-6">
          {/* Participant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Video Call Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={participantAvatar || "/placeholder.svg"} alt={participantName} />
                  <AvatarFallback>{participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{participantName}</p>
                  <p className="text-sm text-muted-foreground">
                    Waiting to join the video call
                  </p>
                </div>
              </div>
              
              {sessionTimeRemaining > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Session time remaining: {formatTime(sessionTimeRemaining)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Status */}
          <Card>
            <CardHeader>
              <CardTitle>Device Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(cameraStatus)}
                  <span className="text-sm font-medium">Camera</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testCamera}
                  disabled={isTestingCamera}
                >
                  {isTestingCamera ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
                </Button>
              </div>

              {/* Microphone Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(micStatus)}
                  <span className="text-sm font-medium">Microphone</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testMicrophone}
                  disabled={isTestingMic}
                >
                  {isTestingMic ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
                </Button>
              </div>

              {/* Device Selection */}
              {videoDevices.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Camera</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full p-2 text-sm border rounded"
                  >
                    {videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {audioDevices.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Microphone</label>
                  <select
                    value={selectedMicrophone}
                    onChange={(e) => setSelectedMicrophone(e.target.value)}
                    className="w-full p-2 text-sm border rounded"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={joinVideoCall}
              className="flex-1"
              size="lg"
              disabled={cameraStatus === "checking" || micStatus === "checking"}
            >
              <Video className="w-5 h-5 mr-2" />
              Join Video Call
            </Button>
            <Button
              variant="outline"
              onClick={onLeaveRoom}
              size="lg"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>

          {(cameraStatus === "error" || micStatus === "error") && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">Device Issues Detected</p>
              <p className="text-xs text-yellow-700 mt-1">
                Some of your devices aren't working properly. You can still join the call, but the experience may be limited.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 