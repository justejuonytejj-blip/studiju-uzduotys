import { supabase } from './supabase.js'

const TASK_COLUMNS =
  'id, title, priority, course_id, created_at, is_completed, completed_at, due_date, courses(name)'

export async function fetchUserTasks(userId) {
  return supabase
    .from('tasks')
    .select(
      'id, title, priority, course_id, created_at, is_completed, completed_at, due_date, courses!inner(name, user_id)',
    )
    .eq('courses.user_id', userId)
    .order('created_at', { ascending: false })
}

export async function createUserTask({ title, courseId, priority, dueDate = null }) {
  return supabase
    .from('tasks')
    .insert({
      title,
      course_id: courseId,
      priority,
      due_date: dueDate,
    })
    .select(TASK_COLUMNS)
    .single()
}

function belongsToUserCourses(courseId, userCourseIds) {
  return Array.isArray(userCourseIds) && userCourseIds.includes(courseId)
}

export async function updateUserTask({
  taskId,
  title,
  courseId,
  priority,
  dueDate = null,
  currentCourseId,
  userCourseIds,
}) {
  if (!belongsToUserCourses(currentCourseId, userCourseIds)) {
    return { data: null, error: { message: 'Užduotis nepriklauso šiam vartotojui.' } }
  }

  if (!belongsToUserCourses(courseId, userCourseIds)) {
    return { data: null, error: { message: 'Pasirinktas dalykas nepriklauso šiam vartotojui.' } }
  }

  return supabase
    .from('tasks')
    .update({
      title,
      course_id: courseId,
      priority,
      due_date: dueDate,
    })
    .eq('id', taskId)
    .in('course_id', userCourseIds)
    .select(TASK_COLUMNS)
    .single()
}

export async function setTaskCompletion({
  taskId,
  currentCourseId,
  userCourseIds,
  isCompleted,
}) {
  if (!belongsToUserCourses(currentCourseId, userCourseIds)) {
    return { data: null, error: { message: 'Užduotis nepriklauso šiam vartotojui.' } }
  }

  return supabase
    .from('tasks')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .in('course_id', userCourseIds)
    .select(TASK_COLUMNS)
    .single()
}

export async function deleteUserTask({ taskId, currentCourseId, userCourseIds }) {
  if (!belongsToUserCourses(currentCourseId, userCourseIds)) {
    return { data: null, error: { message: 'Užduotis nepriklauso šiam vartotojui.' } }
  }

  return supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .in('course_id', userCourseIds)
    .select('id')
    .single()
}
