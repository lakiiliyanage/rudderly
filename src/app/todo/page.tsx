"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Task {
  id: number
  text: string
  completed: boolean
}

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [input, setInput] = useState("")
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  const isDuplicate = () =>
    tasks.some(task => task.text.toLowerCase() === input.trim().toLowerCase())

  const commitTask = () => {
    setTasks([...tasks, { id: Date.now(), text: input.trim(), completed: false }])
    setInput("")
    setDuplicateWarning(false)
  }

  const addTask = () => {
    if (input.trim() === "") return
    if (isDuplicate()) {
      setDuplicateWarning(true)
      return
    }
    commitTask()
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed))
  }

  const remaining = tasks.filter(task => !task.completed).length
  const completedCount = tasks.length - remaining
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)

  return (
    // min-h-screen   — makes the page at least as tall as the viewport
    // bg-gray-950    — near-black background, one step darker than gray-900
    // text-white     — default text colour for everything inside
    // flex flex-col  — stack children vertically (column direction)
    // items-center   — centre children horizontally
    // py-16 px-4     — 64px top/bottom padding, 16px left/right padding
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-16 px-4">

      {/* ── Card container ── */}
      {/* w-full max-w-lg  — full width but capped at 512px */}
      {/* bg-gray-900      — slightly lighter than the page background */}
      {/* rounded-2xl      — larger corner radius than rounded-lg, feels modern */}
      {/* border           — adds a 1px border */}
      {/* border-gray-800  — very subtle dark border, just enough to define the edge */}
      {/* shadow-2xl       — large drop shadow, lifts the card off the page */}
      {/* overflow-hidden  — clips children to the card's rounded corners */}
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        {/* p-6           — 24px padding all sides */}
        {/* border-b      — bottom border only (divider line) */}
        {/* border-gray-800 — same subtle dark tone */}
        <div className="p-6 border-b border-gray-800">

          {/* flex justify-between items-start — puts title on left, count badge on right */}
          <div className="flex justify-between items-start mb-4">
            <div>
              {/* text-2xl font-bold — large, heavy headline */}
              <h1 className="text-2xl font-bold text-white">Task List</h1>
              {/* text-sm text-gray-400 mt-1 — small, muted subtitle below */}
              <p className="text-sm text-gray-400 mt-1">
                {tasks.length === 0
                  ? "Add your first task below"
                  : `${remaining} task${remaining !== 1 ? "s" : ""} remaining`}
              </p>
            </div>

            {/* Badge showing completed count */}
            {/* bg-violet-600/20  — violet background at 20% opacity (the /20 is the opacity modifier) */}
            {/* text-violet-400   — violet text to match */}
            {/* text-xs           — extra small text */}
            {/* font-medium       — medium weight, not full bold */}
            {/* px-3 py-1         — tight horizontal padding, minimal vertical */}
            {/* rounded-full      — pill shape */}
            {tasks.length > 0 && (
              <span className="bg-violet-600/20 text-violet-400 text-xs font-medium px-3 py-1 rounded-full">
                {completedCount}/{tasks.length} done
              </span>
            )}
          </div>

          {/* ── Progress bar ── */}
          {tasks.length > 0 && (
            // w-full h-1.5   — full width, 6px tall
            // bg-gray-800    — dark track (the empty part of the bar)
            // rounded-full   — pill-shaped track
            <div className="w-full h-1.5 bg-gray-800 rounded-full">
              {/* h-full         — fills the track height */}
              {/* bg-violet-500  — the filled portion colour */}
              {/* rounded-full   — pill ends on the fill */}
              {/* transition-all duration-300 — smoothly animates when % changes */}
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        {/* p-6 — 24px padding, matches header */}
        <div className="p-6">
          <div className="flex gap-2 mb-2">
            {/* flex-1          — input takes all remaining space beside the button */}
            {/* bg-gray-800     — slightly lighter than card background */}
            {/* border          — 1px border */}
            {/* border-gray-700 — visible but not harsh */}
            {/* rounded-xl      — softer than rounded-lg, matches the card's feel */}
            {/* px-4 py-3       — comfortable text input padding */}
            {/* focus:outline-none focus:ring-2 focus:ring-violet-500 — removes default outline, adds violet glow on focus */}
            {/* transition-colors — smooth colour change when focused */}
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setDuplicateWarning(false)
              }}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a new task..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
            />
            {/* bg-violet-600 hover:bg-violet-500 — purple button, gets lighter on hover */}
            {/* active:scale-95 — slightly shrinks when clicked (tactile feedback) */}
            {/* transition-all  — animates colour AND scale */}
            {/* font-semibold   — slightly less than bold, cleaner on buttons */}
            <Button
              onClick={addTask}
              className="bg-violet-600 hover:bg-violet-500 active:scale-95 font-semibold px-5 py-3"
            >
              Add
            </Button>
          </div>

          {/* ── Duplicate warning ── */}
          {duplicateWarning && (
            // bg-yellow-950/50  — very dark yellow, 50% opacity — subtle warning background
            // border-yellow-800 — warm amber border
            // animate-pulse is NOT used here — it would be annoying. Static is calmer.
            <div className="bg-yellow-950/50 border border-yellow-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 mt-2">
              <p className="text-yellow-400 text-sm">
                &ldquo;{input.trim()}&rdquo; already exists. Add it anyway?
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={commitTask}
                  className="h-auto bg-yellow-600 hover:bg-yellow-500 px-3 py-1.5 text-xs font-medium"
                >
                  Add anyway
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDuplicateWarning(false)}
                  className="h-auto border-gray-600 bg-gray-700 text-white hover:bg-gray-600 hover:text-white px-3 py-1.5 text-xs font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {/* Only shows when there are no tasks yet */}
          {tasks.length === 0 && (
            // py-12 — generous vertical padding so it doesn't feel cramped
            // text-center — centre all text
            <div className="py-12 text-center">
              {/* text-5xl mb-3 — large emoji, small gap below */}
              <p className="text-5xl mb-3">✓</p>
              <p className="text-gray-500 text-sm">Nothing here yet. Add a task to get started.</p>
            </div>
          )}

          {/* ── Task list ── */}
          {/* flex flex-col gap-2 — stack task cards with 8px gaps */}
          <ul className="flex flex-col gap-2">
            {tasks.map(task => (
              // group        — lets child elements respond to hover on the parent li
              // hover:border-gray-700 — border gets slightly lighter when hovering the whole card
              // transition-all — animates border colour change
              <li
                key={task.id}
                className="group flex items-center gap-3 bg-gray-800 hover:bg-gray-750 border border-gray-700/50 hover:border-gray-600 rounded-xl px-4 py-3 transition-all"
              >
                {/* ── Custom checkbox ── */}
                {/* w-5 h-5         — 20×20px circle */}
                {/* rounded-full    — perfect circle */}
                {/* border-2        — visible ring */}
                {/* flex-shrink-0   — never squishes even if text is long */}
                {/* flex items-center justify-center — centres the checkmark inside */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    task.completed
                      ? "bg-violet-600 border-violet-600"       // filled when done
                      : "border-gray-600 hover:border-violet-400" // ring only when pending
                  }`}
                >
                  {/* Checkmark — only visible when completed */}
                  {task.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* ── Task text ── */}
                {/* flex-1       — takes all remaining space */}
                {/* text-sm      — slightly smaller than default, appropriate for list items */}
                {/* line-through — strikethrough on completed tasks */}
                <span className={`flex-1 text-sm transition-colors ${
                  task.completed ? "line-through text-gray-500" : "text-gray-100"
                }`}>
                  {task.text}
                </span>

                {/* ── Delete button ── */}
                {/* opacity-0 group-hover:opacity-100 — hidden until you hover the card (uses the "group" class on li) */}
                {/* hover:text-red-400                — goes red on its own hover */}
                {/* transition-all                    — smooth opacity + colour change */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 rounded"
                  aria-label="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          {/* ── Clear completed ── */}
          {/* Only shows when at least one task is done */}
          {completedCount > 0 && (
            // mt-4          — 16px gap above, separates from the list
            // w-full        — full width button
            // text-center   — centres the label
            // text-sm       — smaller, secondary action shouldn't compete with "Add"
            // text-gray-500 hover:text-red-400 — muted default, red on hover (destructive action signal)
            // py-2          — comfortable click target without being bulky
            <Button
              variant="destructive"
              onClick={clearCompleted}
              className="mt-4 w-full gap-2 border border-red-500/20 bg-red-500/10 text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear {completedCount} completed {completedCount === 1 ? "task" : "tasks"}
            </Button>
          )}
        </div>

      </div>
    </main>
  )
}
