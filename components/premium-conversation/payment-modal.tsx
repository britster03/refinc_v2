"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Clock, MessageSquare } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  employeeName: string
}

export function PaymentModal({ isOpen, onClose, employeeId, employeeName }: PaymentModalProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>("30min")
  const [isLoading, setIsLoading] = useState(false)

  const plans = [
    { id: "15min", name: "15 Minutes", price: 25, description: "Quick feedback session" },
    { id: "30min", name: "30 Minutes", price: 45, description: "Standard feedback session" },
    { id: "60min", name: "60 Minutes", price: 80, description: "In-depth career coaching" },
  ]

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      const plan = plans.find((p) => p.id === selectedPlan)

      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: plan?.price,
          employeeId,
          candidateId: 1, // In a real app, this would be the logged-in user's ID
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to the payment page or conversation page
        router.push(data.paymentSession.url)
      } else {
        console.error("Payment creation failed:", data.error)
      }
    } catch (error) {
      console.error("Payment error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Premium Conversation</DialogTitle>
          <DialogDescription>
            Book a premium conversation with {employeeName} to get personalized feedback and advice.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center space-x-2">
                <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                <Label
                  htmlFor={plan.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between w-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">${plan.price}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Card className="bg-muted/50 p-4">
          <div className="flex items-start gap-4">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div className="text-sm">
              <p className="font-medium">What's included:</p>
              <ul className="list-disc pl-4 pt-2 space-y-1">
                <li>Private video or text conversation</li>
                <li>Resume and application review</li>
                <li>Personalized feedback and advice</li>
                <li>Recording of the conversation for future reference</li>
              </ul>
            </div>
          </div>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isLoading}>
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ${plans.find((p) => p.id === selectedPlan)?.price}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
