// Full row shape returned by Supabase for the agents table.
// Use this type when fetching agents server-side or in API routes.
export interface Agent {
  id:          string
  user_id:     string
  name:        string
  description: string
  config:      AgentConfig
  is_public:   boolean
  created_at:  string
  updated_at:  string
}

export interface AgentConfig {
  // Which broad category this agent falls into. 'custom' is the escape hatch
  // for anything that doesn't fit the three named types.
  type: 'customer-support' | 'research' | 'personal-assistant' | 'custom'

  personality: {
    // 0 = very formal ("Dear Sir/Madam"), 100 = very casual ("Hey!")
    tone: number

    // 0 = very concise (one-liners), 100 = very detailed (full explanations)
    verbosity: number

    // Seed phrases that prime the model toward a particular voice or style.
    // e.g. ["Let me check that for you", "Great question!"]
    examplePhrases: string[]
  }

  capabilities: {
    webSearch:   boolean
    email:       boolean
    calendar:    boolean
    calculator:  boolean
    wordCounter: boolean
    documents: {
      enabled: boolean
      files: Array<{ id: string; name: string }>
    }
  }

  limits: {
    // Hard cap on incoming user messages (in characters) before the API
    // rejects the request. Mirrors the 4 000-char guard in ChatPanel.
    maxMessageLength: number

    // Topics the agent should refuse or redirect. Stored as plain strings
    // and injected into the system prompt at runtime.
    // e.g. ["competitor pricing", "legal advice"]
    avoidTopics: string[]
  }
}
