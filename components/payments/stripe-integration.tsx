"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock, Shield } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  description: string
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
}

function PaymentForm({ amount, description, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setIsProcessing(false)
      return
    }

    try {
      // Create payment intent
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          description,
        }),
      })

      const { clientSecret } = await response.json()

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        onError(error.message || "Payment failed")
      } else if (paymentIntent) {
        onSuccess(paymentIntent)
      }
    } catch (err) {
      onError("Payment processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
              },
            }}
          />
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      <Button type="submit" disabled={!stripe || isProcessing} className="w-full" size="lg">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${amount}
          </>
        )}
      </Button>
    </form>
  )
}

interface StripePaymentProps {
  amount: number
  description: string
  itemDetails: {
    title: string
    duration: string
    features: string[]
  }
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
}

export function StripePayment({ amount, description, itemDetails, onSuccess, onError }: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-green-600" />
            Secure Payment
          </CardTitle>
          <CardDescription>Complete your premium conversation booking</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{itemDetails.title}</h4>
                  <p className="text-sm text-muted-foreground">{itemDetails.duration}</p>
                </div>
                <Badge variant="secondary">${amount}</Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <h5 className="text-sm font-medium">Included:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {itemDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${amount}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <PaymentForm amount={amount} description={description} onSuccess={onSuccess} onError={onError} />

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Powered by Stripe. Your payment information is secure.</p>
            <p>All transactions are encrypted and PCI compliant.</p>
          </div>
        </CardContent>
      </Card>
    </Elements>
  )
}

// Payment success component
export function PaymentSuccess({ paymentIntent }: { paymentIntent: any }) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Payment Successful!</h3>
            <p className="text-muted-foreground">Your premium conversation has been booked.</p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <div className="flex justify-between">
              <span>Payment ID:</span>
              <span className="font-mono">{paymentIntent.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>${(paymentIntent.amount / 100).toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full">Continue to Conversation</Button>
        </div>
      </CardContent>
    </Card>
  )
}
