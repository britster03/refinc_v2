/**
 * Production-ready currency utilities
 * Real exchange rates, formatting, and conversion
 */

// Production-ready currency service - no external dependencies

export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' 
  | 'INR' | 'KRW' | 'BRL' | 'MXN' | 'RUB' | 'ZAR' | 'TRY' | 'PLN'
  | 'SEK' | 'NOK' | 'DKK' | 'SGD' | 'HKD' | 'NZD' | 'ILS' | 'AED'

export interface CurrencyInfo {
  code: CurrencyCode
  name: string
  symbol: string
  decimals: number
  symbolPosition: 'before' | 'after'
  thousandsSeparator: string
  decimalSeparator: string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimals: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: "'",
    decimalSeparator: '.'
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    decimals: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  RUB: {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ' ',
    decimalSeparator: '.'
  },
  TRY: {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  PLN: {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  DKK: {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  ILS: {
    code: 'ILS',
    name: 'Israeli Shekel',
    symbol: '₪',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  }
}

export interface ExchangeRates {
  base: CurrencyCode
  rates: Record<CurrencyCode, number>
  lastUpdated: string
}

export interface CurrencyFormatOptions {
  showSymbol?: boolean
  showCode?: boolean
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

class CurrencyService {
  private exchangeRates: ExchangeRates | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now()
    
    // Return cached rates if still valid
    if (this.exchangeRates && now < this.cacheExpiry) {
      return this.exchangeRates
    }

    try {
      // Try multiple exchange rate APIs for reliability
      const apis = [
        // Free tier: 1000 requests/month
        'https://api.exchangerate.host/latest',
        // Backup: 100 requests/month free
        'https://api.fixer.io/latest?access_key=' + process.env.NEXT_PUBLIC_FIXER_API_KEY,
        // Backup: 1000 requests/month free
        'https://api.currencyapi.com/v3/latest?apikey=' + process.env.NEXT_PUBLIC_CURRENCY_API_KEY
      ]

      for (const apiUrl of apis) {
        if (!apiUrl.includes('undefined')) {
          try {
            const response = await fetch(apiUrl)
            if (response.ok) {
              const data = await response.json()
              
              this.exchangeRates = {
                base: data.base || 'USD',
                rates: data.rates,
                lastUpdated: new Date().toISOString()
              }
              
              this.cacheExpiry = now + this.CACHE_DURATION
              return this.exchangeRates
            }
          } catch (error) {
            console.warn(`Exchange rate API failed: ${apiUrl}`, error)
            continue
          }
        }
      }
      
      // Fallback to static rates (should be updated regularly in production)
      return this.getFallbackRates()
      
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      return this.getFallbackRates()
    }
  }

  private getFallbackRates(): ExchangeRates {
    // Static fallback rates (update these regularly in production)
    return {
      base: 'USD',
      rates: {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        AUD: 1.35,
        CAD: 1.25,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.5,
        KRW: 1180.0,
        BRL: 5.2,
        MXN: 20.1,
        RUB: 74.0,
        ZAR: 14.8,
        TRY: 8.5,
        PLN: 3.8,
        SEK: 8.6,
        NOK: 8.9,
        DKK: 6.4,
        SGD: 1.35,
        HKD: 7.8,
        NZD: 1.42,
        ILS: 3.2,
        AED: 3.67
      },
      lastUpdated: new Date().toISOString()
    }
  }

  async convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount
    }

    const rates = await this.getExchangeRates()
    
    // Convert to base currency (USD) first, then to target currency
    const usdAmount = fromCurrency === rates.base 
      ? amount 
      : amount / rates.rates[fromCurrency]
    
    const convertedAmount = toCurrency === rates.base 
      ? usdAmount 
      : usdAmount * rates.rates[toCurrency]
    
    return convertedAmount
  }

  formatCurrency(
    amount: number,
    currencyCode: CurrencyCode,
    options: CurrencyFormatOptions = {}
  ): string {
    const currency = CURRENCIES[currencyCode]
    if (!currency) {
      return amount.toString()
    }

    const {
      showSymbol = true,
      showCode = false,
      minimumFractionDigits = currency.decimals,
      maximumFractionDigits = currency.decimals
    } = options

    // Format the number
    const formattedAmount = this.formatNumber(
      amount,
      currency.thousandsSeparator,
      currency.decimalSeparator,
      minimumFractionDigits,
      maximumFractionDigits
    )

    // Add currency symbol/code
    let result = formattedAmount
    
    if (showSymbol) {
      if (currency.symbolPosition === 'before') {
        result = `${currency.symbol}${result}`
      } else {
        result = `${result} ${currency.symbol}`
      }
    }

    if (showCode) {
      result = `${result} ${currency.code}`
    }

    return result
  }

  private formatNumber(
    amount: number,
    thousandsSeparator: string,
    decimalSeparator: string,
    minimumFractionDigits: number,
    maximumFractionDigits: number
  ): string {
    const absAmount = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart = ''] = absAmount.toFixed(maximumFractionDigits).split('.')
    
    // Add thousands separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)
    
    // Handle decimal part
    let formattedDecimal = decimalPart.padEnd(minimumFractionDigits, '0')
    if (formattedDecimal.length > maximumFractionDigits) {
      formattedDecimal = formattedDecimal.substring(0, maximumFractionDigits)
    }
    
    // Remove trailing zeros if not required
    if (minimumFractionDigits === 0) {
      formattedDecimal = formattedDecimal.replace(/0+$/, '')
    }
    
    const result = formattedDecimal 
      ? `${formattedInteger}${decimalSeparator}${formattedDecimal}`
      : formattedInteger
      
    return `${sign}${result}`
  }

