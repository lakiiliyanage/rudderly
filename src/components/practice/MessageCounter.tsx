"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button" 

export default function MessageCounter() {
  const [count, setCount] = useState(10)

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-72 flex flex-col items-center gap-4">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Messages Sent</p>
      <span className="text-white text-5xl font-bold">{count}</span>
      <Button
        onClick={() => setCount(count + 1)}
        className="bg-violet-600 hover:bg-violet-500 px-5 py-2 text-sm font-medium"
      >
        Send Message
      </Button>
    </div>
  )
}
