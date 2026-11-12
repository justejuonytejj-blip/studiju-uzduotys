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

export async function updateUserCourse(userId, courseId, name) {
  return supabase
    .from('courses')
    .update({ name })
    .eq('id', courseId)
    .eq('user_id', userId)
    .select(COURSE_COLUMNS)
    .single()
}

export async function countTasksForCourse(courseId) {
  return supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)
}

export async function deleteUserCourse(userId, courseId) {
  return supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
    .eq('user_id', userId)
    .select('id')
    .single()
}