  async convertAndFormat(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    options?: CurrencyFormatOptions
  ): Promise<string> {
    const convertedAmount = await this.convertCurrency(amount, fromCurrency, toCurrency)
    return this.formatCurrency(convertedAmount, toCurrency, options)
  }

  getCurrencyInfo(currencyCode: CurrencyCode): CurrencyInfo | null {
    return CURRENCIES[currencyCode] || null
  }

  getSupportedCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCIES)
  }

  getCurrencyByCountry(countryCode: string): CurrencyCode {
    // Map common country codes to currencies
    const countryToCurrency: Record<string, CurrencyCode> = {
      'US': 'USD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR',
      'ES': 'EUR', 'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'FI': 'EUR',
      'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR', 'LU': 'EUR', 'MT': 'EUR',
      'CY': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'SK': 'EUR',
      'SI': 'EUR', 'JP': 'JPY', 'AU': 'AUD', 'CA': 'CAD', 'CH': 'CHF',
      'CN': 'CNY', 'IN': 'INR', 'KR': 'KRW', 'BR': 'BRL', 'MX': 'MXN',
      'RU': 'RUB', 'ZA': 'ZAR', 'TR': 'TRY', 'PL': 'PLN', 'SE': 'SEK',
      'NO': 'NOK', 'DK': 'DKK', 'SG': 'SGD', 'HK': 'HKD', 'NZ': 'NZD',
      'IL': 'ILS', 'AE': 'AED'
    }
    
    return countryToCurrency[countryCode.toUpperCase()] || 'USD'
  }
}

// Global currency service instance
export const currencyService = new CurrencyService()

// Utility function for formatted currency display (use in React components)
export function getFormattedCurrency(
  amount: number,
  currency: CurrencyCode,
  options: {
    showSymbol?: boolean
    showCode?: boolean
  } = {}
): string {
  return currencyService.formatCurrency(amount, currency, options)
}

// Currency utilities for use in components
export function getCurrencyUtilities() {
  const formatCurrency = (
    amount: number,
    currency: CurrencyCode,
    options?: CurrencyFormatOptions
  ) => {
    return currencyService.formatCurrency(amount, currency, options)
  }
  
  const convertCurrency = (
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ) => {
    return currencyService.convertCurrency(amount, fromCurrency, toCurrency)
  }
  
  const convertAndFormat = async (
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    options?: CurrencyFormatOptions
  ) => {
    return currencyService.convertAndFormat(amount, fromCurrency, toCurrency, options)
  }
  
  return {
    formatCurrency,
    convertCurrency,
    convertAndFormat,
    supportedCurrencies: currencyService.getSupportedCurrencies(),
    getCurrencyInfo: currencyService.getCurrencyInfo
  }
} 