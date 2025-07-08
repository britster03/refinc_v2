"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import ClientOnly from "@/components/client-only"
import { 
  Building2, 
  ArrowRight, 
  CheckIcon, 
  Users, 
  MessageCircle, 
  Target,
  PlayCircle,
  Star,
  Sparkles,
  Network,
  UserCheck,
  TrendingUp,
  Shield,
  Brain,
  Zap,
  Search,
  BarChart3,
  BrainCircuit,
  Calendar,
  Award,
  Globe,
  Lightbulb
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Add enhanced motion variants for cards at the top
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.95,
    rotateX: 10
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: delay * 0.2,
      ease: [0.16, 1, 0.3, 1], // Custom easing for premium feel
    }
  }),
  hover: {
    y: -12,
    scale: 1.03,
    rotateX: -5,
    rotateY: 2,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  }
}

const featureCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.9
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: delay * 0.15,
      ease: "easeOut"
    }
  }),
  hover: {
    y: -8,
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

// Infinite Carousel Component with Pause on Hover
const InfiniteCarousel = () => {
  const [isPaused, setIsPaused] = useState(false)
  const [currentX, setCurrentX] = useState(0)
  const [animationStartTime, setAnimationStartTime] = useState(Date.now())

  const cardData = [
    {
      icon: BarChart3,
      gradient: "from-orange-400 to-red-500",
      title: "Success Tracking",
      description: "Monitor your referral pipeline and response rates",
      hoverGradient: "from-orange-100/50 to-red-100/50"
    },
    {
      icon: BrainCircuit,
      gradient: "from-purple-400 to-pink-500",
      title: "Smart Insights",
      description: "AI-powered recommendations to improve your approach",
      hoverGradient: "from-purple-100/50 to-pink-100/50"
    },
    {
      icon: Target,
      gradient: "from-green-400 to-emerald-500",
      title: "Goal Setting",
      description: "Set and track your career advancement goals",
      hoverGradient: "from-green-100/50 to-emerald-100/50"
    },
    {
      icon: TrendingUp,
      gradient: "from-blue-400 to-cyan-500",
      title: "Progress Analytics",
      description: "Visualize your career advancement with detailed analytics",
      hoverGradient: "from-blue-100/50 to-cyan-100/50"
    },
    {
      icon: Network,
      gradient: "from-emerald-400 to-teal-500",
      title: "Network Growth",
      description: "Expand your professional network strategically",
      hoverGradient: "from-emerald-100/50 to-teal-100/50"
    },
    {
      icon: Calendar,
      gradient: "from-indigo-400 to-purple-500",
      title: "Interview Prep",
      description: "Get ready for interviews with insider insights",
      hoverGradient: "from-indigo-100/50 to-purple-100/50"
    },
    {
      icon: Award,
      gradient: "from-rose-400 to-pink-500",
      title: "Achievement Tracking",
      description: "Celebrate milestones and career victories",
      hoverGradient: "from-rose-100/50 to-pink-100/50"
    },
    {
      icon: Globe,
      gradient: "from-cyan-400 to-blue-500",
      title: "Global Opportunities",
      description: "Access international career opportunities",
      hoverGradient: "from-cyan-100/50 to-blue-100/50"
    },
    {
      icon: Lightbulb,
      gradient: "from-yellow-400 to-orange-500",
      title: "Career Insights",
      description: "Get personalized career development tips",
      hoverGradient: "from-yellow-100/50 to-orange-100/50"
    }
  ]

  const totalDistance = cardData.length * 300
  const animationDuration = 40000 // 40 seconds in milliseconds

  // Calculate current position when pausing
  const handlePause = () => {
    if (!isPaused) {
      const elapsedTime = (Date.now() - animationStartTime) % animationDuration
      const progress = elapsedTime / animationDuration
      const calculatedX = -(progress * totalDistance)
      setCurrentX(calculatedX)
      setIsPaused(true)
    }
  }

  // Resume animation from current position
  const handleResume = () => {
    if (isPaused) {
      setIsPaused(false)
      setAnimationStartTime(Date.now())
    }
  }

  // Duplicate cards to create seamless loop
  const duplicatedCards = [...cardData, ...cardData, ...cardData]

  return (
    <motion.div 
      className="flex gap-6"
      animate={{ 
        x: isPaused ? currentX : [currentX, currentX - totalDistance]
      }}
      transition={{
        duration: isPaused ? 0 : ((totalDistance + currentX) / totalDistance) * 40,
        repeat: isPaused ? 0 : Infinity,
        ease: "linear"
      }}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
    >
      {duplicatedCards.map((item, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer flex-shrink-0 w-72"
          whileHover={{ 
            y: -8,
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
                     onMouseEnter={handlePause}
           onMouseLeave={handleResume}
        >
          {/* Hover gradient overlay */}
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-br ${item.hoverGradient} opacity-0 group-hover:opacity-100`}
            transition={{ duration: 0.3 }}
          />
          
          <div className="relative z-10">
            <motion.div 
              className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-4`}
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)"
              }}
              transition={{ duration: 0.2 }}
            >
              <item.icon className="w-6 h-6 text-white" />
            </motion.div>
            
            <h4 className="font-semibold text-gray-900 mb-2">
              {item.title}
            </h4>
            
            <p className="text-gray-600 text-sm">
              {item.description}
            </p>
          </div>
    
          {/* Floating micro-decoration */}
          <motion.div 
            className="absolute top-3 right-3 w-2 h-2 bg-gray-200 rounded-full opacity-50"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: index * 0.2
            }}
          />
          
          {/* Shimmer effect on hover */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            initial={false}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// Interactive Profile Builder Component
const InteractiveProfileBuilder = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [profileData, setProfileData] = useState({
    name: '',
    role: '',
    experience: '',
    skills: [] as string[]
  })
  const [isBuilding, setIsBuilding] = useState(false)
  const [profileStrength, setProfileStrength] = useState(0)

  const steps = [
    { field: 'name', placeholder: 'Enter your name...', icon: Users },
    { field: 'role', placeholder: 'Software Engineer', icon: BrainCircuit },
    { field: 'experience', placeholder: '3+ years experience', icon: Award },
    { field: 'skills', placeholder: 'React, Node.js, Python...', icon: Target }
  ]

    useEffect(() => {
    const buildProfile = async () => {
      setIsBuilding(true)
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        setCurrentStep(i)
        
        // Simulate building profile with animated lines
        const step = steps[i]
        if (step.field === 'name') {
          // Simulate name with animated lines
          await new Promise(resolve => setTimeout(resolve, 1500))
          setProfileData(prev => ({ ...prev, name: 'completed' }))
        } else if (step.field === 'role') {
          await new Promise(resolve => setTimeout(resolve, 1500))
          setProfileData(prev => ({ ...prev, role: 'completed' }))
        } else if (step.field === 'experience') {
          await new Promise(resolve => setTimeout(resolve, 1500))
          setProfileData(prev => ({ ...prev, experience: 'completed' }))
        } else if (step.field === 'skills') {
          const skillCount = 4
          for (let j = 0; j < skillCount; j++) {
            await new Promise(resolve => setTimeout(resolve, 375)) // 1500/4 = 375ms per skill
            setProfileData(prev => ({ ...prev, skills: [...prev.skills, `skill-${j}`] }))
          }
        }
        
        // Update profile strength
        setProfileStrength((i + 1) * 25)
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Reset and restart
      setProfileData({ name: '', role: '', experience: '', skills: [] })
      setCurrentStep(0)
      setProfileStrength(0)
      setIsBuilding(false)
      
      // Restart after a brief pause
      setTimeout(buildProfile, 1000)
    }

    buildProfile()
  }, [])

  return (
    <motion.div 
      className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Create your profile</h3>
        <p className="text-gray-600 leading-relaxed">
          Build a comprehensive profile that showcases your unique background, skills, and career aspirations.
        </p>
      </div>

      {/* Interactive Form */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === index
          const isCompleted = currentStep > index
          
          return (
            <motion.div
              key={index}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isActive ? 'border-blue-300 bg-blue-50' : 
                isCompleted ? 'border-green-300 bg-green-50' : 
                'border-gray-200 bg-gray-50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-blue-200' : 
                    isCompleted ? 'bg-green-200' : 
                    'bg-gray-200'
                  }`}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Icon className={`w-4 h-4 ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-500'
                  }`} />
                </motion.div>
                
                                 <div className="flex-1">
                   {step.field === 'name' && (
                     <div className="flex items-center gap-2">
                       {profileData.name === 'completed' ? (
                         <div className="flex items-center gap-1">
                           <motion.div 
                             className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: 64, opacity: 1 }}
                             transition={{ duration: 0.8, ease: "easeOut" }}
                           />
                           <motion.div 
                             className="w-10 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: 40, opacity: 1 }}
                             transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                           />
                         </div>
                       ) : (
                         <div className="flex items-center gap-1">
                           {isActive ? (
                             <span className="text-gray-500 text-sm">
                               Building profile...
                               <span className="animate-pulse ml-1">|</span>
                             </span>
                           ) : (
                             <>
                               <motion.div 
                                 className="w-8 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                                 initial={{ opacity: 0.3 }}
                                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                                 transition={{ duration: 2, repeat: Infinity }}
                               />
                               <motion.div 
                                 className="w-4 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                                 initial={{ opacity: 0.3 }}
                                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                                 transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                               />
                             </>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                   {step.field === 'role' && (
                     <div className="flex items-center gap-2">
                       {profileData.role === 'completed' ? (
                         <div className="flex items-center gap-1">
                           <motion.div 
                             className="w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: 48, opacity: 1 }}
                             transition={{ duration: 0.8, ease: "easeOut" }}
                           />
                           <motion.div 
                             className="w-8 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: 32, opacity: 1 }}
                             transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                           />
                           <motion.div 
                             className="w-6 h-1 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full"
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: 24, opacity: 1 }}
                             transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                           />
                         </div>
                       ) : (
                         <div className="flex items-center gap-1">
                           {isActive ? (
                             <span className="text-gray-500 text-sm">
                               Adding role...
                               <span className="animate-pulse ml-1">|</span>
                             </span>
                           ) : (
                             <>
                               <motion.div 
                                 className="w-6 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                                 initial={{ opacity: 0.3 }}
                                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                                 transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                               />
                               <motion.div 
                                 className="w-10 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                                 initial={{ opacity: 0.3 }}
                                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                                 transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                               />
                             </>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                   {step.field === 'experience' && (
                     <div className="flex items-center gap-2">
                       {profileData.experience === 'completed' ? (
                         <div className="flex items-center gap-1">
                           <motion.div 
                             className="w-14 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: 56, opacity: 1 }}
                             transition={{ duration: 0.8, ease: "easeOut" }}
                           />
                           <motion.div 
                             className="w-8 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: 32, opacity: 1 }}
                             transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                           />
                         </div>
                       ) : (
                         <div className="flex items-center gap-1">
                           {isActive ? (
                             <span className="text-gray-500 text-sm">
                               Adding experience...
                               <span className="animate-pulse ml-1">|</span>
                             </span>
                           ) : (
                             <>
                               <motion.div 
                                 className="w-12 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                                 initial={{ opacity: 0.3 }}
                                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                                 transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                               />
                               <motion.div 
                                 className="w-5 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                                 initial={{ opacity: 0.3 }}
                                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                                 transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                               />
                             </>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                   {step.field === 'skills' && (
                     <div className="flex flex-wrap gap-2">
                       {profileData.skills.map((_, i) => (
                         <motion.div
                           key={i}
                           className="px-3 py-1 bg-blue-100 rounded-md flex items-center gap-1"
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ duration: 0.3 }}
                         >
                           <motion.div 
                             className={`w-8 h-0.5 bg-gradient-to-r ${
                               i === 0 ? 'from-blue-400 to-cyan-500' :
                               i === 1 ? 'from-green-400 to-emerald-500' :
                               i === 2 ? 'from-purple-400 to-pink-500' :
                               'from-orange-400 to-red-500'
                             } rounded-full`}
                             initial={{ width: 0 }}
                             animate={{ width: 32 }}
                             transition={{ duration: 0.4, delay: 0.1 }}
                           />
                           <motion.div 
                             className="w-2 h-0.5 bg-gray-400 rounded-full"
                             initial={{ width: 0 }}
                             animate={{ width: 8 }}
                             transition={{ duration: 0.2, delay: 0.3 }}
                           />
                         </motion.div>
                       ))}
                       {isActive && profileData.skills.length < 4 && (
                         <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-sm animate-pulse">
                           Adding skills...
                         </span>
                       )}
                     </div>
                   )}
                 </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Profile Strength Indicator */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <motion.div 
            className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center"
            animate={{ rotate: isBuilding ? 360 : 0 }}
            transition={{ duration: 2, repeat: isBuilding ? Infinity : 0, ease: "linear" }}
          >
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </motion.div>
                     <div>
             <div className="flex items-center gap-2 mb-1">
               {profileData.name === 'completed' ? (
                 <div className="flex items-center gap-1">
                   <motion.div 
                     className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: 48 }}
                     transition={{ duration: 0.6, ease: "easeOut" }}
                   />
                   <motion.div 
                     className="w-8 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: 32 }}
                     transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                   />
                 </div>
                               ) : (
                  <div className="flex items-center gap-1">
                    <motion.div 
                      className="w-10 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="w-6 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                  </div>
                )}
             </div>
             <div className="flex items-center gap-2">
               {profileData.role === 'completed' ? (
                 <div className="flex items-center gap-1">
                   <motion.div 
                     className="w-10 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: 40 }}
                     transition={{ duration: 0.5, ease: "easeOut" }}
                   />
                   <motion.div 
                     className="w-6 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: 24 }}
                     transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
                   />
                 </div>
                               ) : (
                  <div className="flex items-center gap-1">
                    <motion.div 
                      className="w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div 
                      className="w-4 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                )}
             </div>
           </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Profile Strength</span>
            <motion.span 
              className="font-semibold text-blue-600"
              key={profileStrength}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {profileStrength}%
            </motion.span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${profileStrength}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Success Animation */}
      {profileStrength === 100 && (
        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            Profile Complete! ✨
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Interactive Matching Demo Component
const InteractiveMatchingDemo = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [matches, setMatches] = useState<Array<{company: string, status: string, color: string, match: number}>>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const companies = [
    { company: 'Google', color: 'from-green-400 to-emerald-500' },
    { company: 'Apple', color: 'from-red-400 to-slate-500' },
  ]

  useEffect(() => {
    const runMatchingDemo = async () => {
      setIsAnalyzing(true)
      setMatches([])
      
      // Analyzing phase - matches profile builder timing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Add matches one by one with animations
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i]
        const matchScore = Math.floor(Math.random() * 20) + 80 // 80-99%
        const statuses = ['Available', 'Active', 'Verified']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        setMatches(prev => [...prev, {
          ...company,
          match: matchScore,
          status
        }])
        
        await new Promise(resolve => setTimeout(resolve, 1200)) // 6000ms / 5 companies = 1200ms each
      }
      
      setIsAnalyzing(false)
      
      // Wait before restarting - matches total cycle time
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Restart the demo
      setTimeout(runMatchingDemo, 1000)
    }

    runMatchingDemo()
  }, [])

  return (
    <motion.div 
      className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
          <UserCheck className="w-8 h-8 text-purple-600" />
        </div>
        <h4 className="text-xl font-semibold text-gray-900 mb-3">Smart Connections</h4>
        <p className="text-sm text-gray-600">
          AI analyzes your profile to find the best employee matches
        </p>
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <motion.div 
          className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div>
              <div className="font-medium text-purple-800">Analyzing matches...</div>
              <div className="text-sm text-purple-600">Scanning employee database</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Matches List */}
      <div className="space-y-3">
        {matches.map((item, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group"
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: i * 0.1,
              type: "spring",
              stiffness: 200
            }}
            whileHover={{ scale: 1.02, x: 5 }}
          >
            <div className="flex items-center gap-4">
              <motion.div 
                className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-sm`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </motion.div>
                             <div>
                 <div className="font-medium text-gray-900 mb-1">{item.company}</div>
                 <div className="flex items-center gap-1">
                   <motion.div 
                     className={`w-8 h-0.5 bg-gradient-to-r ${item.color} rounded-full`}
                     initial={{ width: 0, opacity: 0 }}
                     animate={{ width: 32, opacity: 1 }}
                     transition={{ duration: 0.6, delay: i * 0.1 + 0.3 }}
                   />
                   <motion.div 
                     className="w-4 h-0.5 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"
                     initial={{ width: 0, opacity: 0 }}
                     animate={{ width: 16, opacity: 1 }}
                     transition={{ duration: 0.4, delay: i * 0.1 + 0.5 }}
                   />
                   <motion.div 
                     className="w-6 h-0.5 bg-gradient-to-r from-blue-300 to-purple-400 rounded-full"
                     initial={{ width: 0, opacity: 0 }}
                     animate={{ width: 24, opacity: 1 }}
                     transition={{ duration: 0.5, delay: i * 0.1 + 0.7 }}
                   />
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <motion.div 
                  className="font-bold text-purple-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (i * 0.1) + 0.3, type: "spring" }}
                >
                  {item.match}%
                </motion.div>
                <div className="text-xs text-gray-500">match</div>
              </div>
              
              <motion.div 
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  item.status === 'Available' ? 'bg-green-100 text-green-700' :
                  item.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'Verified' ? 'bg-purple-100 text-purple-700' :
                  item.status === 'Online' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-orange-100 text-orange-700'
                }`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i * 0.1) + 0.5 }}
              >
                {item.status}
              </motion.div>
            </div>

            {/* Hover arrow */}
            <motion.div
              className="opacity-0 group-hover:opacity-100 ml-2"
              initial={{ x: -10 }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-4 h-4 text-purple-500" />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Empty states while loading */}
        {matches.length < 5 && isAnalyzing && (
          <>
            {[...Array(5 - matches.length)].map((_, i) => (
              <motion.div
                key={`loading-${i}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="w-20 h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Success indicator */}
      {matches.length === 5 && !isAnalyzing && (
        <motion.div
          className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">
              {matches.length} perfect matches found!
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Interactive Success Tracker Component
const InteractiveSuccessTracker = () => {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [connections, setConnections] = useState(0)
  const [interviews, setInterviews] = useState(0)
  const [offers, setOffers] = useState(0)

  const phases = [
    { name: 'Connecting', duration: 2000, icon: MessageCircle },
    { name: 'Conversations', duration: 1800, icon: Users },
    { name: 'Interviews', duration: 1500, icon: Calendar },
    { name: 'Success', duration: 2000, icon: Award }
  ]

  useEffect(() => {
    const runSuccessDemo = async () => {
      // Reset everything
      setCurrentPhase(0)
      setProgress(0)
      setConnections(0)
      setInterviews(0)
      setOffers(0)

      // Phase 1: Connecting - 3000ms to match other demos
      setCurrentPhase(0)
      for (let i = 0; i <= 100; i += 5) {
        setProgress(i)
        if (i % 20 === 0) {
          setConnections(prev => prev + 1)
        }
        await new Promise(resolve => setTimeout(resolve, 150)) // 20 steps * 150ms = 3000ms
      }

      await new Promise(resolve => setTimeout(resolve, 750))

      // Phase 2: Conversations - 1500ms
      setCurrentPhase(1)
      setProgress(0)
      for (let i = 0; i <= 100; i += 8) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 115)) // ~13 steps * 115ms = ~1500ms
      }

      await new Promise(resolve => setTimeout(resolve, 750))

      // Phase 3: Interviews - 1500ms
      setCurrentPhase(2)
      setProgress(0)
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        if (i >= 40 && interviews < 3) {
          setInterviews(prev => prev + 1)
        }
        await new Promise(resolve => setTimeout(resolve, 150)) // 10 steps * 150ms = 1500ms
      }

      await new Promise(resolve => setTimeout(resolve, 750))

      // Phase 4: Success - 1500ms
      setCurrentPhase(3)
      setProgress(0)
      for (let i = 0; i <= 100; i += 12) {
        setProgress(i)
        if (i >= 60 && offers < 2) {
          setOffers(prev => prev + 1)
        }
        await new Promise(resolve => setTimeout(resolve, 175)) // ~9 steps * 175ms = ~1500ms
      }

      // Hold success state - matches other demos
      await new Promise(resolve => setTimeout(resolve, 4000))

      // Restart
      setTimeout(runSuccessDemo, 1000)
    }

    runSuccessDemo()
  }, [])

  return (
    <motion.div 
      className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-green-600" />
        </div>
        <h4 className="text-xl font-semibold text-gray-900 mb-2">Success Journey</h4>
        <p className="text-sm text-gray-600">
          Track your referral progress in real-time
        </p>
      </div>

      {/* Progress Phases */}
      <div className="space-y-6 mb-8">
        {phases.map((phase, index) => {
          const Icon = phase.icon
          const isActive = currentPhase === index
          const isCompleted = currentPhase > index
          
          return (
            <motion.div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                isActive ? 'bg-green-50 border-green-200' : 
                isCompleted ? 'bg-emerald-50 border-emerald-200' : 
                'bg-gray-50 border-gray-200'
              } border`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-green-200' : 
                  isCompleted ? 'bg-emerald-200' : 
                  'bg-gray-200'
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
              >
                <Icon className={`w-6 h-6 ${
                  isActive ? 'text-green-700' : 
                  isCompleted ? 'text-emerald-700' : 
                  'text-gray-500'
                }`} />
              </motion.div>
              
              <div className="flex-1">
                <div className={`font-medium ${
                  isActive ? 'text-green-900' : 
                  isCompleted ? 'text-emerald-900' : 
                  'text-gray-700'
                }`}>
                  {phase.name}
                </div>
                
                {/* Progress bar for active phase */}
                {isActive && (
                  <div className="mt-2 w-full bg-green-200 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                )}
                
                {/* Completion checkmark */}
                {isCompleted && (
                  <motion.div 
                    className="mt-1 flex items-center gap-1"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs text-emerald-700 font-medium">Complete</span>
                  </motion.div>
                )}
                
                {isActive && (
                  <motion.div 
                    className="mt-1 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-medium">In Progress...</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Success Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="text-2xl font-bold text-blue-600 mb-1"
            key={connections}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {connections}
          </motion.div>
          <div className="text-xs text-gray-600">Connections</div>
          <div className="flex justify-center mt-2">
            <div className="flex items-center gap-1">
              <motion.div 
                className="w-4 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 16 }}
                transition={{ duration: 0.4 }}
              />
              <motion.div 
                className="w-2 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 8 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="text-2xl font-bold text-purple-600 mb-1"
            key={interviews}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {interviews}
          </motion.div>
          <div className="text-xs text-gray-600">Interviews</div>
          <div className="flex justify-center mt-2">
            <div className="flex items-center gap-1">
              <motion.div 
                className="w-3 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 12 }}
                transition={{ duration: 0.4 }}
              />
              <motion.div 
                className="w-5 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="text-2xl font-bold text-green-600 mb-1"
            key={offers}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {offers}
          </motion.div>
          <div className="text-xs text-gray-600">Offers</div>
          <div className="flex justify-center mt-2">
            <div className="flex items-center gap-1">
              <motion.div 
                className="w-6 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 24 }}
                transition={{ duration: 0.6 }}
              />
              <motion.div 
                className="w-3 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 12 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Success celebration */}
      {currentPhase === 3 && progress > 80 && (
        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            🎉 Success!
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Interactive Platform Demo Component
const InteractivePlatformDemo = () => {
  const [searchText, setSearchText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentStep, setCurrentStep] = useState("idle") // idle, typing, searching, results
  
  const searchQuery = "Software Engineer at Google"
  
  // Auto-start the demo sequence and keep repeating
  useEffect(() => {
    const startDemo = async () => {
      while (true) {
        // Reset everything to initial state
        setSearchText("")
        setIsSearching(false)
        setShowResults(false)
        setCurrentStep("idle")
        
        // Wait a bit then start typing - sync with other demos
        await new Promise(resolve => setTimeout(resolve, 1000))
        setCurrentStep("typing")
        
        // Type the search query - 2500ms total
        for (let i = 0; i <= searchQuery.length; i++) {
          setSearchText(searchQuery.slice(0, i))
          await new Promise(resolve => setTimeout(resolve, 100)) // 25 chars * 100ms = 2500ms
        }
        
        // Wait then trigger search
        await new Promise(resolve => setTimeout(resolve, 500))
        setCurrentStep("searching")
        setIsSearching(true)
        
        // Show loading for a bit - matches other analysis phases
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Show results
        setCurrentStep("results")
        setIsSearching(false)
        setShowResults(true)
        
        // Wait and show results for a while before restarting - matches other demos
        await new Promise(resolve => setTimeout(resolve, 4000))
        
        // Brief pause before restarting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    startDemo()
  }, [])

  const employees = [
    { 
      name: (
        <div className="flex items-center gap-1">
          <motion.div 
            className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: 48, 
              opacity: [0, 1, 0.8, 1],
              scaleY: [1, 1.2, 1]
            }}
            transition={{ 
              width: { duration: 0.8, delay: 0.2, ease: "easeOut" },
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              scaleY: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <motion.div 
            className="w-8 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: 32, 
              opacity: [0, 1, 0.7, 1],
              scaleY: [1, 1.3, 1]
            }}
            transition={{ 
              width: { duration: 0.6, delay: 0.5, ease: "easeOut" },
              opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              scaleY: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
            }}
          />
        </div>
      ), 
      role: 'Senior SWE', 
      company: 'Google', 
      match: '98%', 
      color: 'from-green-400 to-emerald-500', 
      initials: (
        <div className="flex flex-col gap-0.5">
          <motion.div 
            className="w-3 h-0.5 bg-white rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 12, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
          />
          <motion.div 
            className="w-2 h-0.5 bg-white rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 8, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.0, ease: "easeOut" }}
          />
        </div>
      )
    },
    { 
      name: (
        <div className="flex items-center gap-1">
          <motion.div 
            className="w-10 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 40, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          />
          <motion.div 
            className="w-16 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 64, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
          />
        </div>
      ), 
      role: 'Staff Engineer', 
      company: 'Google', 
      match: '94%', 
      color: 'from-blue-400 to-cyan-500', 
      initials: (
        <div className="flex flex-col gap-0.5">
          <div className="w-2.5 h-0.5 bg-white rounded-full"></div>
          <div className="w-3 h-0.5 bg-white rounded-full"></div>
        </div>
      )
    },
    { 
      name: (
        <div className="flex items-center gap-1">
          <motion.div 
            className="w-9 h-1 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 36, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          />
          <motion.div 
            className="w-11 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 44, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          />
        </div>
      ), 
      role: 'Principal SWE', 
      company: 'Google', 
      match: '91%', 
      color: 'from-purple-400 to-pink-500', 
      initials: (
        <div className="flex flex-col gap-0.5">
          <div className="w-3 h-0.5 bg-white rounded-full"></div>
          <div className="w-2.5 h-0.5 bg-white rounded-full"></div>
        </div>
      )
    }
  ]

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="relative">
        {/* Main Platform Interface Mockup */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-w-lg mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">ReferralInc</div>
                  <div className="text-blue-100 text-xs">AI Matching</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-white text-xs">Live</span>
              </div>
            </div>
          </div>

          {/* Enhanced Interactive Search Bar */}
          <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 border-b relative">
            {/* Enhanced AI-powered label with better visibility */}
            {/* <motion.div 
              className="absolute top-2 right-2 bg-blue-100/80 backdrop-blur-sm border border-blue-200/60 rounded-full px-2 py-1 text-xs text-blue-700 font-semibold shadow-sm"
              animate={{ 
                y: [0, -2, 0],
                opacity: [0.9, 1, 0.9],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            > */}
              {/* <div className="flex items-center gap-1">
                <motion.div 
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                AI-powered
              </div> */}
            {/* </motion.div> */}
            
            <div className="relative">
              <motion.div 
                className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border cursor-pointer relative overflow-hidden group"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 25px -8px rgba(0,0,0,0.1)" }}
                onClick={() => {
                  if (currentStep === "idle") {
                    setCurrentStep("typing")
                  }
                }}
              >
                {/* Animated background gradient on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-purple-50/50 to-blue-50/0"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                
                {/* Enhanced search icon with animation */}
                <motion.div
                  animate={isSearching ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-4 h-4 text-gray-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </motion.div>
                
                <div className="flex-1 text-sm relative z-10">
                  {currentStep === "idle" && (
                    <motion.span 
                      className="text-gray-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Search for employees...
                    </motion.span>
                  )}
                  {currentStep === "typing" && (
                    <span className="text-gray-700">
                      {searchText}
                      <motion.span
                        className="inline-block w-0.5 h-4 bg-blue-600 ml-1"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      {/* Typing ripple effect */}
                      <motion.span
                        className="absolute inset-0 bg-blue-100/30 rounded-lg"
                        animate={{ 
                          scale: [1, 1.02, 1],
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                      />
                    </span>
                  )}
                  {(currentStep === "searching" || currentStep === "results") && (
                    <motion.span 
                      className="text-gray-700"
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 1 }}
                    >
                      {searchQuery}
                    </motion.span>
                  )}
                </div>

                {/* Enhanced loading animation */}
                {isSearching && (
                  <motion.div 
                    className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center relative"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <motion.div 
                      className="w-2 h-2 bg-blue-600 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                    {/* Loading ring animation */}
                    <motion.div 
                      className="absolute inset-0 border-2 border-blue-300/30 border-t-blue-600 rounded-full"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                )}

                {/* Enhanced success animation */}
                {currentStep === "results" && (
                  <motion.div 
                    className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center relative"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <motion.svg 
                      className="w-3 h-3 text-green-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </motion.svg>
                    {/* Success pulse */}
                    <motion.div 
                      className="absolute inset-0 bg-green-300/50 rounded-full"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 0.5
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
              
              {/* Search suggestion tags */}
              {currentStep === "idle" && (
                <motion.div 
                  className="flex gap-2 mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {["Google", "Meta", "Apple"].map((company, i) => (
                    <motion.div
                      key={company}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-200/50 cursor-pointer"
                      whileHover={{ scale: 1.05, backgroundColor: "#dbeafe" }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        y: [0, -1, 0],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    >
                      {company}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* AI Matching Results - Only show when results are ready */}
          <motion.div 
            className="overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: showResults ? "auto" : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {showResults && (
              <div className="p-4 space-y-3">
                <motion.div 
                  className="flex items-center justify-between mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="text-sm font-semibold text-gray-900">Perfect Matches Found</span>
                  <motion.span 
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    3 active
                  </motion.span>
                </motion.div>

                {/* Employee Cards with Enhanced Staggered Animation */}
                {employees.map((person, i) => (
                  <motion.div 
                    key={i}
                    className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer relative overflow-hidden group"
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.3 + (i * 0.15),
                      ease: "easeOut"
                    }}
                    whileHover={{ scale: 1.02, y: -3 }}
                  >
                    {/* Hover gradient overlay */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-purple-50/0 to-blue-50/0 rounded-xl"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Subtle border animation */}
                    <motion.div 
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `linear-gradient(45deg, ${person.color ? person.color.replace('from-', '').replace('to-', '').replace('-400', '').replace('-500', '') : 'transparent'})`,
                        padding: '1px',
                        opacity: 0
                      }}
                      whileHover={{ opacity: 0.1 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    <div className="relative flex items-center gap-3">
                      <motion.div 
                        className={`w-10 h-10 bg-gradient-to-br ${person.color} rounded-full flex items-center justify-center shadow-sm`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: 0.5 + (i * 0.15),
                          type: "spring",
                          stiffness: 200
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        {person.initials}
                      </motion.div>
                      
                      <div className="flex-1">
                        <motion.div 
                          className="font-medium text-gray-900 text-sm"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + (i * 0.15) }}
                        >
                          {person.name}
                        </motion.div>
                        <motion.div 
                          className="text-xs text-gray-600"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + (i * 0.15) }}
                        >
                          {person.role} • {person.company}
                        </motion.div>
                      </div>
                      
                      <div className="text-right">
                        <motion.div 
                          className="text-sm font-bold text-green-600 relative"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: 0.8 + (i * 0.15),
                            type: "spring",
                            stiffness: 300
                          }}
                        >
                          {person.match}
                          {/* Pulse effect on match percentage */}
                          <motion.div 
                            className="absolute inset-0 bg-green-200 rounded opacity-0"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0, 0.3, 0]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              delay: 1 + (i * 0.15)
                            }}
                          />
                        </motion.div>
                        <motion.div 
                          className="text-xs text-gray-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 + (i * 0.15) }}
                        >
                          match
                        </motion.div>
                      </div>
                      

                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Action Buttons - Show only when results are visible */}
          <motion.div 
            className="overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: showResults ? "auto" : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
          >
            {showResults && (
              <motion.div 
                className="p-4 border-t bg-gray-50 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.2 }}
              >
                <motion.button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 text-sm font-semibold shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 1.4 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    Connect with
                    <div className="flex items-center gap-1">
                      <motion.div 
                        className="w-8 h-0.5 bg-white/80 rounded-full"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 32, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.6, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="w-6 h-0.5 bg-white/80 rounded-full"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 24, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 1.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.button>
                <motion.div 
                  className="flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                >
                  <button className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-lg py-2 text-xs font-medium hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                  <button className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-lg py-2 text-xs font-medium hover:bg-gray-50 transition-colors">
                    Send Message
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Enhanced Floating Success Notifications */}
        <ClientOnly fallback={
          <>
            <div className="absolute -top-4 -right-8 bg-white rounded-xl p-3 shadow-lg border border-green-200 rotate-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500 rounded-full"></div>
                  <div className="w-2 h-0.5 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-green-700">Connection Made!</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-8 bg-white rounded-xl p-3 shadow-lg border border-blue-200 rotate-[-6deg]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-0.5 bg-blue-500 rounded-full"></div>
                  <div className="w-4 h-0.5 bg-cyan-500 rounded-full"></div>
                  <div className="w-2.5 h-0.5 bg-blue-400 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-blue-700">new matches</span>
              </div>
            </div>
          </>
        }>
                      <motion.div 
              className="absolute -top-2 -right-8 bg-white rounded-xl p-3 shadow-lg border border-green-200 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, rotate: 3 }}
            animate={{ 
              opacity: showResults ? 1 : 0, 
              scale: showResults ? 1 : 0.8, 
              rotate: 3,
              y: [0, -5, 0]
            }}
            transition={{ 
              opacity: { duration: 0.6, delay: showResults ? 2 : 0 },
              scale: { duration: 0.6, delay: showResults ? 2 : 0 },
              rotate: { duration: 0.6, delay: showResults ? 2 : 0 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Success shimmer effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/50 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: showResults ? 3 : 0,
                ease: "easeInOut"
              }}
            />
                          <div className="flex items-center gap-2 relative z-10">
                <div className="flex items-center gap-1">
                  <motion.div 
                    className="w-3 h-0.5 bg-green-500 rounded-full relative overflow-hidden"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 12, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 2.2, ease: "easeOut" }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 3,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  <motion.div 
                    className="w-2 h-0.5 bg-emerald-500 rounded-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 8, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 2.4, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs font-medium text-green-700">
                  Connection Made!
                </span>
              </div>
          </motion.div>

          <motion.div 
            className="absolute -bottom-6 -left-8 bg-white rounded-xl p-3 shadow-lg border border-blue-200 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
            animate={{ 
              opacity: showResults ? 1 : 0, 
              scale: showResults ? 1 : 0.8, 
              rotate: -6,
              x: [0, 5, 0]
            }}
            transition={{ 
              opacity: { duration: 0.6, delay: showResults ? 2.5 : 0 },
              scale: { duration: 0.6, delay: showResults ? 2.5 : 0 },
              rotate: { duration: 0.6, delay: showResults ? 2.5 : 0 },
              x: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Match shimmer effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                delay: showResults ? 3.5 : 0,
                ease: "easeInOut"
              }}
            />
                          <div className="flex items-center gap-2 relative z-10">
                <div className="flex items-center gap-1">
                  <motion.div 
                    className="w-1.5 h-0.5 bg-blue-500 rounded-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 6, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 2.7, ease: "easeOut" }}
                  />
                  <motion.div 
                    className="w-4 h-0.5 bg-cyan-500 rounded-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 16, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 2.9, ease: "easeOut" }}
                  />
                  <motion.div 
                    className="w-2.5 h-0.5 bg-blue-400 rounded-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 10, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 3.1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs font-medium text-blue-700">
                  new matches
                </span>
              </div>
          </motion.div>
          
          {/* Additional floating success indicators */}
          <motion.div 
            className="absolute top-1/2 -right-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full p-2 shadow-md border border-purple-200"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: showResults ? [0, 1, 1, 0] : 0,
              scale: showResults ? [0, 1, 1, 0] : 0,
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 3,
              delay: showResults ? 4 : 0,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            <motion.div 
              className="w-1.5 h-1.5 bg-purple-500 rounded-full"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </ClientOnly>

        {/* Background Decorative Elements */}
        <div className="absolute -top-20 -left-20 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl"></div>
      </div>
    </motion.div>
  )
}

// Interactive Features Demo Component
const InteractiveFeaturesDemo = () => {
  const [activeFeature, setActiveFeature] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)
  
  const features = [
    {
      title: "Smart Matching",
      description: "AI finds the best connections",
      icon: Brain,
      color: "from-blue-500 to-indigo-600",
      stats: { 
        value: (
          <div className="flex items-center gap-1">
            <motion.div 
              className="w-4 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 16, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            />
            <motion.div 
              className="w-2 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 8, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
            />
          </div>
        ), 
        label: "match accuracy" 
      }
    },
    {
      title: "Real-time Updates", 
      description: "Live status notifications",
      icon: Zap,
      color: "from-emerald-500 to-green-600",
      stats: { 
        value: (
          <div className="flex items-center gap-1">
            <motion.div 
              className="w-3 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 12, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            />
            <motion.div 
              className="w-1 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 4, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
            />
            <motion.div 
              className="w-2 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 8, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
            />
          </div>
        ), 
        label: "avg response" 
      }
    },
    {
      title: "Verified Network",
      description: "Only authenticated employees",
      icon: Shield,
      color: "from-purple-500 to-pink-600", 
      stats: { 
        value: (
          <div className="flex items-center gap-1">
            <motion.div 
              className="w-5 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 20, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            />
            <motion.div 
              className="w-1.5 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 6, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.9, ease: "easeOut" }}
            />
          </div>
        ), 
        label: "verified users" 
      }
    }
  ]
  
  // Auto-cycle through features and trigger animations
  useEffect(() => {
    let isCancelled = false
    
    const cycleFeatures = async () => {
      while (!isCancelled) {
        for (let i = 0; i < features.length; i++) {
          if (isCancelled) return
          
          setActiveFeature(i)
          setShowAnimation(true)
          
          await new Promise(resolve => setTimeout(resolve, 300))
          if (isCancelled) return
          
          setShowAnimation(false)
          await new Promise(resolve => setTimeout(resolve, 2200))
          if (isCancelled) return
        }
      }
    }
    
    cycleFeatures()
    
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      viewport={{ once: true }}
    >
      <motion.div 
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 relative overflow-hidden"
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-gray-700">Platform features</span>
          </div>
          <div className="flex gap-1">
            {features.map((_, i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  activeFeature === i ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                animate={activeFeature === i ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className={`p-4 rounded-2xl border transition-all duration-500 ${
                activeFeature === i 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm' 
                  : 'bg-gray-50/50 border-gray-200'
              }`}
              animate={{
                scale: activeFeature === i ? 1.02 : 1,
                opacity: activeFeature === i ? 1 : 0.6
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.color} shadow-lg`}
                    animate={activeFeature === i && showAnimation ? { 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{feature.title}</div>
                    <div className="text-xs text-gray-600">{feature.description}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <motion.div 
                    className="text-lg font-bold text-blue-600"
                    animate={activeFeature === i && showAnimation ? { 
                      scale: [1, 1.15, 1] 
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {feature.stats.value}
                  </motion.div>
                  <div className="text-xs text-gray-500">{feature.stats.label}</div>
                </div>
              </div>
              
              {/* Progress bar for active feature */}
              {activeFeature === i && (
                <motion.div 
                  className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div 
                    className={`h-full bg-gradient-to-r ${feature.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom status */}
        <motion.div 
          className="mt-6 pt-4 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">System status</span>
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-green-600">All systems operational</span>
            </div>
          </div>
        </motion.div>

        {/* Floating success indicators */}
        <motion.div 
          className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <CheckIcon className="w-3 h-3 text-white" />
        </motion.div>

        {/* Background pulse animation */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl"
          animate={{ 
            opacity: [0, 0.5, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Floating decorative elements */}
      <motion.div 
        className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-pink-200 to-rose-300 rounded-full"
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-2xl"
        animate={{ 
          rotate: [12, 25, 12],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5
        }}
      />
    </motion.div>
  )
}

// Interactive Navigation Demo Component  
const InteractiveNavigationDemo = () => {
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [isClicking, setIsClicking] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  
  // Auto-navigate through different sections and simulate user interactions
  useEffect(() => {
    let isCancelled = false
    
    const simulateUserFlow = async () => {
      while (!isCancelled) {
        // Start at dashboard
        setCurrentSection("dashboard")
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (isCancelled) return
        
        // Simulate click on "Browse Employees" button
        setIsClicking(true)
        setCursorPosition({ x: 200, y: 300 })
        await new Promise(resolve => setTimeout(resolve, 300))
        setIsClicking(false)
        
        // Navigate to browse section
        setCurrentSection("browse")
        await new Promise(resolve => setTimeout(resolve, 2500))
        if (isCancelled) return
        
        // Simulate click on "My Referrals" tab
        setIsClicking(true)
        setCursorPosition({ x: 120, y: 80 })
        await new Promise(resolve => setTimeout(resolve, 300))
        setIsClicking(false)
        
        // Navigate to referrals section
        setCurrentSection("referrals")
        
        // Show notification after viewing referrals
        await new Promise(resolve => setTimeout(resolve, 1500))
        if (isCancelled) return
        setShowNotification(true)
        await new Promise(resolve => setTimeout(resolve, 2000))
        setShowNotification(false)
        
        await new Promise(resolve => setTimeout(resolve, 1500))
        if (isCancelled) return
        
        // Brief pause before restarting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    simulateUserFlow()
    
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <motion.div 
      className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      {/* App Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">ReferralInc</span>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'browse', label: 'Browse', icon: Users },
            { id: 'referrals', label: 'My Referrals', icon: MessageCircle }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-all duration-200 ${
                currentSection === tab.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 h-96 relative overflow-hidden">
        
        {/* Dashboard Section */}
        {currentSection === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome back!</h3>
                              <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-600">Active requests</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-1.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-600">Connections</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="flex justify-center items-center gap-1 mb-2">
                      <div className="w-4 h-1.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                      <div className="w-3 h-1.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-600">Response rate</div>
                  </div>
                </div>
            </div>
            
            <motion.button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              animate={isClicking && cursorPosition.x === 200 ? { scale: [1, 0.95, 1] } : {}}
            >
              Browse Employees
            </motion.button>
          </motion.div>
        )}

        {/* Browse Section */}
        {currentSection === "browse" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Find Employees</h3>
              <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500 rounded-full"></div>
                  <div className="w-2 h-0.5 bg-emerald-500 rounded-full"></div>
                  <div className="w-1.5 h-0.5 bg-green-400 rounded-full"></div>
                </div>
                online
              </div>
            </div>
            
            {/* Search bar */}
            <div className="relative">
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm placeholder-gray-500"
                placeholder="Search companies or roles..."
                readOnly
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
            
                         {/* Employee cards */}
             <div className="space-y-3">
               {[
                 { 
                   company: (
                     <div className="flex items-center gap-1">
                       <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
                       <div className="w-4 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                     </div>
                   ), 
                   role: 'SWE', 
                   match: (
                     <div className="flex items-center gap-1">
                       <div className="w-3 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
                       <div className="w-2 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                     </div>
                   )
                 },
                 { 
                   company: (
                     <div className="flex items-center gap-1">
                       <div className="w-6 h-0.5 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full"></div>
                       <div className="w-5 h-0.5 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"></div>
                     </div>
                   ), 
                   role: 'PM', 
                   match: (
                     <div className="flex items-center gap-1">
                       <div className="w-2.5 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full"></div>
                       <div className="w-2 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                     </div>
                   )
                 },
                 { 
                   company: (
                     <div className="flex items-center gap-1">
                       <div className="w-12 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                       <div className="w-6 h-0.5 bg-gradient-to-r from-teal-400 to-green-500 rounded-full"></div>
                     </div>
                   ), 
                   role: 'Designer', 
                   match: (
                     <div className="flex items-center gap-1">
                       <div className="w-4 h-0.5 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full"></div>
                       <div className="w-2 h-0.5 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"></div>
                     </div>
                   )
                 }
               ].map((person, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                                     <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                       <div className="flex flex-col gap-0.5">
                         <div className="w-2.5 h-0.5 bg-blue-600 rounded-full"></div>
                         <div className="w-2 h-0.5 bg-blue-600 rounded-full"></div>
                       </div>
                     </div>
                     <div>
                       <div className="font-medium text-gray-900 text-sm">{person.role}</div>
                       <div className="text-xs text-gray-600">{person.company}</div>
                     </div>
                   </div>
                   <div className="text-xs font-semibold text-green-600">{person.match}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Referrals Section */}
        {currentSection === "referrals" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
                         <div className="flex items-center justify-between">
               <h3 className="text-lg font-semibold text-gray-900">My Referrals</h3>
               <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2">
                 <div className="w-2 h-0.5 bg-blue-600 rounded-full"></div>
                 active
               </div>
             </div>
            
                         {/* Referral status list */}
             <div className="space-y-3">
               {[
                 { 
                   status: 'Responded', 
                   color: 'blue', 
                   time: (
                     <div className="flex items-center gap-1">
                       <div className="w-2 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
                       days ago
                     </div>
                   )
                 },
                 { 
                   status: 'Pending', 
                   color: 'orange', 
                   time: (
                     <div className="flex items-center gap-1">
                       <div className="w-2 h-0.5 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full"></div>
                       days ago
                     </div>
                   )
                 },
                 { 
                   status: 'Referred', 
                   color: 'green', 
                   time: (
                     <div className="flex items-center gap-1">
                       <div className="w-2 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                       week ago
                     </div>
                   )
                 }
               ].map((referral, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-gray-600" />
                    </div>
                                         <div>
                       <div className="font-medium text-gray-900 text-sm">
                         <div className="flex items-center gap-1">
                           <div className="w-10 h-0.5 bg-gradient-to-r from-gray-400 to-slate-500 rounded-full"></div>
                           <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></div>
                         </div>
                       </div>
                       <div className="text-xs text-gray-600 flex items-center gap-1">
                         at 
                         <div className="flex items-center gap-1">
                           <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                           <div className="w-5 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
                         </div>
                       </div>
                     </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      referral.color === 'green' ? 'bg-emerald-100 text-emerald-700' :
                      referral.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {referral.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{referral.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Animated Cursor */}
      {isClicking && (
        <motion.div
          className="absolute w-4 h-4 pointer-events-none z-50"
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 0.8, 1] }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full h-full bg-blue-500 rounded-full shadow-lg"></div>
          <motion.div
            className="absolute inset-0 bg-blue-400 rounded-full"
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
          />
        </motion.div>
      )}

      {/* Success Notification */}
      {showNotification && (
        <motion.div
          className="absolute top-4 right-4 bg-white border border-green-200 rounded-xl p-3 shadow-lg z-40"
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">New response!</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Interactive Chat Demo Component
const InteractiveChatDemo = () => {
  const [messages, setMessages] = useState<Array<{id: number, sender: string, text: string, time: string}>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const [messageStep, setMessageStep] = useState(0)
  
  const conversation = [
    {
      id: 1,
      sender: "employee",
      text: "Hi! I'd be happy to help with your Google application. What role are you targeting?",
      time: "2:34 PM"
    },
    {
      id: 2,
      sender: "user",
      text: "Thanks for connecting! I'm looking at Software Engineer L4 positions in the Cloud Platform team.",
      time: "2:35 PM"
    },
    {
      id: 3,
      sender: "employee", 
      text: "Perfect! I can definitely refer you. The team is growing and looking for strong engineers. Want to hop on a quick call?",
      time: "2:36 PM"
    },
    {
      id: 4,
      sender: "user",
      text: "That would be amazing! When works for you?",
      time: "2:37 PM"
    },
    {
      id: 5,
      sender: "employee",
      text: "How about tomorrow at 3 PM? I'll send you the referral form after our chat!",
      time: "2:37 PM"
    }
  ]

  // Auto-start the chat demo sequence and keep repeating
  useEffect(() => {
    let isCancelled = false
    
    const startChatDemo = async () => {
      while (!isCancelled) {
        // Reset everything
        setMessages([])
        setIsTyping(false)
        setCurrentMessage("")
        setMessageStep(0)
        
        // Wait before starting
        await new Promise(resolve => setTimeout(resolve, 1000))
        if (isCancelled) return
        
        // Process each message in the conversation
        for (let i = 0; i < conversation.length; i++) {
          if (isCancelled) return
          
          const message = conversation[i]
          
          // Show typing indicator before each message
          setIsTyping(true)
          setCurrentMessage("")
          setMessageStep(i) // Track which message is being typed
          await new Promise(resolve => setTimeout(resolve, 800))
          if (isCancelled) return
          
          // Type the message character by character
          for (let j = 0; j <= message.text.length; j++) {
            if (isCancelled) return
            setCurrentMessage(message.text.slice(0, j))
            await new Promise(resolve => setTimeout(resolve, 30))
          }
          
          // Hide typing, add completed message
          setIsTyping(false)
          setCurrentMessage("")
          setMessages(prev => [...prev, message])
          
          // Wait before next message
          await new Promise(resolve => setTimeout(resolve, 1000))
          if (isCancelled) return
        }
        
        // Show final state for a while
        await new Promise(resolve => setTimeout(resolve, 3000))
        if (isCancelled) return
        
        // Brief pause before restarting
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    startChatDemo()
    
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <motion.div 
      className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <div className="flex flex-col gap-0.5">
              <div className="w-3 h-0.5 bg-white rounded-full"></div>
              <div className="w-2 h-0.5 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              <div className="flex items-center gap-1">
                <div className="w-8 h-0.5 bg-white/80 rounded-full"></div>
                <div className="w-6 h-0.5 bg-white/80 rounded-full"></div>
              </div>
            </div>
            <div className="text-green-100 text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              Senior Engineer at Google
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <motion.div 
              className="w-2 h-2 bg-green-300 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-green-100 text-xs">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 space-y-3 h-64 overflow-y-auto bg-gray-50">
        {/* Render completed messages */}
        {messages.map((message) => (
          <motion.div 
            key={`${message.id}-${message.sender}-${message.time}`}
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {message.sender !== 'user' ? (
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-xs font-semibold">••</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm max-w-[75%] border border-gray-100">
                  <p className="text-sm leading-relaxed text-gray-800">
                    {message.text}
                  </p>
                  <div className="text-xs mt-1 text-gray-500">
                    {message.time}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm max-w-[75%]">
                  <p className="text-sm leading-relaxed text-white">
                    {message.text}
                  </p>
                  <div className="text-xs mt-1 text-blue-100">
                    {message.time}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing indicator or current message being typed */}
        {isTyping && conversation[messageStep] && (
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {conversation[messageStep].sender !== 'user' ? (
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-xs font-semibold">••</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm min-h-[40px] flex items-center max-w-[75%] border border-gray-100">
                  {currentMessage ? (
                    <div className="text-sm leading-relaxed text-gray-800">
                      {currentMessage}
                      <motion.span
                        className="inline-block w-0.5 h-4 ml-1 bg-gray-600"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm min-h-[40px] flex items-center max-w-[75%]">
                  {currentMessage ? (
                    <div className="text-sm leading-relaxed text-white">
                      {currentMessage}
                      <motion.span
                        className="inline-block w-0.5 h-4 ml-1 bg-white"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/70"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/70"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/70"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <span className="text-gray-500 text-sm flex-1">Type your message...</span>
          <motion.button 
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Enhanced smooth scroll function with offset for sticky navbar
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const navbarHeight = 80 // Approximate navbar height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - navbarHeight

      // Add a subtle loading state
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        button.style.opacity = '0.7'
        setTimeout(() => {
          button.style.opacity = '1'
        }, 300)
      }

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    // Redirect to registration page with email pre-filled
    window.location.href = `/auth/register?email=${encodeURIComponent(email)}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Clay Style */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">ReferralInc</span>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>

            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105 relative group"
            >
              Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105 relative group"
              >
              Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105 relative group"
              >
                How it works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-gray-900 hover:bg-gray-800">Get started</Button>
              </Link>
          </div>
        </div>
        </div>
      </nav>

      {/* Hero Section - Clay Split Screen Style */}
      <section className="relative overflow-hidden">
        {/* Animated Floating Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <ClientOnly fallback={
            <>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl"></div>
            </>
          }>
            {/* Large floating orbs */}
            <motion.div 
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
              animate={{ 
                x: [0, 100, -50, 0],
                y: [0, -80, 60, 0],
                scale: [1, 1.2, 0.8, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"
              animate={{ 
                x: [0, -120, 80, 0],
                y: [0, 70, -90, 0],
                scale: [1, 0.7, 1.3, 1],
                rotate: [0, -180, -360]
              }}
              transition={{ 
                duration: 25, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div 
              className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl"
              animate={{ 
                x: [0, 150, -100, 0],
                y: [0, -60, 80, 0],
                scale: [1, 1.1, 0.9, 1],
                rotate: [0, 90, 270, 360]
              }}
              transition={{ 
                duration: 18, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 4
              }}
            />
            
            {/* Medium floating orbs */}
            <motion.div 
              className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-emerald-400/12 to-teal-500/12 rounded-full blur-2xl"
              animate={{ 
                x: [0, -80, 60, 0],
                y: [0, 100, -70, 0],
                scale: [1, 1.4, 0.6, 1],
                rotate: [0, 270, 180, 360]
              }}
              transition={{ 
                duration: 22, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div 
              className="absolute top-10 right-10 w-56 h-56 bg-gradient-to-br from-orange-400/8 to-red-500/8 rounded-full blur-2xl"
              animate={{ 
                x: [0, 90, -120, 0],
                y: [0, -50, 70, 0],
                scale: [1, 0.8, 1.2, 1],
                rotate: [0, -90, -270, -360]
              }}
              transition={{ 
                duration: 24, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 6
              }}
            />
            
            {/* Small floating orbs */}
            <motion.div 
              className="absolute bottom-10 right-1/2 w-48 h-48 bg-gradient-to-br from-indigo-400/15 to-purple-400/15 rounded-full blur-xl"
              animate={{ 
                x: [0, -60, 40, 0],
                y: [0, 90, -110, 0],
                scale: [1, 1.3, 0.7, 1],
                rotate: [0, 120, 240, 360]
              }}
              transition={{ 
                duration: 16, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 3
              }}
            />
            <motion.div 
              className="absolute top-1/3 left-10 w-40 h-40 bg-gradient-to-br from-rose-400/10 to-pink-400/10 rounded-full blur-xl"
              animate={{ 
                x: [0, 70, -80, 0],
                y: [0, -40, 60, 0],
                scale: [1, 0.9, 1.1, 1],
                rotate: [0, -60, -120, -180]
              }}
              transition={{ 
                duration: 19, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 5
              }}
            />
            
            {/* Tiny accent orbs */}
            <motion.div 
              className="absolute bottom-1/3 left-1/2 w-32 h-32 bg-gradient-to-br from-yellow-400/8 to-orange-400/8 rounded-full blur-lg"
              animate={{ 
                x: [0, 50, -30, 0],
                y: [0, -80, 50, 0],
                scale: [1, 1.5, 0.5, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 14, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 7
              }}
            />
            <motion.div 
              className="absolute top-2/3 right-20 w-36 h-36 bg-gradient-to-br from-violet-400/12 to-blue-400/12 rounded-full blur-lg"
              animate={{ 
                x: [0, -40, 70, 0],
                y: [0, 60, -40, 0],
                scale: [1, 0.6, 1.4, 1],
                rotate: [0, -240, -120, -360]
              }}
              transition={{ 
                duration: 21, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 8
              }}
            />
          </ClientOnly>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
              <div className="space-y-8">
              <ClientOnly fallback={
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700">AI-powered referral platform</span>
                </div>
              }>
                <motion.div 
                  className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm font-medium text-blue-700">AI-powered referral platform</span>
                </motion.div>
              </ClientOnly>

                <div className="space-y-6">
                <ClientOnly fallback={
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                    Turn connections into{" "}
                    <span className="relative">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        career opportunities
                      </span>
                      {/* Clay-style underline decoration */}
                      <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 300 12" fill="none">
                        <path 
                          d="M5 6C50 2 100 10 150 6C200 2 250 10 295 6" 
                          stroke="url(#gradient)" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </span>
                  </h1>
                }>
                  <motion.h1 
                    className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                  >
                    Turn connections into{" "}
                    <span className="relative">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        career opportunities
                      </span>
                      {/* Clay-style underline decoration */}
                      <motion.svg 
                        className="absolute -bottom-2 left-0 w-full h-3" 
                        viewBox="0 0 300 12" 
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1 }}
                      >
                        <motion.path 
                          d="M5 6C50 2 100 10 150 6C200 2 250 10 295 6" 
                          stroke="url(#gradient)" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </motion.svg>
                    </span>
                  </motion.h1>
                </ClientOnly>

                <ClientOnly fallback={
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Access verified employee networks and AI-powered matching. Build meaningful relationships that lead to your dream job.
                </p>
              }>
                <motion.p 
                  className="text-xl text-gray-600 leading-relaxed max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Access verified employee networks and AI-powered matching. Build meaningful relationships that lead to your dream job.
                </motion.p>
              </ClientOnly>
                </div>

              <ClientOnly fallback={
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8">
                      Start Connecting
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="border-gray-300">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Watch demo
                  </Button>
                </div>
              }>
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8">
                      Start Connecting
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="border-gray-300">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Watch demo
                  </Button>
                </motion.div>
              </ClientOnly>

              {/* Beta Status */}
              <ClientOnly fallback={
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">Beta Live</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Limited spots</span> available for early access
                  </div>
                </div>
              }>
                <motion.div 
                  className="flex items-center gap-6 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    <motion.div 
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-sm font-medium text-green-700">Beta Live</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Limited spots</span> available for early access
                  </div>
                </motion.div>
              </ClientOnly>
              </div>

                        {/* Right Visual - Interactive Platform Demo */}
            <ClientOnly fallback={<div className="relative"></div>}>
              <InteractivePlatformDemo />
            </ClientOnly>
            </div>
          </div>
        </section>

             {/* Features Section - Clay's Creative Layout */}
       <section id="features" className="relative py-32 overflow-hidden">
         {/* Enhanced gradient background with floating animations */}
         <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30"></div>
         
         {/* Enhanced floating gradient orbs */}
         <div className="absolute inset-0 overflow-hidden">
         <ClientOnly fallback={
           <>
             <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl"></div>
             <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-pink-100/40 to-orange-100/40 rounded-full blur-3xl"></div>
               <div className="absolute top-1/2 left-1/3 w-56 h-56 bg-gradient-to-br from-emerald-300/25 to-cyan-400/25 rounded-full blur-2xl"></div>
           </>
         }>
             {/* Large feature orbs */}
           <motion.div 
               className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-300/25 to-purple-400/25 rounded-full blur-3xl"
             animate={{ 
                 x: [0, 80, -40, 0],
                 y: [0, -60, 40, 0],
                 scale: [1, 1.3, 0.8, 1],
                 rotate: [0, 120, 240, 360]
             }}
             transition={{ 
                 duration: 28, 
               repeat: Infinity, 
               ease: "easeInOut" 
             }}
           />
           <motion.div 
               className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-br from-pink-300/20 to-orange-400/20 rounded-full blur-3xl"
             animate={{ 
                 x: [0, -90, 60, 0],
                 y: [0, 50, -70, 0],
                 scale: [1, 0.7, 1.2, 1],
                 rotate: [0, -150, -300, -360]
             }}
             transition={{ 
                 duration: 32, 
               repeat: Infinity, 
               ease: "easeInOut",
                 delay: 3
               }}
             />
             <motion.div 
               className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-emerald-300/18 to-cyan-400/18 rounded-full blur-2xl"
               animate={{ 
                 x: [0, 70, -80, 0],
                 y: [0, -40, 60, 0],
                 scale: [1, 1.1, 0.9, 1],
                 rotate: [0, 90, 180, 270, 360]
               }}
               transition={{ 
                 duration: 25, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 1.5
               }}
             />
             <motion.div 
               className="absolute top-10 right-1/3 w-48 h-48 bg-gradient-to-br from-violet-300/15 to-indigo-400/15 rounded-full blur-xl"
               animate={{ 
                 x: [0, -50, 70, 0],
                 y: [0, 80, -60, 0],
                 scale: [1, 1.4, 0.6, 1],
                 rotate: [0, 200, 100, 360]
               }}
               transition={{ 
                 duration: 22, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 4
               }}
             />
             <motion.div 
               className="absolute bottom-1/3 left-1/2 w-52 h-52 bg-gradient-to-br from-rose-300/12 to-pink-400/12 rounded-full blur-2xl"
               animate={{ 
                 x: [0, 100, -50, 0],
                 y: [0, -70, 90, 0],
                 scale: [1, 0.8, 1.3, 1],
                 rotate: [0, -180, -90, -360]
               }}
               transition={{ 
                 duration: 30, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 6
             }}
           />
         </ClientOnly>
         </div>
         
         <div className="relative max-w-7xl mx-auto px-6">
           {/* Clay-style split header */}
           <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
             <ClientOnly fallback={
               <div>
                 <div className="inline-flex items-center gap-2 bg-blue-100/60 border border-blue-200/60 rounded-full px-4 py-2 mb-6">
                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                   <span className="text-sm font-medium text-blue-700">Powerful features</span>
                 </div>
                 <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                    Everything you need to{" "}
                    <span className="relative">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        get referred
                      </span>
                      {/* Clay-style underline decoration */}
                      <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 300 12" fill="none">
                        <path 
                          d="M5 6C50 2 100 10 150 6C200 2 250 10 295 6" 
                          stroke="url(#gradient)" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </span>
                  </h2>
                 <p className="text-xl text-gray-600 leading-relaxed">
                   Designed to maximize your referral success with intelligent matching and authentic connections.
              </p>
            </div>
             }>
               <motion.div
                 initial={{ opacity: 0, y: 50 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8 }}
                 viewport={{ once: true }}
               >
                 <motion.div 
                   className="inline-flex items-center gap-2 bg-blue-100/60 border border-blue-200/60 rounded-full px-4 py-2 mb-6"
                   initial={{ opacity: 0, scale: 0.8 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.5, delay: 0.2 }}
                   viewport={{ once: true }}
                 >
                   <motion.div 
                     className="w-2 h-2 bg-blue-500 rounded-full"
                     animate={{ scale: [1, 1.2, 1] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   />
                   <span className="text-sm font-medium text-blue-700">Powerful features</span>
                 </motion.div>
                 <motion.h2 
                   className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.8, delay: 0.3 }}
                   viewport={{ once: true }}
                 >
                   Everything you need to{" "}
                   <span className="relative">
                     <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                       get referred
                     </span>
                     <motion.svg 
                        className="absolute -bottom-2 left-0 w-full h-3" 
                        viewBox="0 0 300 12" 
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1 }}
                      >
                        <motion.path 
                          d="M5 6C50 2 100 10 150 6C200 2 250 10 295 6" 
                          stroke="url(#gradient)" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </motion.svg>
                   </span>
                 </motion.h2>
                 <motion.p 
                   className="text-xl text-gray-600 leading-relaxed"
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.5 }}
                   viewport={{ once: true }}
                 >
                   Designed to maximize your referral success with intelligent matching and authentic connections.
                 </motion.p>
               </motion.div>
             </ClientOnly>
             
                          {/* Enhanced Interactive Features Demo */}
             <ClientOnly fallback={
               <div className="relative">
                 <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
                   <div className="space-y-4">
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span className="text-sm font-medium text-gray-700">AI matching active</span>
                    </div>
                     <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                       <div className="text-sm text-gray-600 mb-2">Platform Status</div>
                       <div className="flex items-center gap-2">
                         <div className="flex-1 bg-gray-200 rounded-full h-2">
                           <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full w-full"></div>
                         </div>
                         <span className="text-sm font-semibold text-green-600">Live</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             }>
               <InteractiveFeaturesDemo />
             </ClientOnly>
          </div>

           {/* Clay's unique feature presentation */}
           <div className="space-y-24">
             
             {/* Feature 1 - Split layout like Clay */}
             <ClientOnly fallback={
               <div className="grid lg:grid-cols-2 gap-16 items-center"></div>
             }>
               <motion.div 
                 className="grid lg:grid-cols-2 gap-16 items-center"
                 initial={{ opacity: 0, y: 100 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
                 viewport={{ once: true }}
               >
                 {/* Interactive Navigation Demo with enhanced animations */}
                 <motion.div 
                   variants={cardVariants}
                   initial="hidden"
                   whileInView="visible"
                   whileHover="hover"
                   custom={0}
                   viewport={{ once: true }}
                   className="relative perspective-1000"
                 >
                   <ClientOnly fallback={<div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200"></div>}>
                     <InteractiveNavigationDemo />
                   </ClientOnly>
                   
                   {/* Floating depth elements */}
                       <motion.div 
                     className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-300/30 rounded-full blur-xl"
                   animate={{ 
                       scale: [1, 1.2, 1],
                       opacity: [0.3, 0.6, 0.3]
                   }}
                   transition={{ 
                     duration: 4, 
                     repeat: Infinity, 
                     ease: "easeInOut" 
                   }}
                 />
                 <motion.div 
                     className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-emerald-200/40 to-teal-300/40 rounded-xl blur-lg"
                   animate={{ 
                       rotate: [0, 180, 360],
                     scale: [1, 1.1, 1]
                   }}
                   transition={{ 
                       duration: 8, 
                     repeat: Infinity, 
                       ease: "linear" 
                   }}
                 />
               </motion.div>
               
               <motion.div 
                   className="space-y-6"
                   initial={{ opacity: 0, x: 50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   transition={{ duration: 0.8, delay: 0.4 }}
                   viewport={{ once: true }}
                 >
                   <motion.h3 
                     className="text-2xl font-bold text-gray-900"
                     initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.5 }}
                 viewport={{ once: true }}
               >
                     Keep track of your referral requests
                   </motion.h3>
                   <motion.p 
                     className="text-lg text-gray-600 leading-relaxed"
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.6 }}
                     viewport={{ once: true }}
                   >
                     See the status of all your referral requests in one place. Know when employees respond, when they've submitted your referral, and track your progress toward landing interviews.
                   </motion.p>
                   <div className="grid grid-cols-2 gap-4">
                     <motion.div 
                       className="bg-blue-50 rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
                       variants={featureCardVariants}
                       initial="hidden"
                       whileInView="visible"
                       whileHover="hover"
                       custom={0}
                       viewport={{ once: true }}
                     >
                       {/* Hover gradient overlay */}
                       <motion.div 
                         className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 opacity-0 group-hover:opacity-100"
                         transition={{ duration: 0.3 }}
                       />
                       <div className="relative z-10">
                         <motion.div 
                           className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center mb-3"
                           whileHover={{ 
                             scale: 1.1, 
                             rotate: 5,
                             boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)"
                           }}
                           transition={{ duration: 0.2 }}
                         >
                           <TrendingUp className="w-4 h-4 text-white" />
                         </motion.div>
                         <div className="font-semibold text-gray-900">Track Progress</div>
                         <div className="text-sm text-gray-600">See request status updates</div>
                        </div>
                     </motion.div>
                       <motion.div 
                       className="bg-emerald-50 rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
                       variants={featureCardVariants}
                       initial="hidden"
                       whileInView="visible"
                       whileHover="hover"
                       custom={1}
                       viewport={{ once: true }}
                     >
                       {/* Hover gradient overlay */}
                       <motion.div 
                         className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 opacity-0 group-hover:opacity-100"
                         transition={{ duration: 0.3 }}
                       />
                       <div className="relative z-10">
                         <motion.div 
                           className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center mb-3"
                           whileHover={{ 
                             scale: 1.1, 
                             rotate: -5,
                             boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)"
                           }}
                           transition={{ duration: 0.2 }}
                         >
                           <CheckIcon className="w-4 h-4 text-white" />
                         </motion.div>
                         <div className="font-semibold text-gray-900">Stay Organized</div>
                         <div className="text-sm text-gray-600">All requests in one place</div>
                      </div>
                     </motion.div>
                  </div>
                 </motion.div>
               </motion.div>
             </ClientOnly>

             {/* Feature 2 - Interactive Messaging Demo */}
             <motion.div 
               className="grid lg:grid-cols-2 gap-16 items-center"
               initial={{ opacity: 0, y: 80 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               viewport={{ once: true }}
             >
               <motion.div 
                 className="space-y-6 lg:order-1"
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, delay: 0.5 }}
                 viewport={{ once: true }}
               >
                 <motion.h3 
                   className="text-2xl font-bold text-gray-900"
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.6 }}
                   viewport={{ once: true }}
                 >
                   Connect directly with employees at your dream companies
                 </motion.h3>
                 <motion.p 
                   className="text-lg text-gray-600 leading-relaxed"
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.7 }}
                   viewport={{ once: true }}
                 >
                   Skip the cold emails and LinkedIn spam. Our platform facilitates meaningful conversations with verified employees who genuinely want to help.
                 </motion.p>
                 <div className="grid grid-cols-2 gap-4">
                   <motion.div 
                     className="bg-green-50 rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
                     variants={featureCardVariants}
                     initial="hidden"
                     whileInView="visible"
                     whileHover="hover"
                     custom={0}
                     viewport={{ once: true }}
                   >
                     {/* Hover gradient overlay */}
                     <motion.div 
                       className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-emerald-100/50 opacity-0 group-hover:opacity-100"
                       transition={{ duration: 0.3 }}
                     />
                     <div className="relative z-10">
                       <motion.div 
                         className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center mb-3"
                         whileHover={{ 
                           scale: 1.1, 
                           rotate: 5,
                           boxShadow: "0 8px 25px rgba(34, 197, 94, 0.4)"
                         }}
                         transition={{ duration: 0.2 }}
                       >
                       <Shield className="w-4 h-4 text-white" />
                       </motion.div>
                     <div className="font-semibold text-gray-900">100% Verified</div>
                     <div className="text-sm text-gray-600">All profiles authenticated</div>
                   </div>
                   </motion.div>
                   <motion.div 
                     className="bg-blue-50 rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
                     variants={featureCardVariants}
                     initial="hidden"
                     whileInView="visible"
                     whileHover="hover"
                     custom={1}
                     viewport={{ once: true }}
                   >
                     {/* Hover gradient overlay */}
                     <motion.div 
                       className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 opacity-0 group-hover:opacity-100"
                       transition={{ duration: 0.3 }}
                     />
                     <div className="relative z-10">
                       <motion.div 
                         className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center mb-3"
                         whileHover={{ 
                           scale: 1.1, 
                           rotate: -5,
                           boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)"
                         }}
                         transition={{ duration: 0.2 }}
                       >
                       <MessageCircle className="w-4 h-4 text-white" />
                       </motion.div>
                     <div className="font-semibold text-gray-900">Direct Access</div>
                     <div className="text-sm text-gray-600">Message employees directly</div>
                   </div>
                   </motion.div>
                 </div>
               </motion.div>
               
               <motion.div 
                 className="relative lg:order-2"
                 variants={cardVariants}
                 initial="hidden"
                 whileInView="visible"
                 whileHover="hover"
                 custom={1}
                 viewport={{ once: true }}
               >
                 {/* Interactive Chat Interface Demo */}
                 <ClientOnly fallback={<div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"></div>}>
                   <InteractiveChatDemo />
                 </ClientOnly>
                 
                 {/* Enhanced Floating Success Badge */}
                 <ClientOnly fallback={
                   <div className="absolute -top-6 -right-6 bg-white rounded-xl p-3 shadow-lg border border-green-200">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       <span className="text-xs font-medium text-green-700">Referral Confirmed!</span>
                        </div>
                        </div>
                 }>
                   <motion.div 
                     className="absolute -top-6 -right-6 bg-white rounded-xl p-3 shadow-lg border border-green-200"
                     initial={{ opacity: 0, scale: 0.8, rotate: 8, y: 20 }}
                     animate={{ 
                       opacity: 1, 
                       scale: 1, 
                       rotate: 8, 
                       y: 0,
                       boxShadow: "0 10px 40px rgba(34, 197, 94, 0.2)"
                     }}
                     transition={{ 
                       duration: 0.6, 
                       delay: 2.5,
                       type: "spring",
                       stiffness: 100
                     }}
                     whileHover={{
                       scale: 1.05,
                       rotate: 5,
                       transition: { duration: 0.2 }
                     }}
                   >
                     <div className="flex items-center gap-2">
                       <motion.div 
                         className="w-2 h-2 bg-green-500 rounded-full"
                         animate={{ 
                           scale: [1, 1.4, 1],
                           opacity: [1, 0.7, 1]
                         }}
                         transition={{ 
                           duration: 2, 
                           repeat: Infinity,
                           ease: "easeInOut"
                         }}
                       />
                       <span className="text-xs font-medium text-green-700">Referral Confirmed!</span>
                      </div>
                   </motion.div>
                 </ClientOnly>
                 
                 {/* Enhanced background decorations */}
                 <motion.div 
                   className="absolute -bottom-8 -left-8 w-16 h-16 bg-gradient-to-br from-green-200/40 to-emerald-300/40 rounded-full blur-xl"
                   animate={{ 
                     scale: [1, 1.3, 1],
                     opacity: [0.4, 0.7, 0.4]
                   }}
                   transition={{ 
                     duration: 5, 
                     repeat: Infinity, 
                     ease: "easeInOut" 
                   }}
                 />
                 <motion.div 
                   className="absolute -top-8 -left-8 w-12 h-12 bg-gradient-to-br from-blue-200/30 to-cyan-300/30 rounded-2xl blur-lg"
                   animate={{ 
                     rotate: [0, 360],
                     scale: [1, 1.2, 1]
                   }}
                   transition={{ 
                     duration: 10, 
                     repeat: Infinity, 
                     ease: "linear" 
                   }}
                 />
               </motion.div>
             </motion.div>

             {/* Feature 3 - Full width like Clay with enhanced animations */}
             <motion.div 
               className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 lg:p-12 relative overflow-hidden"
               initial={{ opacity: 0, y: 60 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               viewport={{ once: true }}
               whileHover={{ 
                 scale: 1.01,
                 transition: { duration: 0.3 }
               }}
             >
               {/* Background decoration */}
               <div className="absolute top-6 right-6 w-32 h-32 bg-gradient-to-br from-purple-100/40 to-pink-100/40 rounded-full blur-2xl"></div>
               <div className="absolute bottom-6 left-6 w-24 h-24 bg-gradient-to-br from-blue-100/40 to-cyan-100/40 rounded-2xl blur-xl rotate-12"></div>
               
               <div className="relative z-10">
                 <motion.div 
                   className="text-center mb-12"
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.3 }}
                   viewport={{ once: true }}
                 >
                   <motion.h3 
                     className="text-2xl font-bold text-gray-900 mb-4"
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.4 }}
                     viewport={{ once: true }}
                   >
                   Track your success, optimize your approach
                   </motion.h3>
                   <motion.p 
                     className="text-lg text-gray-600 max-w-2xl mx-auto"
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.5 }}
                     viewport={{ once: true }}
                   >
                   Get insights into your referral pipeline and learn what works best for your career goals.
                   </motion.p>
                 </motion.div>
               
               {/* Horizontal Infinite Rotating Carousel */}
               <div className="relative overflow-hidden">
                 {/* Gradient fade edges */}
                 <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
                 <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
                 
                 <InfiniteCarousel />
                   </div>
                 </div>
             </motion.div>
           </div>
          </div>
        </section>

             {/* How It Works - Clay's Creative Process Flow */}
       <section id="how-it-works" className="relative py-32 overflow-hidden">
         {/* Enhanced gradient background */}
         <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/50"></div>
         
         {/* Enhanced floating gradient system */}
         <div className="absolute inset-0 overflow-hidden">
         <ClientOnly fallback={
           <>
             <div className="absolute top-32 left-20 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl"></div>
             <div className="absolute bottom-32 right-20 w-56 h-56 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-2xl"></div>
               <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
           </>
         }>
             {/* How-it-works themed orbs */}
           <motion.div 
               className="absolute top-32 left-20 w-88 h-88 bg-gradient-to-br from-purple-300/25 to-pink-400/25 rounded-full blur-3xl"
             animate={{ 
                 x: [0, 60, -80, 0],
                 y: [0, -50, 70, 0],
                 scale: [1, 1.2, 0.7, 1],
                 rotate: [0, 180, 360]
             }}
             transition={{ 
                 duration: 26, 
               repeat: Infinity, 
               ease: "easeInOut" 
             }}
           />
           <motion.div 
               className="absolute bottom-32 right-20 w-76 h-76 bg-gradient-to-br from-blue-300/22 to-cyan-400/22 rounded-full blur-3xl"
             animate={{ 
                 x: [0, -70, 90, 0],
                 y: [0, 60, -40, 0],
                 scale: [1, 0.8, 1.3, 1],
                 rotate: [0, -120, -240, -360]
             }}
             transition={{ 
                 duration: 24, 
               repeat: Infinity, 
               ease: "easeInOut",
               delay: 2
             }}
           />
             <motion.div 
               className="absolute top-1/3 right-1/4 w-68 h-68 bg-gradient-to-br from-indigo-300/18 to-purple-400/18 rounded-full blur-2xl"
               animate={{ 
                 x: [0, 40, -60, 0],
                 y: [0, -80, 50, 0],
                 scale: [1, 1.4, 0.9, 1],
                 rotate: [0, 90, 270, 360]
               }}
               transition={{ 
                 duration: 20, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 4
               }}
             />
             <motion.div 
               className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-gradient-to-br from-emerald-300/15 to-teal-400/15 rounded-full blur-2xl"
               animate={{ 
                 x: [0, 80, -40, 0],
                 y: [0, -30, 70, 0],
                 scale: [1, 0.6, 1.1, 1],
                 rotate: [0, 150, 300, 360]
               }}
               transition={{ 
                 duration: 18, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 1
               }}
             />
             <motion.div 
               className="absolute top-10 left-1/2 w-44 h-44 bg-gradient-to-br from-orange-300/12 to-yellow-400/12 rounded-full blur-xl"
               animate={{ 
                 x: [0, -50, 80, 0],
                 y: [0, 60, -90, 0],
                 scale: [1, 1.3, 0.8, 1],
                 rotate: [0, -90, -270, -360]
               }}
               transition={{ 
                 duration: 22, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 5
             }}
           />
         </ClientOnly>
         </div>
         
         <div className="relative max-w-7xl mx-auto px-6">
           {/* Clay-style header */}
           <div className="text-center mb-20">
             <div className="inline-flex items-center gap-2 bg-purple-100/60 border border-purple-200/60 rounded-full px-4 py-2 mb-6">
               <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
               <span className="text-sm font-medium text-purple-700">Simple process</span>
             </div>
             <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
               Turn connections into{" "}
               <span className="relative">
                 <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                   opportunities
                 </span>
                 {/* Clay-style underline */}
                 <svg className="absolute -bottom-2 left-0 w-full h-4" viewBox="0 0 200 16" fill="none">
                   <path 
                     d="M10 8C40 4 80 12 120 8C160 4 180 12 190 8" 
                     stroke="url(#purple-gradient)" 
                     strokeWidth="3" 
                     strokeLinecap="round"
                   />
                   <defs>
                     <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#9333EA" stopOpacity="0.4" />
                       <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
                     </linearGradient>
                   </defs>
                 </svg>
               </span>
             </h2>
             <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
               Three simple steps to accelerate your career through strategic referrals and meaningful professional relationships.
              </p>
            </div>

           {/* Interactive Step Presentation */}
           <div className="space-y-32">
             
             {/* Step 1 - Interactive Profile Builder */}
             <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="relative">
                 <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                   01
                    </div>
                   
                 {/* Interactive Profile Builder Demo */}
                 <ClientOnly fallback={<div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-96"></div>}>
                   <InteractiveProfileBuilder />
                 </ClientOnly>
                 
                 {/* Clay decoration */}
                 <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-gradient-to-br from-blue-200/60 to-cyan-300/60 rounded-2xl rotate-12"></div>
               </div>
               
               <div className="space-y-6">
                 <h4 className="text-xl font-bold text-gray-900">
                   Stand out with an authentic professional story
                 </h4>
                 <p className="text-lg text-gray-600 leading-relaxed">
                   Our AI analyzes your background to identify the best opportunities and helps you craft a compelling narrative that resonates with potential referrers.
                 </p>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-blue-50 rounded-xl p-4">
                     <div className="text-2xl font-bold text-blue-600">AI-Powered</div>
                     <div className="text-sm text-gray-600">Smart matching algorithm</div>
                   </div>
                   <div className="bg-cyan-50 rounded-xl p-4">
                     <div className="text-2xl font-bold text-cyan-600">Verified</div>
                     <div className="text-sm text-gray-600">Employee profiles only</div>
                   </div>
                 </div>
               </div>
            </div>

             {/* Step 2 - Interactive Matching Demo */}
             <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="space-y-6 lg:order-2">
                 <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl lg:relative lg:top-0 lg:right-0 lg:mb-6">
                   02
                        </div>
                 <h3 className="text-2xl font-bold text-gray-900">Get matched with employees</h3>
                 <p className="text-lg text-gray-600 leading-relaxed">
                   Our intelligent matching system connects you with verified employees at your target companies who are most likely to provide valuable referrals.
                 </p>
                 <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                   <div className="text-sm text-gray-600 mb-2">Our AI analyzes</div>
                   <div className="text-3xl font-bold text-purple-600 mb-4">Multiple factors</div>
                   <div className="text-sm text-gray-600">Role fit, experience level, and company culture</div>
                        </div>
                        </div>
               
               <div className="relative lg:order-1">
                 {/* Interactive Matching Demo */}
                 <ClientOnly fallback={<div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-96"></div>}>
                   <InteractiveMatchingDemo />
                 </ClientOnly>
                 
                 {/* Clay decoration */}
                 <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-purple-200/60 to-pink-300/60 rounded-full"></div>
                </div>
             </div>

             {/* Step 3 - Interactive Success Tracker */}
             <div className="relative">
               <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                 03
               </div>
               
               <div className="grid lg:grid-cols-2 gap-16 items-center mt-8">
                 <div className="space-y-6">
                   <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                     <Target className="w-8 h-8 text-green-600" />
                   </div>
                   <h3 className="text-2xl font-bold text-gray-900">Secure referrals & land interviews</h3>
                   <p className="text-lg text-gray-600 leading-relaxed">
                     Build meaningful relationships through structured conversations and get personalized advice that leads to actual referrals.
                   </p>
                 
                   <div className="grid grid-cols-3 gap-4">
                     <div className="bg-white rounded-xl p-4 shadow-sm border">
                     <div className="text-center">
                         <div className="text-2xl font-bold text-green-600 mb-1">Direct</div>
                         <div className="text-xs text-gray-600">Employee connections</div>
                  </div>
                  </div>
                     <div className="bg-white rounded-xl p-4 shadow-sm border">
                     <div className="text-center">
                         <div className="text-2xl font-bold text-emerald-600 mb-1">Faster</div>
                         <div className="text-xs text-gray-600">Than cold applications</div>
                </div>
                  </div>
                     <div className="bg-white rounded-xl p-4 shadow-sm border">
                     <div className="text-center">
                         <div className="text-2xl font-bold text-green-600 mb-1">Higher</div>
                         <div className="text-xs text-gray-600">Success probability</div>
                  </div>
                  </div>
                </div>
              </div>
                 
                 <div className="relative">
                   {/* Interactive Success Tracker Demo */}
                   <ClientOnly fallback={<div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-96"></div>}>
                     <InteractiveSuccessTracker />
                   </ClientOnly>
                 </div>
               </div>
               
               {/* Clay decorations */}
               <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-green-200/40 to-emerald-300/40 rounded-full"></div>
               <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-200/60 to-green-300/60 rounded-2xl rotate-45"></div>
              </div>
            </div>
          </div>
        </section>

             {/* Pricing - Clay's Creative Approach */}
       <section id="pricing" className="relative py-32 overflow-hidden">
         {/* Enhanced gradient background */}
         <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30"></div>
         
         {/* Enhanced floating gradient system */}
         <div className="absolute inset-0 overflow-hidden">
         <ClientOnly fallback={
           <>
             <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
             <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
               <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-gradient-to-br from-emerald-200/15 to-cyan-300/15 rounded-full blur-3xl"></div>
           </>
         }>
             {/* Pricing themed orbs */}
           <motion.div 
               className="absolute top-20 right-20 w-84 h-84 bg-gradient-to-br from-blue-300/22 to-purple-400/22 rounded-full blur-3xl"
             animate={{ 
                 x: [0, -80, 60, 0],
                 y: [0, -50, 80, 0],
                 scale: [1, 1.25, 0.75, 1],
                 rotate: [0, 160, 320, 360]
             }}
             transition={{ 
                 duration: 30, 
               repeat: Infinity, 
               ease: "easeInOut" 
             }}
           />
           <motion.div 
               className="absolute bottom-20 left-20 w-76 h-76 bg-gradient-to-br from-purple-300/18 to-pink-400/18 rounded-full blur-3xl"
             animate={{ 
                 x: [0, 90, -60, 0],
                 y: [0, 40, -70, 0],
                 scale: [1, 0.8, 1.3, 1],
                 rotate: [0, -140, -280, -360]
             }}
             transition={{ 
                 duration: 27, 
               repeat: Infinity, 
               ease: "easeInOut",
               delay: 1.5
             }}
           />
             <motion.div 
               className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-emerald-300/16 to-cyan-400/16 rounded-full blur-3xl"
               animate={{ 
                 x: [0, 70, -90, 0],
                 y: [0, -60, 40, 0],
                 scale: [1, 1.1, 0.9, 1],
                 rotate: [0, 200, 100, 360]
               }}
               transition={{ 
                 duration: 25, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 3
               }}
             />
             <motion.div 
               className="absolute bottom-1/3 right-1/3 w-56 h-56 bg-gradient-to-br from-rose-300/14 to-orange-400/14 rounded-full blur-2xl"
               animate={{ 
                 x: [0, -50, 70, 0],
                 y: [0, 80, -50, 0],
                 scale: [1, 1.4, 0.7, 1],
                 rotate: [0, 120, 240, 360]
               }}
               transition={{ 
                 duration: 21, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 4.5
               }}
             />
             <motion.div 
               className="absolute top-10 left-1/2 w-64 h-64 bg-gradient-to-br from-indigo-300/12 to-violet-400/12 rounded-full blur-2xl"
               animate={{ 
                 x: [0, 40, -80, 0],
                 y: [0, -70, 90, 0],
                 scale: [1, 0.9, 1.2, 1],
                 rotate: [0, -80, -160, -240, -360]
               }}
               transition={{ 
                 duration: 23, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 2
               }}
             />
             <motion.div 
               className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-br from-teal-300/10 to-emerald-400/10 rounded-full blur-xl"
               animate={{ 
                 x: [0, 60, -40, 0],
                 y: [0, -30, 60, 0],
                 scale: [1, 1.3, 0.8, 1],
                 rotate: [0, 180, 90, 360]
               }}
               transition={{ 
                 duration: 19, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: 6
             }}
           />
         </ClientOnly>
         </div>
         
         <div className="relative max-w-7xl mx-auto px-6">
           {/* Clay-style split header */}
           <div className="grid lg:grid-cols-2 gap-16 items-end mb-20">
             <div>
               <div className="inline-flex items-center gap-2 bg-gray-100/80 border border-gray-200/80 rounded-full px-4 py-2 mb-6">
                 <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                 <span className="text-sm font-medium text-gray-700">Transparent pricing</span>
               </div>
               <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                 Simple pricing that{" "}
                 <span className="relative">
                   <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                     scales with you
                   </span>
                   {/* Clay-style highlight */}
                   <div className="absolute -bottom-1 left-0 w-full h-3 bg-gradient-to-r from-gray-200/60 to-gray-300/60 rounded-full -z-10"></div>
                 </span>
               </h2>
               <p className="text-xl text-gray-600 leading-relaxed">
                 Start for free, upgrade when you're ready to accelerate your career growth.
              </p>
            </div>

                           {/* Clay-style value proposition card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                    <div className="font-semibold text-gray-900">Beta Launch</div>
                    <div className="text-sm text-gray-600">Join early adopters</div>
                      </div>
                    </div>
                <p className="text-gray-700">
                  Be among the first to experience AI-powered referral matching. Help us build the future of career networking.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <ClientOnly fallback={<div className="w-2 h-2 bg-green-500 rounded-full"></div>}>
                    <motion.div 
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </ClientOnly>
                  <span className="text-sm text-gray-600">Limited beta access</span>
            </div>
          </div>
           </div>

           {/* Clay's unique pricing cards */}
           <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
             
             {/* Free Plan - Creative layout */}
             <ClientOnly fallback={
               <div className="relative">
                 <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-full"></div>
               </div>
             }>
               <motion.div 
                 className="relative"
                 variants={cardVariants}
                 initial="hidden"
                 whileInView="visible"
                 whileHover="hover"
                 custom={0}
                 viewport={{ once: true }}
               >
                 <motion.div 
                   className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-full relative overflow-hidden group"
                   whileHover={{ 
                     boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                     background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
                   }}
                   transition={{ duration: 0.3 }}
                 >
                 {/* Hover gradient overlay */}
                 <motion.div 
                   className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 opacity-0 group-hover:opacity-100"
                   transition={{ duration: 0.3 }}
                 />
                 <div className="relative z-10 mb-8">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                       <Users className="w-6 h-6 text-blue-600" />
                     </div>
                     <div>
                       <h3 className="text-2xl font-bold text-gray-900">Free</h3>
                       <p className="text-gray-600">Perfect for getting started</p>
                     </div>
            </div>

                   <div className="flex items-baseline mb-6">
                     <span className="text-5xl font-bold text-gray-900">$0</span>
                     <span className="text-gray-600 ml-2">forever</span>
                   </div>
                   
                   {/* Feature highlight */}
                   <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                     <div className="text-sm text-blue-700 font-medium mb-1">What's included:</div>
                     <div className="text-2xl font-bold text-blue-600">5 connections/month</div>
                   </div>
                 </div>

                 <ul className="space-y-4 mb-8">
                   {[
                     "Create your profile",
                     "Browse employee network", 
                     "Basic AI matching",
                     "5 connections per month",
                     "Community support"
                   ].map((feature, i) => (
                     <li key={i} className="flex items-center">
                       <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                         <CheckIcon className="w-3 h-3 text-blue-600" />
                </div>
                       <span className="text-gray-700">{feature}</span>
                     </li>
                   ))}
                 </ul>

                 <Link href="/auth/register">
                   <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 h-12 font-semibold">
                     Get started for free
                   </Button>
                 </Link>
               </motion.div>
               {/* Clay decoration with animation */}
               <motion.div 
                 className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-200/60 to-cyan-300/60 rounded-full"
                 animate={{ rotate: [0, 360] }}
                 transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
               />
               </motion.div>
             </ClientOnly>

             {/* Pro Plan - Featured with Clay styling */}
             <ClientOnly fallback={
               <div className="relative">
                 <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                   <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                     ⭐ Coming Soon
            </div>
          </div>
                 <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl h-full relative overflow-hidden"></div>
               </div>
             }>
               <motion.div 
                 className="relative"
                 initial={{ opacity: 0, y: 50, scale: 0.95 }}
                 whileInView={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ duration: 0.6, delay: 0.3 }}
                 viewport={{ once: true }}
                 whileHover={{ y: -15, scale: 1.03 }}
               >
                 {/* Popular badge with animation */}
                 <motion.div 
                   className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                   animate={{ y: [0, -5, 0] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 >
                   <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                     ⭐ Coming Soon
                   </div>
                 </motion.div>
                 
                 <motion.div 
                   className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl h-full relative overflow-hidden"
                   whileHover={{ 
                     boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.4)",
                     background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
                   }}
                   transition={{ duration: 0.3 }}
                 >
                 {/* Background decoration */}
                 <div className="absolute top-6 right-6 w-20 h-20 bg-white/10 rounded-full"></div>
                 <div className="absolute bottom-8 left-8 w-16 h-16 bg-white/10 rounded-2xl rotate-12"></div>
                 
                 <div className="relative z-10">
                   <div className="mb-8">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                         <Zap className="w-6 h-6 text-white" />
                       </div>
              <div>
                         <h3 className="text-2xl font-bold text-white">Pro</h3>
                         <p className="text-purple-100">For serious job seekers</p>
                </div>
                </div>
                     
                     <div className="flex items-baseline mb-6">
                       <span className="text-5xl font-bold text-white">$19</span>
                       <span className="text-purple-100 ml-2">/month</span>
              </div>
                     
                     {/* Feature highlight */}
                     <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
                       <div className="text-sm text-purple-100 font-medium mb-1">Everything in Free, plus:</div>
                       <div className="text-2xl font-bold text-white">Unlimited connections</div>
                    </div>
                    </div>

                   <ul className="space-y-4 mb-8">
                     {[
                       "Everything in Free",
                       "Unlimited connections",
                       "Advanced AI insights", 
                       "Direct messaging",
                       "Priority support",
                       "Success analytics"
                     ].map((feature, i) => (
                       <li key={i} className="flex items-center">
                         <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                           <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                         <span className="text-purple-100">{feature}</span>
                       </li>
                     ))}
                   </ul>

                   <Link href="/auth/register?role=candidate">
                     <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 h-12 font-semibold shadow-lg">
                       Start 7-day free trial
                     </Button>
                   </Link>
                   
                   <p className="text-center text-purple-100 text-sm mt-4">
                     No credit card required • Cancel anytime
                   </p>
                    </div>
               </motion.div>
               {/* Clay decoration with animation */}
               <motion.div 
                 className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-purple-200/60 to-pink-300/60 rounded-2xl"
                 animate={{ rotate: [45, 60, 45], scale: [1, 1.1, 1] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               />
               </motion.div>
             </ClientOnly>
                    </div>

           {/* Enhanced Pro Features Section */}
           <div className="mt-20 relative">
             {/* Background with gradient and pattern */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 rounded-3xl"></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)] rounded-3xl"></div>
             
             <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-slate-200/50 shadow-xl">
               {/* Header */}
               <ClientOnly fallback={
                 <div className="text-center mb-16">
                   <h3 className="text-3xl font-bold text-slate-900 mb-4">Why upgrade to Pro?</h3>
                   <p className="text-lg text-slate-600 max-w-2xl mx-auto">See the difference Pro makes in your job search</p>
                  </div>
               }>
                 <motion.div 
                   className="text-center mb-16"
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6 }}
                   viewport={{ once: true }}
                 >
                   <motion.h3 
                     className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4"
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.1 }}
                     viewport={{ once: true }}
                   >
                     Why upgrade to Pro?
                   </motion.h3>
                   <motion.p 
                     className="text-lg text-slate-600 max-w-2xl mx-auto"
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.2 }}
                     viewport={{ once: true }}
                   >
                     See the difference Pro makes in your job search journey
                   </motion.p>
                 </motion.div>
               </ClientOnly>
             
               {/* Feature Cards */}
               <div className="grid md:grid-cols-3 gap-8">
                 <ClientOnly fallback={
                   <div className="group">
                     <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 text-center">
                       <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                         <TrendingUp className="w-10 h-10 text-white" />
                </div>
                       <h4 className="text-2xl font-bold text-green-700 mb-3">Accelerated</h4>
                       <p className="text-green-600 font-medium mb-2">Job search process</p>
                       <p className="text-sm text-slate-600 leading-relaxed">Get matched with relevant opportunities 3x faster through AI-powered recommendations</p>
              </div>
            </div>
                 }>
                   <motion.div 
                     className="group"
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.1 }}
                     viewport={{ once: true }}
                     whileHover={{ y: -8 }}
                   >
                     <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:border-green-200 transition-all duration-300 text-center hover:shadow-xl">
                       <motion.div 
                         className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300"
                         whileHover={{ scale: 1.1, rotate: 5 }}
                       >
                         <TrendingUp className="w-10 h-10 text-white" />
                       </motion.div>
                       <h4 className="text-2xl font-bold text-green-700 mb-3">Accelerated</h4>
                       <p className="text-green-600 font-medium mb-2">Job search process</p>
                       <p className="text-sm text-slate-600 leading-relaxed">Get matched with relevant opportunities 3x faster through AI-powered recommendations</p>
          </div>
                   </motion.div>
                 </ClientOnly>
                 
                 <ClientOnly fallback={
                   <div className="group">
                     <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100 text-center">
                       <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                         <MessageCircle className="w-10 h-10 text-white" />
            </div>
                       <h4 className="text-2xl font-bold text-blue-700 mb-3">Direct</h4>
                       <p className="text-blue-600 font-medium mb-2">Employee messaging</p>
                       <p className="text-sm text-slate-600 leading-relaxed">Connect directly with employees at your target companies for insider insights</p>
                     </div>
                   </div>
                 }>
                   <motion.div 
                     className="group"
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.2 }}
                     viewport={{ once: true }}
                     whileHover={{ y: -8 }}
                   >
                     <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100 hover:border-blue-200 transition-all duration-300 text-center hover:shadow-xl">
                       <motion.div 
                         className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300"
                         whileHover={{ scale: 1.1, rotate: -5 }}
                       >
                         <MessageCircle className="w-10 h-10 text-white" />
                       </motion.div>
                       <h4 className="text-2xl font-bold text-blue-700 mb-3">Direct</h4>
                       <p className="text-blue-600 font-medium mb-2">Employee messaging</p>
                       <p className="text-sm text-slate-600 leading-relaxed">Connect directly with employees at your target companies for insider insights</p>
                     </div>
                   </motion.div>
                 </ClientOnly>
               
                 <ClientOnly fallback={
                   <div className="group">
                     <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 text-center">
                       <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                         <Target className="w-10 h-10 text-white" />
                       </div>
                       <h4 className="text-2xl font-bold text-purple-700 mb-3">Targeted</h4>
                       <p className="text-purple-600 font-medium mb-2">Company connections</p>
                       <p className="text-sm text-slate-600 leading-relaxed">Access curated networks at Fortune 500 companies and high-growth startups</p>
                     </div>
                   </div>
                 }>
                   <motion.div 
                     className="group"
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.3 }}
                     viewport={{ once: true }}
                     whileHover={{ y: -8 }}
                   >
                     <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:border-purple-200 transition-all duration-300 text-center hover:shadow-xl">
                       <motion.div 
                         className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300"
                         whileHover={{ scale: 1.1, rotate: 5 }}
                       >
                         <Target className="w-10 h-10 text-white" />
                       </motion.div>
                       <h4 className="text-2xl font-bold text-purple-700 mb-3">Targeted</h4>
                       <p className="text-purple-600 font-medium mb-2">Company connections</p>
                       <p className="text-sm text-slate-600 leading-relaxed">Access curated networks at Fortune 500 companies and high-growth startups</p>
                     </div>
                   </motion.div>
                 </ClientOnly>
               </div>

                               {/* Call to Action */}
                <ClientOnly fallback={
                  <div className="mt-16 pt-12 border-t border-slate-200 text-center">
                    <h4 className="text-xl font-semibold text-slate-900 mb-4">Ready to unlock these Pro features?</h4>
                    <p className="text-slate-600 mb-6">Join our beta program and get early access to advanced networking tools</p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold">
                      Start Pro Trial
                    </Button>
                  </div>
                }>
                  <motion.div 
                    className="mt-16 pt-12 border-t border-slate-200 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <motion.h4 
                      className="text-xl font-semibold text-slate-900 mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      viewport={{ once: true }}
                    >
                      Ready to unlock these Pro features?
                    </motion.h4>
                    <motion.p 
                      className="text-slate-600 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      Join our beta program and get early access to advanced networking tools
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      viewport={{ once: true }}
                    >
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        Start Pro Trial
                      </Button>
                    </motion.div>
                  </motion.div>
                </ClientOnly>
             </div>
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Enhanced background with gradient animations */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.08),transparent_50%)]"></div>
        
        {/* Enhanced floating gradient system for dark theme */}
        <div className="absolute inset-0 overflow-hidden">
          <ClientOnly fallback={
            <>
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-indigo-400/20 rounded-full animate-pulse delay-500"></div>
              <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-gradient-to-br from-blue-500/8 to-purple-600/8 rounded-full blur-3xl"></div>
            </>
          }>
            {/* Dark theme floating orbs */}
            <motion.div 
              className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/12 to-purple-600/12 rounded-full blur-3xl"
              animate={{ 
                x: [0, 90, -60, 0],
                y: [0, -70, 50, 0],
                scale: [1, 1.2, 0.8, 1],
                rotate: [0, 140, 280, 360]
              }}
              transition={{ 
                duration: 35, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute top-2/3 right-1/4 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-3xl"
              animate={{ 
                x: [0, -80, 70, 0],
                y: [0, 60, -80, 0],
                scale: [1, 0.7, 1.3, 1],
                rotate: [0, -160, -320, -360]
              }}
              transition={{ 
                duration: 32, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div 
              className="absolute bottom-1/4 left-1/3 w-68 h-68 bg-gradient-to-br from-indigo-500/8 to-cyan-600/8 rounded-full blur-2xl"
              animate={{ 
                x: [0, 60, -90, 0],
                y: [0, -40, 70, 0],
                scale: [1, 1.4, 0.9, 1],
                rotate: [0, 100, 200, 300, 360]
              }}
              transition={{ 
                duration: 28, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 4
              }}
            />
            <motion.div 
              className="absolute top-10 right-10 w-56 h-56 bg-gradient-to-br from-emerald-500/6 to-teal-600/6 rounded-full blur-2xl"
              animate={{ 
                x: [0, -50, 80, 0],
                y: [0, 90, -60, 0],
                scale: [1, 0.8, 1.1, 1],
                rotate: [0, 180, 90, 360]
              }}
              transition={{ 
                duration: 26, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div 
              className="absolute bottom-10 right-1/3 w-44 h-44 bg-gradient-to-br from-rose-500/7 to-orange-600/7 rounded-full blur-xl"
              animate={{ 
                x: [0, 70, -40, 0],
                y: [0, -50, 80, 0],
                scale: [1, 1.3, 0.7, 1],
                rotate: [0, -120, -240, -360]
              }}
              transition={{ 
                duration: 24, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 5
              }}
            />
            
            {/* Accent floating particles */}
            <motion.div 
              className="absolute top-20 left-10 w-3 h-3 bg-blue-400/30 rounded-full"
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute top-40 right-20 w-2 h-2 bg-purple-400/40 rounded-full"
              animate={{ 
                y: [0, 15, 0],
                opacity: [0.4, 0.9, 0.4],
                scale: [1, 2, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div 
              className="absolute bottom-32 left-1/4 w-2.5 h-2.5 bg-indigo-400/20 rounded-full"
              animate={{ 
                y: [0, -10, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.8, 1]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </ClientOnly>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border border-white/10 backdrop-blur-sm mb-8">
              <Sparkles className="w-10 h-10 text-blue-400" />
              </div>

            {/* Heading */}
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Ready to accelerate your career?
            </h2>
            
            {/* Subheading */}
            <p className="text-xl lg:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of professionals who are building meaningful connections that lead to their dream jobs.
            </p>

            {/* CTA Form */}
            <div className="max-w-lg mx-auto mb-8">
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4 p-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-14 bg-transparent border-0 text-white placeholder-slate-400 text-lg focus:ring-0 focus:outline-none"
                      required
                    />
                    <Button
                      type="submit"
                      size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      disabled={isSubmitting}
                    >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Joining...
                </div>
              ) : (
                    "Start connecting for free"
                  )}
                </Button>
              </form>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-slate-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm">Free forever plan</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-slate-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-sm">Setup in 2 minutes</span>
              </div>
            </div>
            </div>
          </div>
        </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 border-t border-slate-200/50">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.03),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.02),transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          {/* Main footer content */}
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            {/* Brand section */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
              </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-900">ReferralInc</span>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">Beta</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">AI-powered career acceleration</p>
                </div>
              </div>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-md">
                The intelligent platform connecting ambitious professionals with strategic referrals to accelerate their career growth.
              </p>
              
              {/* Social links */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">Follow us</span>
                <div className="flex gap-3">
                  <Link href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </Link>
                  <Link href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </Link>
                  <Link href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </Link>
              </div>
            </div>
            </div>
            
            {/* Navigation columns */}
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-8">
            <div>
                <h3 className="font-semibold text-slate-900 mb-6 text-sm uppercase tracking-wider">Product</h3>
                <ul className="space-y-4">
                  <li><Link href="#features" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Features</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
                  <li><Link href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Pricing</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Beta Program</span>
                    <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">New</Badge>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>API</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
              </ul>
            </div>
              
            <div>
                <h3 className="font-semibold text-slate-900 mb-6 text-sm uppercase tracking-wider">Company</h3>
                <ul className="space-y-4">
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>About</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Blog</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Careers</span>
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">We're hiring</Badge>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Press</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
              </ul>
            </div>
              
            <div>
                <h3 className="font-semibold text-slate-900 mb-6 text-sm uppercase tracking-wider">Support</h3>
                <ul className="space-y-4">
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Help Center</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Contact</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Community</span>
                    <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link></li>
                  <li><Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center group">
                    <span>Status</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-2"></div>
                  </Link></li>
              </ul>
            </div>
          </div>
          </div>
          
          {/* Bottom section */}
          <div className="border-t border-slate-200/60 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <p className="text-slate-600 text-sm">© 2024 ReferralInc. All rights reserved.</p>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Made with</span>
                  <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span>in San Francisco</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6">
                <Link href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors duration-200">Privacy Policy</Link>
                <Link href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors duration-200">Terms of Service</Link>
                <Link href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors duration-200">Cookie Policy</Link>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>🌍</span>
                  <select className="bg-transparent text-slate-600 text-sm border-none focus:outline-none cursor-pointer">
                    <option>English</option>
                    <option>Español</option>
                    <option>Français</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
