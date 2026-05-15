'use client'

import { useState } from 'react'
import ConversationSidebar from '@/components/ConversationSidebar'
import ChatPanel from './ChatPanel'

export default function AgentChatLayout({
  agentId,
  agentName,
}: {
  agentId:   string
  agentName: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex gap-4 items-start">
      <ConversationSidebar
        agentId={agentId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0">
        <ChatPanel
          agentId={agentId}
          agentName={agentName}
          onMenuOpen={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  )
}
