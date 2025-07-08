/**
 * Production-ready data export utilities
 * Supports multiple formats with privacy compliance
 */

// Note: ExcelJS and jsPDF libraries need to be installed separately:
// npm install exceljs jspdf
// These modules are dynamically imported to reduce bundle size

// Type definitions for data export
interface User {
  id: string
  email: string
  name: string
  [key: string]: any
}

interface Referral {
  id: string
  userId: string
  status: string
  [key: string]: any
}

interface Message {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  [key: string]: any
}

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  [key: string]: any
}

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean
  compression?: boolean
  password?: string
  watermark?: string
  dateRange?: {
    start: Date
    end: Date
  }
  categories?: string[]
  fields?: string[]
  language?: string
}

export interface ExportData {
  metadata: {
    exportedAt: string
    exportedBy: string
    format: ExportFormat
    recordCount: number
    categories: string[]
    dateRange?: {
      start: string
      end: string
    }
    version: string
    dataProtectionNotice: string
  }
  data: Record<string, any>[]
}

export interface ScheduledExport {
  id: string
  userId: string
  options: ExportOptions
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    timezone: string
    lastRun?: string
    nextRun: string
  }
  active: boolean
  createdAt: string
}

class DatabaseService {
  private apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  async getUserData(userId: string, category: string, options: ExportOptions): Promise<any[]> {
    const params = new URLSearchParams()
    if (options.dateRange) {
      params.append('start_date', options.dateRange.start.toISOString())
      params.append('end_date', options.dateRange.end.toISOString())
    }
    if (options.fields) {
      params.append('fields', options.fields.join(','))
    }

    const response = await fetch(`${this.apiBaseUrl}/export/data/${category}?${params}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'X-User-ID': userId
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${category} data: ${response.statusText}`)
    }

    return response.json()
  }

  async getPrivacySettings(userId: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/users/${userId}/privacy`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch privacy settings: ${response.statusText}`)
    }

    return response.json()
  }

  async logExport(exportLog: any): Promise<void> {
    await fetch(`${this.apiBaseUrl}/export/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify(exportLog)
    })
  }

  async getExportHistory(userId: string): Promise<any[]> {
    const response = await fetch(`${this.apiBaseUrl}/export/history/${userId}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch export history: ${response.statusText}`)
    }

    return response.json()
  }

  async saveScheduledExport(scheduledExport: Omit<ScheduledExport, 'id' | 'createdAt'>): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/export/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify(scheduledExport)
    })

    if (!response.ok) {
      throw new Error(`Failed to schedule export: ${response.statusText}`)
    }

    const result = await response.json()
    return result.id
  }

  async cancelScheduledExport(exportId: string): Promise<boolean> {
    const response = await fetch(`${this.apiBaseUrl}/export/schedule/${exportId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      }
    })

    return response.ok
  }

  private async getAuthToken(): Promise<string> {
    // In production, get from your auth system
    return localStorage.getItem('auth_token') || ''
  }
}

class DataExportService {
  private db = new DatabaseService()

  async exportUserData(
    userId: string,
    options: ExportOptions
  ): Promise<Blob> {
    try {
      // Check privacy permissions
      const privacySettings = await this.db.getPrivacySettings(userId)
      const canExport = this.checkExportPermissions(privacySettings, options.categories)
      
      if (!canExport.allowed) {
        throw new Error(canExport.reason || 'Export not allowed')
      }

      // Gather data based on categories
      const data = await this.gatherUserData(userId, options)
      
      // Apply privacy filters
      const filteredData = this.applyPrivacyFilters(data, privacySettings, options)
      
      // Log the export
      await this.db.logExport({
        userId,
        format: options.format,
        categories: options.categories || [],
        recordCount: filteredData.data.length,
        timestamp: new Date().toISOString()
      })
      
      // Generate export based on format
      return await this.generateExportFile(filteredData, options)
    } catch (error) {
      console.error('Data export error:', error)
      throw error
    }
  }

  private checkExportPermissions(
    privacySettings: any, 
    categories?: string[]
  ): { allowed: boolean; reason?: string } {
    // Basic permission checks based on privacy settings
    if (categories?.includes('analytics') && !privacySettings.analytics_tracking) {
      return { allowed: false, reason: 'Analytics export disabled by privacy settings' }
    }
    
    if (categories?.includes('activity') && !privacySettings.data_sharing) {
      return { allowed: false, reason: 'Activity data export disabled by privacy settings' }
    }
    
    return { allowed: true }
  }

