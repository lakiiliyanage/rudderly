'use client'

import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AgentConfig } from '@/lib/types/agent'

const TOTAL_STEPS = 5

const STEPS = [
  { title: 'Agent Type',        description: 'What kind of agent are you building?' },
  { title: 'Personality',       description: 'How should your agent communicate?' },
  { title: 'Capabilities',      description: 'What tools can your agent use?' },
  { title: 'Limits',            description: 'Set boundaries for your agent.' },
  { title: 'Review & Save',     description: "Confirm your agent's configuration." },
]

const defaultConfig: AgentConfig = {
  type: 'custom',
  personality: {
    tone: 50,
    verbosity: 50,
    examplePhrases: [],
  },
  capabilities: {
    webSearch:  false,
    email:      false,
    calendar:   false,
    calculator: false,
  },
  limits: {
    maxMessageLength: 4000,
    avoidTopics: [],
  },
}

export default function AgentWizard() {
  const [currentStep, setCurrentStep]   = useState(1)
  const [agentConfig, setAgentConfig]   = useState<AgentConfig>(defaultConfig)

  const progressValue = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  function handleBack() {
    setCurrentStep(s => Math.max(1, s - 1))
  }

  function handleNext() {
    setCurrentStep(s => Math.min(TOTAL_STEPS, s + 1))
  }

  function handleSave() {
    // TODO: wire up Supabase POST in a later sprint
    console.log('Saving agent config:', agentConfig)
  }

  const step = STEPS[currentStep - 1]

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
              className={`text-xs ${i + 1 === currentStep ? 'text-violet-400 font-medium' : 'text-gray-600'}`}
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
          <Button onClick={handleNext}>
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

// ── Per-step placeholder content ──────────────────────────────────────────────

interface StepContentProps {
  step: number
  agentConfig: AgentConfig
  setAgentConfig: React.Dispatch<React.SetStateAction<AgentConfig>>
}

function StepContent({ step, agentConfig }: StepContentProps) {
  switch (step) {
    case 1:
      return (
        <div className="py-6 text-center text-gray-500 text-sm">
          <p>Agent type selector coming soon.</p>
          <p className="mt-1 text-xs text-gray-600">Current: <code>{agentConfig.type}</code></p>
        </div>
      )
    case 2:
      return (
        <div className="py-6 text-center text-gray-500 text-sm">
          <p>Tone and verbosity sliders coming soon.</p>
          <p className="mt-1 text-xs text-gray-600">
            Tone: {agentConfig.personality.tone} · Verbosity: {agentConfig.personality.verbosity}
          </p>
        </div>
      )
    case 3:
      return (
        <div className="py-6 text-center text-gray-500 text-sm">
          <p>Capability toggles coming soon.</p>
        </div>
      )
    case 4:
      return (
        <div className="py-6 text-center text-gray-500 text-sm">
          <p>Message length limit and topic blocklist coming soon.</p>
          <p className="mt-1 text-xs text-gray-600">
            Max length: {agentConfig.limits.maxMessageLength} chars
          </p>
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
