import { supabase } from './supabase.js'

const COURSE_COLUMNS = 'id, name, user_id, created_at'

export async function fetchUserCourses(userId) {
  return supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
}

export async function createUserCourse(userId, name) {
  return supabase
    .from('courses')
    .insert({
      name,
      user_id: userId,
    })
    .select(COURSE_COLUMNS)
    .single()
}