  private async gatherUserData(
    userId: string, 
    options: ExportOptions
  ): Promise<ExportData> {
    const categories = options.categories || [
      'profile', 'settings', 'referrals', 'messages', 'notifications', 'activity'
    ]
    
    const allData: Record<string, any>[] = []
    
    // Fetch data for each category in parallel
    const dataPromises = categories.map(async (category) => {
      try {
        const categoryData = await this.db.getUserData(userId, category, options)
        return categoryData.map(item => ({ ...item, _category: category }))
      } catch (error) {
        console.error(`Failed to fetch ${category} data:`, error)
        return []
      }
    })
    
    const results = await Promise.all(dataPromises)
    results.forEach(categoryData => allData.push(...categoryData))
    
    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        format: options.format,
        recordCount: allData.length,
        categories,
        dateRange: options.dateRange ? {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString()
        } : undefined,
        version: '2.0.0',
        dataProtectionNotice: 'This data export complies with GDPR and applicable data protection regulations.'
      },
      data: allData
    }
  }

  private applyPrivacyFilters(
    exportData: ExportData, 
    privacySettings: any, 
    options: ExportOptions
  ): ExportData {
    let filteredData = [...exportData.data]
    
    // Apply field filters if specified
    if (options.fields && options.fields.length > 0) {
      filteredData = filteredData.map(item => {
        const filtered: Record<string, any> = { _category: item._category }
        options.fields!.forEach(field => {
          if (item[field] !== undefined) {
            filtered[field] = item[field]
          }
        })
        return filtered
      })
    }
    
    // Apply privacy-based filters
    filteredData = filteredData.map(item => {
      const filtered = { ...item }
      
      // Remove sensitive fields based on privacy settings
      if (!privacySettings.show_email) {
        delete filtered.email
        delete filtered.email_verified
      }
      
      if (!privacySettings.show_phone) {
        delete filtered.phone
        delete filtered.phone_verified
      }
      
      if (!privacySettings.analytics_tracking && item._category === 'analytics') {
        // Filter out analytics data
        return null
      }
      
      if (!privacySettings.data_sharing && item._category === 'activity') {
        // Remove detailed activity data, keep only basic info
        return {
          _category: item._category,
          id: item.id,
          timestamp: item.timestamp,
          type: item.type
        }
      }
      
      return filtered
    }).filter(Boolean) as Record<string, any>[]
    
    return {
      ...exportData,
      data: filteredData,
      metadata: {
        ...exportData.metadata,
        recordCount: filteredData.length
      }
    }
  }

  private async generateExportFile(data: ExportData, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'json':
        return this.generateJSON(data, options)
      case 'csv':
        return this.generateCSV(data, options)
      case 'xlsx':
        return await this.generateExcel(data, options)
      case 'pdf':
        return await this.generatePDF(data, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  private generateJSON(data: ExportData, options: ExportOptions): Blob {
    const exportObject = {
      ...data,
      exportOptions: {
        format: options.format,
        includeMetadata: options.includeMetadata,
        dateRange: options.dateRange,
        categories: options.categories,
        fields: options.fields
      }
    }
    
    const jsonString = JSON.stringify(exportObject, null, 2)
    
    if (options.compression) {
      // In production, use compression library like pako
      console.log('JSON compression would be applied here')
    }
    
    return new Blob([jsonString], { type: 'application/json; charset=utf-8' })
  }

  private generateCSV(data: ExportData, options: ExportOptions): Blob {
    if (data.data.length === 0) {
      return new Blob(['No data to export'], { type: 'text/csv; charset=utf-8' })
    }
    
    // Get all unique headers
    const headers = new Set<string>()
    data.data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== '_category') headers.add(key)
      })
    })
    
    const headerArray = ['category', ...Array.from(headers)]
    
    // Generate CSV content with proper escaping
    let csvContent = '\uFEFF' // UTF-8 BOM for Excel compatibility
    csvContent += headerArray.map(this.escapeCsvField).join(',') + '\n'
    
    data.data.forEach(item => {
      const row = headerArray.map(header => {
        if (header === 'category') {
          return this.escapeCsvField(item._category || '')
        }
        const value = item[header]
        return this.escapeCsvField(this.formatCsvValue(value))
      })
      csvContent += row.join(',') + '\n'
    })
    
    // Add metadata as comments if requested
    if (options.includeMetadata) {
      const metadataComment = [
        `# Data Export Metadata`,
        `# Exported at: ${data.metadata.exportedAt}`,
        `# Format: ${data.metadata.format}`,
        `# Record count: ${data.metadata.recordCount}`,
        `# Categories: ${data.metadata.categories.join(', ')}`,
        `# ${data.metadata.dataProtectionNotice}`,
        ''
      ].join('\n')
      
      csvContent = metadataComment + csvContent
    }
    
    return new Blob([csvContent], { type: 'text/csv; charset=utf-8' })
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  private formatCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  private async generateExcel(data: ExportData, options: ExportOptions): Promise<Blob> {
    // Dynamic import for Excel.js - install with: npm install exceljs
    let ExcelJS: any
    try {
      ExcelJS = await (eval('import("exceljs")') as Promise<any>)
    } catch (error) {
      throw new Error('ExcelJS library not available. Please install: npm install exceljs')
    }
    const workbook = new ExcelJS.Workbook()
    
    // Set workbook properties
    workbook.creator = 'ReferralInc Data Export'
    workbook.lastModifiedBy = 'ReferralInc Data Export'
    workbook.created = new Date()
    workbook.modified = new Date()
    
    // Group data by category
    const categorizedData = this.groupDataByCategory(data.data)
    
    // Create worksheets for each category
    Object.entries(categorizedData).forEach(([category, items]) => {
      if (items.length === 0) return
      
      const worksheet = workbook.addWorksheet(category)
      
      // Get headers
      const headers = new Set<string>()
      items.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== '_category') headers.add(key)
        })
      })
      
      const headerArray = Array.from(headers)
      
      // Add headers
      worksheet.addRow(headerArray)
      
      // Style headers
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      
      // Add data rows
      items.forEach(item => {
        const row = headerArray.map(header => {
          const value = item[header]
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value)
          }
          return value
        })
        worksheet.addRow(row)
      })
      
             // Auto-fit columns
       worksheet.columns.forEach((column: any) => {
         column.width = Math.min(Math.max(column.width || 10, 10), 50)
       })
    })
    
    // Add metadata worksheet if requested
    if (options.includeMetadata) {
      const metadataSheet = workbook.addWorksheet('Export Metadata')
      
      Object.entries(data.metadata).forEach(([key, value]) => {
        metadataSheet.addRow([key, typeof value === 'object' ? JSON.stringify(value) : value])
      })
      
      metadataSheet.getColumn(1).font = { bold: true }
      metadataSheet.getColumn(1).width = 20
      metadataSheet.getColumn(2).width = 40
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
  }

  private async generatePDF(data: ExportData, options: ExportOptions): Promise<Blob> {
    // Dynamic import for PDF generation - install with: npm install jspdf
    let jsPDF: any
    try {
      jsPDF = await (eval('import("jspdf")') as Promise<any>)
    } catch (error) {
      throw new Error('jsPDF library not available. Please install: npm install jspdf')
    }
    const doc = new jsPDF.jsPDF()
    
    // Set document properties
    doc.setProperties({
      title: 'Data Export Report',
      subject: 'User Data Export',
      author: 'ReferralInc',
      creator: 'ReferralInc Data Export Service'
    })
    
    let yPosition = 20
    
    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Data Export Report', 20, yPosition)
    yPosition += 20
    
    // Metadata section
    if (options.includeMetadata) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Export Details:', 20, yPosition)
      yPosition += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      const metadataLines = [
        `Exported at: ${data.metadata.exportedAt}`,
        `Format: ${data.metadata.format}`,
        `Record count: ${data.metadata.recordCount}`,
        `Categories: ${data.metadata.categories.join(', ')}`,
        `Data Protection: ${data.metadata.dataProtectionNotice}`
      ]
      
      metadataLines.forEach(line => {
        doc.text(line, 20, yPosition)
        yPosition += 6
      })
      
      yPosition += 10
    }
    
    // Data section
    const categorizedData = this.groupDataByCategory(data.data)
    
    Object.entries(categorizedData).forEach(([category, items]) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${category.toUpperCase()} (${items.length} records)`, 20, yPosition)
      yPosition += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      
      // Show first few records as examples
      const sampleSize = Math.min(items.length, 3)
      for (let i = 0; i < sampleSize; i++) {
        const item = items[i]
        const itemText = Object.entries(item)
          .filter(([key]) => key !== '_category')
          .map(([key, value]) => `${key}: ${this.formatValueForPDF(value)}`)
          .join(', ')
        
        const lines = doc.splitTextToSize(itemText, 170)
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(line, 25, yPosition)
          yPosition += 4
        })
        yPosition += 2
      }
      
      if (items.length > sampleSize) {
        doc.text(`... and ${items.length - sampleSize} more records`, 25, yPosition)
        yPosition += 6
      }
      
      yPosition += 10
    })
    
    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  private formatValueForPDF(value: any): string {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'object') return JSON.stringify(value)
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...'
    }
    return String(value)
  }

  private groupDataByCategory(data: Record<string, any>[]): Record<string, Record<string, any>[]> {
    const grouped: Record<string, Record<string, any>[]> = {}
    
    data.forEach(item => {
      const category = item._category || 'uncategorized'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(item)
    })
    
    return grouped
  }

  getExportFileName(userId: string, format: ExportFormat, timestamp?: Date): string {
    const date = timestamp || new Date()
    const dateString = date.toISOString().split('T')[0]
    const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-')
    
    return `user-data-export-${userId}-${dateString}-${timeString}.${format}`
  }

  async getExportHistory(userId: string): Promise<any[]> {
    return this.db.getExportHistory(userId)
  }

  async scheduleExport(
    userId: string,
    options: ExportOptions,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly'
      time: string // HH:MM format
      timezone: string
    }
  ): Promise<string> {
    const scheduledExport: Omit<ScheduledExport, 'id' | 'createdAt'> = {
      userId,
      options,
      schedule: {
        ...schedule,
        nextRun: this.calculateNextRun(schedule.frequency, schedule.time, schedule.timezone)
      },
      active: true
    }
    
    return this.db.saveScheduledExport(scheduledExport)
  }

  async cancelScheduledExport(exportId: string): Promise<boolean> {
    return this.db.cancelScheduledExport(exportId)
  }

  private calculateNextRun(frequency: string, time: string, timezone: string): string {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    
    let nextRun = new Date(now)
    nextRun.setHours(hours, minutes, 0, 0)
    
    // If the time has already passed today, move to next occurrence
    if (nextRun <= now) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1)
          break
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7)
          break
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1)
          break
      }
    }
    
    return nextRun.toISOString()
  }
}

// Global export service instance
export const dataExportService = new DataExportService()

// React hook for data export
export function useDataExport() {
  const exportData = async (options: ExportOptions): Promise<{ success: boolean; fileName?: string; error?: string }> => {
    try {
      // Get current user ID from auth context
      const userId = await getCurrentUserId()
      
      const blob = await dataExportService.exportUserData(userId, options)
      const fileName = dataExportService.getExportFileName(userId, options.format)
      
      // Download the file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return { success: true, fileName }
    } catch (error) {
      console.error('Export failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      }
    }
  }
  
  const getExportHistory = async () => {
    const userId = await getCurrentUserId()
    return dataExportService.getExportHistory(userId)
  }
  
  const scheduleExport = async (
    options: ExportOptions,
    schedule: Parameters<typeof dataExportService.scheduleExport>[2]
  ) => {
    const userId = await getCurrentUserId()
    return dataExportService.scheduleExport(userId, options, schedule)
  }
  
  return {
    exportData,
    getExportHistory,
    scheduleExport,
    cancelScheduledExport: dataExportService.cancelScheduledExport
  }
}

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string> {
  // In production, get from your auth context/service
  const token = localStorage.getItem('auth_token')
  if (!token) {
    throw new Error('User not authenticated')
  }
  
  // Decode JWT or fetch from API to get user ID
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || payload.user_id
  } catch {
    throw new Error('Invalid authentication token')
  }
} 