import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

export class CreatePaymentIntentUseCase {
  constructor(
    private makePaymentIntent: (data: CheckoutFormData) => Promise<{ clientSecret: string }>
  ) {}

  async execute(data: CheckoutFormData): Promise<string> {
    const result = await this.makePaymentIntent(data)

    if (!result.clientSecret) {
      throw new Error('Missing client secret')
    }

    return result.clientSecret
  }

  isEmailAlreadyExistsError(error: unknown): boolean {
    return (
      error instanceof Error && error.message === 'A user with this email address already exists.'
    )
  }
}
