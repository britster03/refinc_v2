import { authClient } from '../auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface FreeConversation {
  id: number
  referral_id: number
  candidate_id: number
  employee_id: number
  status: 'active' | 'completed' | 'upgrade_required' | 'cancelled'
  message_count: number
  max_messages: number
  candidate_message_count: number
  employee_message_count: number
  max_messages_per_user: number
  created_at: string
  updated_at: string
  completed_at?: string
  referral?: any
  candidate?: any
  employee?: any
}

export interface FreeConversationMessage {
  id: number
  conversation_id: number
  sender_id: number
  sender_type: 'candidate' | 'employee'
  content: string
  message_type: 'text' | 'file' | 'system'
  created_at: string
}

export interface CreateFreeConversationData {
  referral_id: number
}

export interface SendMessageData {
  content: string
  message_type?: 'text' | 'file'
}

class FreeConversationsAPI {
  private async getAuthHeaders() {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  async createFreeConversation(data: CreateFreeConversationData): Promise<FreeConversation> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/free-conversations/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to create free conversation')
    }

    return response.json()
  }

  async getFreeConversation(conversationId: number): Promise<FreeConversation> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/free-conversations/${conversationId}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to get free conversation')
    }

    return response.json()
  }

  async getFreeConversations(): Promise<FreeConversation[]> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/free-conversations/`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to get free conversations')
    }

    return response.json()
  }

  async getMessages(conversationId: number): Promise<FreeConversationMessage[]> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/free-conversations/${conversationId}/messages`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to get messages')
    }

    return response.json()
  }

  async sendMessage(conversationId: number, data: SendMessageData): Promise<FreeConversationMessage> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/free-conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      if (response.status === 402) {
        throw new Error('MESSAGE_LIMIT_REACHED')
      }
      throw new Error(errorData.detail || 'Failed to send message')
    }

    return response.json()
  }
}

export const freeConversationsAPI = new FreeConversationsAPI() 