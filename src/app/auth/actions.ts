'use server'

import { createClient } from '@/lib/supabase/server'

export type AuthState =
  | { error: string }
  | { message: string }
  | { success: true }
  | undefined

export async function login(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please fill in your email and password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message.toLowerCase()
    // Supabase returns the same error for wrong password AND unknown email —
    // intentional: telling callers which emails exist is an enumeration risk.
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
      return { error: 'Incorrect email or password. Please try again.' }
    if (msg.includes('email not confirmed'))
      return { error: 'Please check your inbox and confirm your email before signing in.' }
    return { error: error.message }
  }

  return { success: true }
}

export async function signup(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please fill in your email and password.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('password should be at least'))
      return { error: 'Password must be at least 6 characters.' }
    return { error: error.message }
  }

  // When email confirmation is on, Supabase fakes success for duplicate emails
  // instead of saying "that address is registered" (enumeration protection).
  // The signal is data.user existing but data.user.identities being empty.
  if (data.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists. Try signing in instead.' }
  }

  // Email confirmation disabled — session created immediately.
  if (data.session) {
    return { success: true }
  }

  // Email confirmation required — tell the user to check their inbox.
  return { message: 'Account created! Check your email to confirm your address, then sign in.' }
}
