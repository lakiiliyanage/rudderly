'use client'

import { useState, useRef } from 'react'
import ConversationSidebar, { type ConversationSidebarHandle } from '@/components/ConversationSidebar'
import ChatPanel from './ChatPanel'

export default function AgentChatLayout({
  agentId,
  agentName,
}: {
  agentId:   string
  agentName: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<ConversationSidebarHandle>(null)

  return (
    <div className="flex gap-4 items-start">
      <ConversationSidebar
        ref={sidebarRef}
        agentId={agentId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0">
        <ChatPanel
          agentId={agentId}
          agentName={agentName}
          onMenuOpen={() => setSidebarOpen(true)}
          onConversationCreated={conv =>
            sidebarRef.current?.addConversation({ ...conv, title: null })
          }
          onTitleGenerated={(id, title) =>
            sidebarRef.current?.updateTitle(id, title)
          }
        />
      </div>
    </div>
  )
}
