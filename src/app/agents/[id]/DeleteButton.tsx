'use client'

import { deleteAgent } from './actions'
import { Button } from '@/components/ui/button'

export default function DeleteButton({ agentId }: { agentId: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('Delete this agent? This cannot be undone.')) {
      e.preventDefault()
    }
  }

  return (
    <form action={deleteAgent} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={agentId} />
      <Button
        type="submit"
        variant="destructive"
        className="gap-1.5 border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-950/70 hover:text-red-300 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        Delete
      </Button>
    </form>
  )
}
