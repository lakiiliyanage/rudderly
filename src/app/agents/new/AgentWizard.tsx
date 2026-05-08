'use client'

import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import type { AgentConfig } from '@/lib/types/agent'

const TOTAL_STEPS = 5

const STEPS = [
  { title: 'Agent Type',    description: 'What kind of agent are you building?' },
  { title: 'Personality',   description: 'How should your agent communicate?' },
  { title: 'Capabilities',  description: 'What tools can your agent use?' },
  { title: 'Limits',        description: 'Set boundaries for your agent.' },
  { title: 'Review & Save', description: "Confirm your agent's configuration." },
]

const AGENT_TYPES: {
  value: AgentConfig['type']
  emoji: string
  name: string
  description: string
}[] = [
  {
    value: 'customer-support',
    emoji: '🤝',
    name: 'Customer Support',
    description: 'Answers questions, resolves issues, and guides customers through your product.',
  },
  {
    value: 'research',
    emoji: '🔍',
    name: 'Research',
    description: 'Finds, summarises, and synthesises information on any topic.',
  },
  {
    value: 'personal-assistant',
    emoji: '🧑‍💼',
    name: 'Personal Assistant',
    description: 'Manages tasks, drafts messages, and keeps you organised day-to-day.',
  },
  {
    value: 'custom',
    emoji: '✨',
    name: 'Custom',
    description: 'Fully configurable — build any kind of agent from scratch.',
  },
]

const CAPABILITIES: {
  key: keyof AgentConfig['capabilities']
  label: string
  description: string
}[] = [
  { key: 'webSearch',  label: 'Web Search',  description: 'Finds current information from the internet in real time.' },
  { key: 'email',      label: 'Email',       description: 'Reads and sends emails on your behalf.' },
  { key: 'calendar',   label: 'Calendar',    description: 'Views and creates calendar events.' },
  { key: 'calculator', label: 'Calculator',  description: 'Performs precise numerical calculations.' },
]

const defaultConfig: AgentConfig = {
  type: 'custom',
  personality: { tone: 50, verbosity: 50, examplePhrases: [] },
  capabilities: { webSearch: false, email: false, calendar: false, calculator: false },
  limits: { maxMessageLength: 4000, avoidTopics: [] },
}

// ── Wizard shell ───────────────────────────────────────────────────────────────

