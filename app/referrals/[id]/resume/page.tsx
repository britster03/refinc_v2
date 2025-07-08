"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ReferralAPI } from "@/lib/api/referrals"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

interface Referral {
  id: number
  resume_url?: string
  position: string
  company: string
  candidate?: {
    name: string
  }
}

export default function ResumeViewerPage() {
  const params = useParams()
  const id = params.id as string
  const [referral, setReferral] = useState<Referral | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const data = await ReferralAPI.getReferralById(parseInt(id))
        setReferral(data)
      } catch (err) {
        setError("Failed to load referral")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchReferral()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading resume...</p>
        </div>
      </div>
    )
  }

  if (error || !referral || !referral.resume_url) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resume Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || "No resume available for this referral."}
          </p>
          <Link href="/referrals">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referrals
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const resumeUrl = ReferralAPI.getFileUrl(referral.resume_url)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/referrals">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Resume - {referral.position} at {referral.company}
              </h1>
              {referral.candidate?.name && (
                <p className="text-sm text-gray-600">{referral.candidate.name}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`${resumeUrl}?download=true`} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div style={{ height: 'calc(100vh - 180px)' }}>
              <iframe
                src={resumeUrl}
                className="w-full h-full border-0"
                title="Resume"
                style={{ minHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 