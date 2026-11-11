import { supabase } from './supabase.js'

const TASK_COLUMNS = 'id, title, priority, course_id, created_at, courses(name)'

export async function fetchUserTasks(userId) {
  return supabase
    .from('tasks')
    .select('id, title, priority, course_id, created_at, courses!inner(name, user_id)')
    .eq('courses.user_id', userId)
    .order('created_at', { ascending: false })
}

export async function createUserTask({ title, courseId, priority }) {
  return supabase
    .from('tasks')
    .insert({
      title,
      course_id: courseId,
      priority,
    })
    .select(TASK_COLUMNS)
    .single()
}
