export interface ParticipantMetadata {
  userRole: 'STUDENT' | 'PROFESSOR'
}

export type SidebarMode = 'participants' | 'messages' | 'sheet' | 'exercice'

export const sidebarModeLabel: Record<SidebarMode, string> = {
  participants: 'Participants',
  messages: 'Messages',
  sheet: 'Fiche de cours',
  exercice: 'Exercices',
}

export interface Message {
  id: string
  message: string
  senderId: string
  senderName: string
  timestamp: string
  topic: string
  payload?: {
    isImage?: boolean
    mimeType?: string
    fileName?: string
  }
}