export default function AgentWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(defaultConfig)
  const [typeSelected, setTypeSelected]   = useState(false)
  const [showTypeError, setShowTypeError] = useState(false)

  const progressValue = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  function handleTypeSelect(type: AgentConfig['type']) {
    setAgentConfig(prev => ({ ...prev, type }))
    setTypeSelected(true)
    setShowTypeError(false)
  }

  function handlePersonalityChange(personality: AgentConfig['personality']) {
    setAgentConfig(prev => ({ ...prev, personality }))
  }

  function handleCapabilitiesChange(capabilities: AgentConfig['capabilities']) {
    setAgentConfig(prev => ({ ...prev, capabilities }))
  }

  function handleBack() {
    setCurrentStep(s => Math.max(1, s - 1))
    setShowTypeError(false)
  }

  function handleNext() {
    if (currentStep === 1 && !typeSelected) {
      setShowTypeError(true)
      return
    }
    setShowTypeError(false)
    setCurrentStep(s => Math.min(TOTAL_STEPS, s + 1))
  }

  function handleSave() {
    // TODO: wire up Supabase POST in a later sprint
    console.log('Saving agent config:', agentConfig)
  }

  const step = STEPS[currentStep - 1]
  const nextIsBlocked = currentStep === 1 && !typeSelected

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create New Agent</h1>
        <p className="text-sm text-gray-500">
          Step {currentStep} of {TOTAL_STEPS} — {step.title}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <Progress value={progressValue} className="h-1.5" />
        <div className="flex justify-between mt-2">
          {STEPS.map((s, i) => (
            <span
              key={i}
              className={`text-xs ${
                i + 1 === currentStep ? 'text-violet-400 font-medium' : 'text-gray-600'
              }`}
            >
              {s.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step card */}
      <Card className="bg-gray-900 border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">{step.title}</CardTitle>
          <CardDescription className="text-gray-400">{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <StepContent
            step={currentStep}
            agentConfig={agentConfig}
            setAgentConfig={setAgentConfig}
            selectedType={typeSelected ? agentConfig.type : null}
            onTypeSelect={handleTypeSelect}
            onPersonalityChange={handlePersonalityChange}
            onCapabilitiesChange={handleCapabilitiesChange}
            showTypeError={showTypeError}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {currentStep > 1 ? (
          <Button variant="ghost" onClick={handleBack} className="text-gray-400 hover:text-white">
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < TOTAL_STEPS ? (
          <Button
            onClick={handleNext}
            className={nextIsBlocked ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-500">
            Save Agent
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Per-step content dispatcher ────────────────────────────────────────────────

interface StepContentProps {
  step: number
  agentConfig: AgentConfig
  setAgentConfig: React.Dispatch<React.SetStateAction<AgentConfig>>
  selectedType: AgentConfig['type'] | null
  onTypeSelect: (type: AgentConfig['type']) => void
  onPersonalityChange: (personality: AgentConfig['personality']) => void
  onCapabilitiesChange: (capabilities: AgentConfig['capabilities']) => void
  showTypeError: boolean
}

function StepContent({
  step,
  agentConfig,
  selectedType,
  onTypeSelect,
  onPersonalityChange,
  onCapabilitiesChange,
  showTypeError,
}: StepContentProps) {
  switch (step) {
    case 1:
      return (
        <TypeSelectorStep
          selectedType={selectedType}
          onTypeSelect={onTypeSelect}
          showError={showTypeError}
        />
      )
    case 2:
      return (
        <PersonalityStep
          personality={agentConfig.personality}
          onChange={onPersonalityChange}
        />
      )
    case 3:
      return (
        <CapabilitiesStep
          capabilities={agentConfig.capabilities}
          onChange={onCapabilitiesChange}
        />
      )
    case 4:
      return (
        <div className="py-6 text-center text-gray-500 text-sm">
          <p>Message length limit and topic blocklist coming soon.</p>
        </div>
      )
    case 5:
      return (
        <div className="py-6 text-center text-gray-500 text-sm">
          <p>Full config review coming soon.</p>
          <pre className="mt-3 text-left text-xs text-gray-600 bg-gray-800 rounded-lg p-4 overflow-auto">
            {JSON.stringify(agentConfig, null, 2)}
          </pre>
        </div>
      )
    default:
      return null
  }
}

// ── Step 1: Type Selector ──────────────────────────────────────────────────────

interface TypeSelectorStepProps {
  selectedType: AgentConfig['type'] | null
  onTypeSelect: (type: AgentConfig['type']) => void
  showError: boolean
}

function TypeSelectorStep({ selectedType, onTypeSelect, showError }: TypeSelectorStepProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {AGENT_TYPES.map(({ value, emoji, name, description }) => {
          const isSelected = selectedType === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onTypeSelect(value)}
              className={`relative text-left rounded-xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              )}

              <div className="text-2xl mb-3">{emoji}</div>
              <p className={`text-sm font-semibold mb-1 ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                {name}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
            </button>
          )
        })}
      </div>

      {showError && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-red-400">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          Please choose an agent type to continue.
        </p>
      )}
    </div>
  )
}

// ── Step 2: Personality ────────────────────────────────────────────────────────

interface PersonalityStepProps {
  personality: AgentConfig['personality']
  onChange: (p: AgentConfig['personality']) => void
}

function PersonalityStep({ personality, onChange }: PersonalityStepProps) {
  const [phraseInput, setPhraseInput] = useState('')

  function addPhrase() {
    const trimmed = phraseInput.trim()
    if (!trimmed) return
    onChange({ ...personality, examplePhrases: [...personality.examplePhrases, trimmed] })
    setPhraseInput('')
  }

  function removePhrase(index: number) {
    onChange({
      ...personality,
      examplePhrases: personality.examplePhrases.filter((_, i) => i !== index),
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPhrase()
    }
  }

  return (
    <div className="space-y-8">

      {/* Tone */}
      <SliderField
        label="Tone"
        value={personality.tone}
        leftLabel="Very formal"
        rightLabel="Very casual"
        onChange={tone => onChange({ ...personality, tone })}
      />

      {/* Verbosity */}
      <SliderField
        label="Verbosity"
        value={personality.verbosity}
        leftLabel="Very concise"
        rightLabel="Very detailed"
        onChange={verbosity => onChange({ ...personality, verbosity })}
      />

      {/* Example phrases */}
      <div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <label className="text-sm font-medium text-gray-300">Example phrases</label>
          <span className="text-xs text-gray-500">optional</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Seed phrases that prime your agent toward a particular voice or style.
        </p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={phraseInput}
            onChange={e => setPhraseInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "Let me check that for you"'
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addPhrase}
            disabled={!phraseInput.trim()}
          >
            Add
          </Button>
        </div>

        {personality.examplePhrases.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {personality.examplePhrases.map((phrase, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="h-auto gap-1.5 py-1 pl-2.5 pr-1.5"
              >
                {phrase}
                <button
                  type="button"
                  onClick={() => removePhrase(i)}
                  aria-label={`Remove "${phrase}"`}
                  className="flex items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 3: Capabilities ───────────────────────────────────────────────────────

interface CapabilitiesStepProps {
  capabilities: AgentConfig['capabilities']
  onChange: (capabilities: AgentConfig['capabilities']) => void
}

function CapabilitiesStep({ capabilities, onChange }: CapabilitiesStepProps) {
  const enabledCount = CAPABILITIES.filter(({ key }) => capabilities[key]).length

  function toggle(key: keyof AgentConfig['capabilities'], checked: boolean) {
    onChange({ ...capabilities, [key]: checked })
  }

  return (
    <div>
      {/* Summary badge */}
      <div className="mb-5">
        <Badge variant={enabledCount > 0 ? 'default' : 'secondary'}>
          {enabledCount} of {CAPABILITIES.length} capabilities enabled
        </Badge>
      </div>

      {/* Toggle rows */}
      <div className="divide-y divide-gray-800">
        {CAPABILITIES.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <Switch
              checked={capabilities[key]}
              onCheckedChange={checked => toggle(key, checked)}
              aria-label={label}
            />
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-gray-500">
        These settings define your agent&apos;s intent. Real tool connections are wired up in a later step.
      </p>
    </div>
  )
}

// ── Shared: Slider field ───────────────────────────────────────────────────────

interface SliderFieldProps {
  label: string
  value: number
  leftLabel: string
  rightLabel: string
  onChange: (value: number) => void
}

function SliderField({ label, value, leftLabel, rightLabel, onChange }: SliderFieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="tabular-nums text-sm font-mono text-violet-400">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-violet-500"
      />
      <div className="mt-1.5 flex justify-between">
        <span className="text-xs text-gray-500">{leftLabel}</span>
        <span className="text-xs text-gray-500">{rightLabel}</span>
      </div>
    </div>
  )
}
