'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { AgentConfig } from '@/lib/types/agent'

const DRAFT_KEY = 'agentforge_draft'

interface Draft {
  agentConfig:      AgentConfig
  currentStep:      number
  typeSelected:     boolean
  agentName:        string
  agentDescription: string
  savedAt:          string
}

function formatDraftTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

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

// 'documents' is excluded here because it is not a simple boolean toggle —
// it carries its own file list and gets its own UI step.
const CAPABILITIES: {
  key: Exclude<keyof AgentConfig['capabilities'], 'documents'>
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
  capabilities: { webSearch: false, email: false, calendar: false, calculator: false, documents: { enabled: false, files: [] } },
  limits: { maxMessageLength: 1000, avoidTopics: [] },
}

// ── Wizard shell ───────────────────────────────────────────────────────────────

interface AgentWizardProps {
  /** When set, the wizard pre-fills with existing data and PATCHes on save. */
  agentId?:            string
  initialName?:        string
  initialDescription?: string
  initialConfig?:      AgentConfig
}

export default function AgentWizard({
  agentId,
  initialName        = '',
  initialDescription = '',
  initialConfig,
}: AgentWizardProps = {}) {
  const router    = useRouter()
  const isEditing = !!agentId

  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection]         = useState(1)
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(
    initialConfig
      ? {
          ...defaultConfig,
          ...initialConfig,
          capabilities: {
            ...defaultConfig.capabilities,
            ...initialConfig.capabilities,
            documents: initialConfig.capabilities?.documents ?? { enabled: false, files: [] },
          },
        }
      : defaultConfig
  )
  const [typeSelected, setTypeSelected]   = useState(isEditing)
  const [showTypeError, setShowTypeError] = useState(false)

  // Step 5 — name / description / save state
  const [agentName, setAgentName]           = useState(initialName)
  const [agentDescription, setAgentDescription] = useState(initialDescription)
  const [showNameError, setShowNameError]   = useState(false)
  const [showSaveError, setShowSaveError]   = useState(false)
  const [isSaving, setIsSaving]             = useState(false)

  // ── Draft / auto-save (create mode only) ─────────────────────────────────
  const [draft, setDraft] = useState<Draft | null>(null)

  // Ref always holds the latest values so the interval closure never goes stale.
  const draftRef = useRef({ agentConfig, currentStep, typeSelected, agentName, agentDescription })
  useEffect(() => {
    draftRef.current = { agentConfig, currentStep, typeSelected, agentName, agentDescription }
  }, [agentConfig, currentStep, typeSelected, agentName, agentDescription])

  // Load any existing draft on first render (create mode only).
  useEffect(() => {
    if (isEditing) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setDraft(JSON.parse(raw) as Draft)
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [isEditing])

  // Auto-save every 30 seconds (create mode only).
  useEffect(() => {
    if (isEditing) return
    const id = setInterval(() => {
      const { agentConfig, currentStep, typeSelected, agentName, agentDescription } = draftRef.current
      const payload: Draft = { agentConfig, currentStep, typeSelected, agentName, agentDescription, savedAt: new Date().toISOString() }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    }, 30_000)
    return () => clearInterval(id)
  }, [isEditing])

  function handleResumeDraft() {
    if (!draft) return
    setAgentConfig(draft.agentConfig)
    setCurrentStep(draft.currentStep)
    setTypeSelected(draft.typeSelected)
    setAgentName(draft.agentName)
    setAgentDescription(draft.agentDescription)
    setDraft(null)
  }

  function handleStartFresh() {
    localStorage.removeItem(DRAFT_KEY)
    setDraft(null)
  }
  // ─────────────────────────────────────────────────────────────────────────

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

  function handleLimitsChange(limits: AgentConfig['limits']) {
    setAgentConfig(prev => ({ ...prev, limits }))
  }

  function handleNameChange(name: string) {
    setAgentName(name)
    if (showNameError) setShowNameError(false)
  }

  function handleBack() {
    setDirection(-1)
    setCurrentStep(s => Math.max(1, s - 1))
    setShowTypeError(false)
  }

  function handleNext() {
    if (currentStep === 1 && !typeSelected) {
      setShowTypeError(true)
      return
    }
    setShowTypeError(false)
    setDirection(1)
    setCurrentStep(s => Math.min(TOTAL_STEPS, s + 1))
  }

  async function handleSave() {
    if (!agentName.trim()) {
      setShowNameError(true)
      return
    }
    setShowNameError(false)
    setShowSaveError(false)
    setIsSaving(true)

    try {
      const url    = isEditing ? `/api/agents/${agentId}` : '/api/agents'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:        agentName.trim(),
          description: agentDescription.trim(),
          config:      agentConfig,
        }),
      })

      if (!res.ok) {
        setShowSaveError(true)
        return
      }

      const agent = await res.json()
      if (!isEditing) localStorage.removeItem(DRAFT_KEY)
      router.push(isEditing ? `/agents/${agentId}` : `/agents/${agent.id}?created=true`)
    } catch {
      setShowSaveError(true)
    } finally {
      setIsSaving(false)
    }
  }

  const step = STEPS[currentStep - 1]

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  const limitsValid =
    agentConfig.limits.maxMessageLength >= 50 &&
    agentConfig.limits.maxMessageLength <= 10_000
  const nextIsBlocked =
    (currentStep === 1 && !typeSelected) ||
    (currentStep === 4 && !limitsValid)

  return (
    <motion.div
      className="max-w-5xl mx-auto px-6 py-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >

      {/* ── Draft resume banner ── */}
      {draft && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-300">
            You have an unsaved draft from{' '}
            <span className="font-medium">{formatDraftTime(draft.savedAt)}</span>
            . Would you like to resume?
          </p>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={handleResumeDraft} className="bg-amber-600 hover:bg-amber-500 text-white">
              Resume draft
            </Button>
            <Button size="sm" variant="ghost" onClick={handleStartFresh} className="text-amber-400 hover:text-amber-200 hover:bg-amber-900/40">
              Start fresh
            </Button>
          </div>
        </div>
      )}

      {/* Two-column layout: wizard left, preview panel right on md+ */}
      <div className="md:flex md:items-start md:gap-10">
      <div className="flex-1 min-w-0">

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
      <Card className="bg-gray-900 border-gray-800 mb-24 sm:mb-8">
        <CardHeader>
          <CardTitle className="text-white">{step.title}</CardTitle>
          <CardDescription className="text-gray-400">{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <StepContent
                step={currentStep}
                agentConfig={agentConfig}
                setAgentConfig={setAgentConfig}
                selectedType={typeSelected ? agentConfig.type : null}
                onTypeSelect={handleTypeSelect}
                onPersonalityChange={handlePersonalityChange}
                onCapabilitiesChange={handleCapabilitiesChange}
                onLimitsChange={handleLimitsChange}
                agentName={agentName}
                onNameChange={handleNameChange}
                agentDescription={agentDescription}
                onDescriptionChange={setAgentDescription}
                showNameError={showNameError}
                showTypeError={showTypeError}
              />
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gray-950 border-t border-gray-800 px-6 py-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
        {/* Save error — shown above nav buttons, only on step 5 */}
        {currentStep === TOTAL_STEPS && showSaveError && (
          <p className="mb-4 flex items-center gap-1.5 text-sm text-red-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Something went wrong saving your agent. Your progress is not lost — try again.
          </p>
        )}

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
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-75 disabled:cursor-not-allowed min-w-[110px]"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : 'Save Agent'}
            </Button>
          )}
        </div>
      </div>

      </div>{/* end wizard column */}

      <AgentPreviewPanel
        agentConfig={agentConfig}
        agentName={agentName}
        typeSelected={typeSelected}
      />
      </div>{/* end two-column */}
    </motion.div>
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
  onLimitsChange: (limits: AgentConfig['limits']) => void
  agentName: string
  onNameChange: (name: string) => void
  agentDescription: string
  onDescriptionChange: (desc: string) => void
  showNameError: boolean
  showTypeError: boolean
}

