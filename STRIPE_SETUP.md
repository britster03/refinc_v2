# Stripe Payment Integration Setup Guide

## 🎯 Overview

This application includes a complete Stripe payment integration for premium conversation bookings. The system supports:

- **Real-time payment processing** with Stripe Elements
- **Coupon/discount system** with validation
- **Secure payment confirmation** via webhooks
- **Full payment lifecycle** from intent creation to confirmation

## 🔧 Setup Instructions

### 1. Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification for live payments (optional for testing)

### 2. Get Your API Keys

#### For Testing (Development):
1. Login to [Stripe Dashboard](https://dashboard.stripe.com)
2. Ensure you're in "Test mode" (toggle in left sidebar)
3. Go to **Developers > API Keys**
4. Copy your **Publishable key** (starts with `pk_test_`)
5. Copy your **Secret key** (starts with `sk_test_`)

#### For Production:
1. Switch to "Live mode" in Stripe Dashboard
2. Go through account verification process
3. Get your live keys (starts with `pk_live_` and `sk_live_`)

### 3. Configure Environment Variables

Update your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_publishable_key_here"
STRIPE_SECRET_KEY="sk_test_your_actual_secret_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

**Important**: Replace the example keys with your actual Stripe keys!

### 4. Test Cards for Development

Use these test card numbers:

| Card Number | Description |
|-------------|-------------|
| `4242424242424242` | Visa - Always succeeds |
| `4000000000000002` | Visa - Always declined |
| `4000000000009995` | Visa - Insufficient funds |
| `4000000000000069` | Visa - Expired card |

- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## 🚀 How the Payment Flow Works

### 1. Free Sessions (100% Coupons)
```
User books session → Coupon validated → Session created directly
```

### 2. Paid Sessions
```
User books session → Stripe payment modal → Payment processed → Session confirmed
```

### 3. Backend Flow
```
1. Create conversation in database
2. Create Stripe payment intent
3. Process payment with Stripe Elements
4. Confirm payment via webhook/API
5. Update conversation status
6. Send confirmation notifications
```

## 💳 Available Coupons for Testing

The system includes these test coupons:

| Code | Discount | Description |
|------|----------|-------------|
| `DEV100` | 100% off | Free session for development |
| `DEV50` | 50% off | Half price for testing |
| `FREE` | 100% off | Another free session code |

## 🔒 Security Features

✅ **PCI Compliant**: Stripe handles all card data
✅ **Encrypted Communication**: All data encrypted in transit  
✅ **Webhook Verification**: Payment confirmations verified via webhooks
✅ **Input Validation**: All payment data validated on backend
✅ **Error Handling**: Comprehensive error handling for failed payments

## 🧪 Testing the Integration

### Test Payment Success:
1. Book a session without a coupon
2. Use card `4242424242424242`
3. Complete payment form
4. ✅ Payment should succeed and session should be created

### Test Payment Failure:
1. Book a session without a coupon  
2. Use card `4000000000000002`
3. Complete payment form
4. ❌ Payment should fail with error message

### Test Free Session:
1. Book a session with coupon `DEV100`
2. ✅ Should skip payment and create session directly

## 🌐 Production Deployment

### 1. Update Environment Variables
```bash
# Production Environment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key"
STRIPE_SECRET_KEY="sk_live_your_live_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_live_webhook_secret"
```

### 2. Configure Webhooks (Recommended)
1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to environment variables

### 3. Enable Live Payments
1. Complete Stripe account verification
2. Add business information
3. Verify bank account for payouts
4. Switch to live mode

## 📱 Mobile Support

The Stripe Elements integration is fully responsive and works on:
- ✅ iOS Safari
- ✅ Android Chrome  
- ✅ Desktop browsers
- ✅ Progressive Web Apps

## 🐛 Troubleshooting

### "Stripe has not been initialized"
- Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- Ensure the key starts with `pk_test_` or `pk_live_`

### "Payment failed: Your card was declined"
- Using a test card that's meant to be declined
- Try `4242424242424242` for successful test payments

### "Authentication required"
- User is not logged in
- JWT token has expired

### "Invalid coupon code"
- Coupon doesn't exist in the system
- Check spelling of test coupons: `DEV100`, `DEV50`, `FREE`

## 📞 Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For application-specific issues:
- Check console logs for detailed error messages
- Verify environment variables are set correctly
- Test with known working test cards

---

## 🎉 You're All Set!

Your Stripe payment integration is now ready for production use. The system handles all edge cases and provides a seamless payment experience for your users. 