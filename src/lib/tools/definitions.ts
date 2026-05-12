import type Anthropic from '@anthropic-ai/sdk'

// ─── Individual tool definitions ─────────────────────────────────────────────

export const webSearchTool: Anthropic.Tool = {
  name: 'web_search',
  description:
    'Search the internet for current information. Use this for facts, news, prices, weather, and anything that might have changed recently.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
}

export const calculatorTool: Anthropic.Tool = {
  name: 'calculator',
  description:
    'Evaluate a mathematical expression and return the result. Use this for any arithmetic, percentages, or unit conversions.',
  input_schema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate, e.g. "15% of 240"',
      },
    },
    required: ['expression'],
  },
}

export const dateTimeTool: Anthropic.Tool = {
  name: 'get_datetime',
  description:
    "Get the current date and time. Use this whenever the user asks about today's date, the current time, the day of the week, or anything time-sensitive.",
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
}

export const documentReaderTool: Anthropic.Tool = {
  name: 'document_reader',
  description:
    "Read the full text content of a specific document that this agent has been given access to. Use this when the user asks a question that could be answered by the agent's configured documents. Returns the document text which you should use to ground your answer.",
  input_schema: {
    type: 'object',
    properties: {
      fileId: {
        type: 'string',
        // Uses a fileId rather than a URL: the agent config stores Drive file
        // IDs, and the server validates the agent is permitted to access that
        // ID before the tool executes. A raw URL would bypass that check.
        description: 'The Google Drive file ID of the document to read',
      },
    },
    required: ['fileId'],
  },
}

export const wordCounterTool: Anthropic.Tool = {
  name: 'word_counter',
  description:
    'Count the number of words, characters, and sentences in a given piece of text.',
  input_schema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to analyse',
      },
    },
    required: ['text'],
  },
}

// ─── Capability → tool map ────────────────────────────────────────────────────
//
// Keys match AgentConfig.capabilities toggles. When a capability is enabled on
// an agent, the corresponding tool is injected into the API call at runtime.
//
// dateTimeTool is intentionally absent: knowing the current date is a basic
// orientation capability that every agent should have, so it is always included
// rather than gated behind a toggle.
//
// documentReaderTool uses a fileId parameter (not a URL) because the server
// validates the agent is authorised to read that specific Drive file before the
// tool executes. Storing a raw URL in the config would let a prompt-injected
// fileId bypass that server-side access check.
//
// Note: AgentConfig.capabilities currently defines webSearch, email, calendar,
// calculator. The 'documents' key below anticipates the documents capability
// that will be added in a future sprint.
export const AGENT_TOOLS: Record<string, Anthropic.Tool> = {
  webSearch:  webSearchTool,
  calculator: calculatorTool,
  documents:  documentReaderTool,
}