function StepContent({
  step,
  agentConfig,
  selectedType,
  onTypeSelect,
  onPersonalityChange,
  onCapabilitiesChange,
  onLimitsChange,
  agentName,
  onNameChange,
  agentDescription,
  onDescriptionChange,
  showNameError,
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
        <LimitsStep
          limits={agentConfig.limits}
          onChange={onLimitsChange}
        />
      )
    case 5:
      return (
        <ReviewStep
          agentName={agentName}
          onNameChange={onNameChange}
          agentDescription={agentDescription}
          onDescriptionChange={onDescriptionChange}
          showNameError={showNameError}
          agentConfig={agentConfig}
        />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-base text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
  const [driveUrl, setDriveUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [adding, setAdding]     = useState(false)

  const enabledCount =
    CAPABILITIES.filter(({ key }) => capabilities[key]).length +
    (capabilities.documents?.enabled ? 1 : 0)

  function toggle(key: Exclude<keyof AgentConfig['capabilities'], 'documents'>, checked: boolean) {
    onChange({ ...capabilities, [key]: checked })
  }

  function toggleDocuments(checked: boolean) {
    onChange({ ...capabilities, documents: { ...(capabilities.documents ?? { enabled: false, files: [] }), enabled: checked } })
  }

  function removeFile(id: string) {
    onChange({
      ...capabilities,
      documents: {
        ...(capabilities.documents ?? { enabled: false, files: [] }),
        files: (capabilities.documents?.files ?? []).filter(f => f.id !== id),
      },
    })
  }

  async function addDocument() {
    setUrlError('')
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!match) {
      setUrlError('Please paste a valid Google Drive document URL.')
      return
    }
    const fileId = match[1]
    if ((capabilities.documents?.files ?? []).some(f => f.id === fileId)) {
      setUrlError('This document has already been added.')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`/api/drive/metadata?fileId=${fileId}`)
      if (res.status === 403) {
        setUrlError("This document isn't publicly accessible. Share it with 'Anyone with the link' in Google Drive and try again.")
        return
      }
      if (res.status === 404) {
        setUrlError("Document not found — check the URL or make sure the file hasn't been deleted.")
        return
      }
      if (!res.ok) {
        setUrlError('Could not fetch document details. Please try again.')
        return
      }
      const { id, name } = await res.json() as { id: string; name: string }
      onChange({
        ...capabilities,
        documents: {
          ...(capabilities.documents ?? { enabled: false, files: [] }),
          files: [...(capabilities.documents?.files ?? []), { id, name }],
        },
      })
      setDriveUrl('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      {/* Summary badge */}
      <div className="mb-5">
        <Badge variant={enabledCount > 0 ? 'default' : 'secondary'}>
          {enabledCount} of {CAPABILITIES.length + 1} capabilities enabled
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

        {/* Documents row */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Documents</p>
              <p className="text-xs text-gray-400 mt-0.5">Query files from Google Drive.</p>
            </div>
            <Switch
              checked={capabilities.documents?.enabled ?? false}
              onCheckedChange={toggleDocuments}
              aria-label="Documents"
            />
          </div>

          {capabilities.documents?.enabled && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste a Google Drive document URL"
                  value={driveUrl}
                  onChange={e => { setDriveUrl(e.target.value); setUrlError('') }}
                  className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={adding || driveUrl.trim() === ''}
                  onClick={addDocument}
                  className="shrink-0"
                >
                  {adding ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : 'Add'}
                </Button>
              </div>

              {urlError && (
                <p className="text-xs text-red-400">{urlError}</p>
              )}

              {(capabilities.documents?.files ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(capabilities.documents?.files ?? []).map(file => (
                    <Badge key={file.id} variant="secondary" className="gap-1.5 max-w-[220px]">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="shrink-0 rounded-sm opacity-60 hover:opacity-100"
                        aria-label={`Remove ${file.name}`}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">
                Documents must be shared with &quot;Anyone with the link&quot; in Google Drive.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 text-xs text-gray-500">
        These settings define your agent&apos;s intent. Real tool connections are wired up in a later step.
      </p>
    </div>
  )
}

// ── Step 4: Limits ────────────────────────────────────────────────────────────

interface LimitsStepProps {
  limits: AgentConfig['limits']
  onChange: (limits: AgentConfig['limits']) => void
}

function LimitsStep({ limits, onChange }: LimitsStepProps) {
  const [touched, setTouched] = useState(false)
  const [topicInput, setTopicInput] = useState('')

  const isLengthValid =
    limits.maxMessageLength >= 50 && limits.maxMessageLength <= 10_000
  const showLengthError = touched && !isLengthValid

  function handleLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTouched(true)
    const parsed = parseInt(e.target.value, 10)
    onChange({ ...limits, maxMessageLength: isNaN(parsed) ? 0 : parsed })
  }

  function addTopic() {
    const trimmed = topicInput.trim()
    if (!trimmed) return
    onChange({ ...limits, avoidTopics: [...limits.avoidTopics, trimmed] })
    setTopicInput('')
  }

  function removeTopic(index: number) {
    onChange({ ...limits, avoidTopics: limits.avoidTopics.filter((_, i) => i !== index) })
  }

  function handleTopicKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTopic()
    }
  }

  // Display blank when value is 0 (cleared field) so the input doesn't show "0"
  const displayValue = limits.maxMessageLength === 0 ? '' : limits.maxMessageLength

  return (
    <div className="space-y-8">

      {/* Max message length */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Max message length
        </label>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={50}
            max={10000}
            value={displayValue}
            onChange={handleLengthChange}
            onBlur={() => setTouched(true)}
            placeholder="1000"
            className={`w-32 rounded-lg border bg-gray-800 px-3 py-2 text-base text-white tabular-nums focus:outline-none focus:ring-1 transition-colors ${
              showLengthError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-700 focus:border-violet-500 focus:ring-violet-500'
            }`}
          />
          <span className="text-xs text-gray-500">characters per message</span>
        </div>

        <p className="mt-1.5 text-xs text-gray-500">Recommended: 500–2,000 characters</p>

        {showLengthError && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Please enter a number between 50 and 10,000.
          </p>
        )}
      </div>

      {/* Avoid topics */}
      <div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <label className="text-sm font-medium text-gray-300">Avoid topics</label>
          <span className="text-xs text-gray-500">optional</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Topics the agent will refuse or redirect when raised.
        </p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={handleTopicKeyDown}
            placeholder='e.g. "competitor pricing"'
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-base text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addTopic}
            disabled={!topicInput.trim()}
          >
            Add
          </Button>
        </div>

        {limits.avoidTopics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {limits.avoidTopics.map((topic, i) => (
              <Badge key={i} variant="secondary" className="h-auto gap-1.5 py-1 pl-2.5 pr-1.5">
                {topic}
                <button
                  type="button"
                  onClick={() => removeTopic(i)}
                  aria-label={`Remove "${topic}"`}
                  className="flex items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

// ── Shared: Preview Dialog ────────────────────────────────────────────────────

type PreviewMessage = { role: 'user' | 'assistant'; content: string }

interface PreviewDialogProps {
  agentConfig: AgentConfig
  agentName:   string
  trigger:     React.ReactNode
}

function PreviewDialog({ agentConfig, agentName, trigger }: PreviewDialogProps) {
  const [messages, setMessages] = useState<PreviewMessage[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: PreviewMessage = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chat/preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          agentConfig,
          agentName: agentName.trim() || 'Agent',
          messages:  updated.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) { setError('Preview unavailable — try again in a moment.'); return }
      const { reply } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setError('Preview unavailable — try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleSend() }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-800">
          <DialogTitle className="text-white text-base">
            Test: {agentName.trim() || 'Your Agent'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4 h-72">
          {messages.length === 0 && (
            <p className="text-center text-xs text-gray-500 mt-8">
              Send a message to test your agent&apos;s personality and behaviour.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-100 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          {error && <p className="text-center text-xs text-red-400">{error}</p>}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t border-gray-800 px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-base text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 shrink-0"
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Step 5: Review & Save ─────────────────────────────────────────────────────

interface ReviewStepProps {
  agentName: string
  onNameChange: (name: string) => void
  agentDescription: string
  onDescriptionChange: (desc: string) => void
  showNameError: boolean
  agentConfig: AgentConfig
}

function ReviewStep({
  agentName,
  onNameChange,
  agentDescription,
  onDescriptionChange,
  showNameError,
  agentConfig,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">

      {/* Agent name */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-300">
            Agent name <span className="text-red-400">*</span>
          </label>
          <span className={`text-xs tabular-nums ${agentName.length > 45 ? 'text-amber-400' : 'text-gray-500'}`}>
            {agentName.length} / 50
          </span>
        </div>
        <input
          type="text"
          value={agentName}
          onChange={e => onNameChange(e.target.value.slice(0, 50))}
          placeholder="e.g. Support Bot, Research Helper"
          className={`w-full rounded-lg border bg-gray-800 px-3 py-2 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
            showNameError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:border-violet-500 focus:ring-violet-500'
          }`}
        />
        {showNameError && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Please give your agent a name.
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-300">
            Description <span className="text-xs text-gray-500 font-normal">optional</span>
          </label>
          <span className={`text-xs tabular-nums ${agentDescription.length > 180 ? 'text-amber-400' : 'text-gray-500'}`}>
            {agentDescription.length} / 200
          </span>
        </div>
        <textarea
          value={agentDescription}
          onChange={e => onDescriptionChange(e.target.value.slice(0, 200))}
          placeholder="Describe what this agent does and who it's for..."
          rows={3}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-base text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
        />
      </div>

      {/* Test dialog */}
      <div className="pt-2">
        <PreviewDialog
          agentConfig={agentConfig}
          agentName={agentName}
          trigger={
            <Button variant="secondary" type="button" className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Test your agent
            </Button>
          }
        />
      </div>
    </div>
  )
}

// ── Agent Preview Panel ───────────────────────────────────────────────────────

const TONE_LABEL = (v: number) => v < 30 ? 'formal' : v < 70 ? 'balanced' : 'casual'
const VERBOSITY_LABEL = (v: number) => v < 30 ? 'concise' : v < 70 ? 'moderate' : 'detailed'

interface AgentPreviewPanelProps {
  agentConfig:  AgentConfig
  agentName:    string
  typeSelected: boolean
}

function AgentPreviewPanel({ agentConfig, agentName, typeSelected }: AgentPreviewPanelProps) {
  const displayName        = agentName.trim() || 'Unnamed agent'
  const selectedType       = typeSelected ? AGENT_TYPES.find(t => t.value === agentConfig.type) : null
  const enabledCapabilities = [
    ...CAPABILITIES.filter(({ key }) => agentConfig.capabilities[key]),
    ...(agentConfig.capabilities.documents?.enabled ? [{ key: 'documents' as const, label: 'Documents' }] : []),
  ]

  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="sticky top-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">Live preview</p>

        {/* Name */}
        <p className={`text-base font-semibold mb-3 truncate ${agentName.trim() ? 'text-white' : 'text-gray-600 italic'}`}>
          {displayName}
        </p>

        {/* Type */}
        {selectedType && (
          <div className="mb-3">
            <Badge variant="secondary" className="gap-1.5">
              <span>{selectedType.emoji}</span>
              <span>{selectedType.name}</span>
            </Badge>
          </div>
        )}

        {/* Personality */}
        <p className="text-xs text-gray-500 mb-4">
          Tone: <span className="text-gray-300">{TONE_LABEL(agentConfig.personality.tone)}</span>
          {' · '}
          Style: <span className="text-gray-300">{VERBOSITY_LABEL(agentConfig.personality.verbosity)}</span>
        </p>

        {/* Capabilities */}
        {enabledCapabilities.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-500 mb-2">Capabilities</p>
            <div className="flex flex-wrap gap-1.5">
              {enabledCapabilities.map(({ key, label }) => (
                <Badge key={key} className="bg-violet-600/15 text-violet-300 border border-violet-700/40 text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Preview button */}
        <div className={enabledCapabilities.length > 0 ? 'border-t border-gray-800 pt-4' : ''}>
          <PreviewDialog
            agentConfig={agentConfig}
            agentName={agentName}
            trigger={
              <Button variant="secondary" type="button" className="w-full gap-2 text-sm">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Preview conversation
              </Button>
            }
          />
        </div>
      </div>
    </aside>
  )
}
