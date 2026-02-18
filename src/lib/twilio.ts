import twilio from 'twilio'

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio not configured — skipping SMS')
    return false
  }

  try {
    const client = twilio(accountSid, authToken)
    await client.messages.create({ to, from: fromNumber, body })
    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}
