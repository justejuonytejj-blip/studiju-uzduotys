import { supabase } from './supabase.js'

export async function signUpWithEmail(email, password) {
  return supabase.auth.signUp({
    email,
    password,
  })
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export function getSignUpErrorMessage(error) {
  const message = error?.message?.toLowerCase() ?? ''

  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'Šis el. paštas jau užregistruotas.'
  }

  if (message.includes('invalid email') || message.includes('email address')) {
    return 'Įveskite tinkamą el. pašto adresą.'
  }

  if (message.includes('password') && message.includes('6')) {
    return 'Slaptažodis turi būti bent 6 simbolių.'
  }

  if (message.includes('rate') || message.includes('too many')) {
    return 'Per daug bandymų. Palaukite ir bandykite dar kartą.'
  }

  if (message.includes('signup is disabled')) {
    return 'Registracija šiuo metu išjungta.'
  }

  return 'Nepavyko užsiregistruoti. Bandykite dar kartą.'
}

export function getSignInErrorMessage(error) {
  const message = error?.message?.toLowerCase() ?? ''

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid email or password')
  ) {
    return 'El. paštas arba slaptažodis neteisingas.'
  }

  if (message.includes('email not confirmed')) {
    return 'El. paštas dar nepatvirtintas.'
  }

  if (message.includes('invalid email') || message.includes('email address')) {
    return 'Įveskite tinkamą el. pašto adresą.'
  }

  if (message.includes('rate') || message.includes('too many')) {
    return 'Per daug bandymų. Palaukite ir bandykite dar kartą.'
  }

  return 'Nepavyko prisijungti. Bandykite dar kartą.'
}
