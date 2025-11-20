export interface SmsProviderGateway {
  /**
   * Envoie un SMS avec un message personnalisé
   */
  sendSms(to: string, message: string): Promise<{ messageId: string; status: string }>

  /**
   * Envoie un SMS de validation avec un code
   */
  sendValidationCode(to: string, code: string): Promise<{ messageId: string; status: string }>

  /**
   * Vérifie le statut d'un message envoyé
   */
  getMessageStatus(messageId: string): Promise<{ status: string; error?: string }>

  /**
   * Vérifie la validité d'un numéro de téléphone
   */
  validatePhoneNumber(phoneNumber: string): Promise<{ isValid: boolean; formattedNumber?: string }>
}
