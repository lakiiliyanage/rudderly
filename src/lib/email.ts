import { Resend } from 'resend'
import { env } from '@/lib/env'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) resend = new Resend(env.RESEND_API_KEY)
  return resend
}

export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const greeting = name ? `Hi ${name}` : 'Hi there'
  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard`

  try {
    console.log('[EMAIL] calling Resend.send to', to)
    const result = await getResend().emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'Welcome to AgentForge 🎉',
      html: `<p>${greeting} — you're in! Create your first AI agent: <a href="${dashboardUrl}">${dashboardUrl}</a>. Questions? Reply to this email.</p>`,
    })
    console.log('[EMAIL] Resend result:', JSON.stringify(result))
  } catch (err) {
    console.error('[EMAIL] Failed to send welcome email to', to, err)
  }
}

export async function sendUpgradeEmail(to: string): Promise<void> {
  try {
    await getResend().emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'You\'re on AgentForge Pro ✨',
      html: `<p>Thanks for upgrading! Unlimited agents and messages are now unlocked. Manage your subscription any time from your dashboard.</p>`,
    })
  } catch (err) {
    console.error('[EMAIL] Failed to send upgrade email to', to, err)
  }
}
