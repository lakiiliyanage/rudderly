import type { AgentConfig } from '@/lib/types/agent'

export function buildSystemPrompt(
  name: string,
  description: string,
  config: AgentConfig
): string {
  const { personality, capabilities, limits } = config

  const toneLabel =
    personality.tone < 30 ? 'very formal and professional' :
    personality.tone < 70 ? 'balanced in tone' :
    'friendly and casual'

  const verbosityLabel =
    personality.verbosity < 30 ? 'very concise — give short, direct answers' :
    personality.verbosity < 70 ? 'moderately detailed' :
    'very detailed and thorough in explanations'

  const parts: string[] = [
    `You are ${name}.`,
    description || '',
    `Your communication style is ${toneLabel} and ${verbosityLabel}.`,
  ].filter(Boolean)

  if (personality.examplePhrases.length > 0) {
    parts.push(`You often say things like: "${personality.examplePhrases.join('", "')}"`)
  }

  const capabilityLabels: Record<keyof AgentConfig['capabilities'], string> = {
    webSearch:  'web search',
    email:      'email',
    calendar:   'calendar',
    calculator: 'calculator',
  }
  const active = (Object.keys(capabilities) as (keyof typeof capabilities)[])
    .filter(k => capabilities[k])
    .map(k => capabilityLabels[k])
  if (active.length > 0) {
    parts.push(`You have access to: ${active.join(', ')}.`)
  }

  if (limits.avoidTopics.length > 0) {
    parts.push(`Politely refuse or redirect questions about: ${limits.avoidTopics.join(', ')}.`)
  }

  return parts.join(' ')
}
