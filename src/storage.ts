import type { DrillKind } from './cube/drills'
import type { StageId } from './cube/method'

/** What the practice drills remember between visits, in this browser only. */
export interface PracticeMemory {
  /** The last "undo" level played. */
  level?: number
  /** Drills whose steps have been explained once already. */
  seen?: Partial<Record<DrillKind, boolean>>
}

/** Course progress: a mastery meter per stage, and when it was last practised. */
export interface CourseMemory {
  v: 1
  stages: Partial<Record<StageId, { bars: number; last: string }>>
}

const PRACTICE = 'practice', COURSE = 'course'

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage can be blocked (private mode, disabled site data); the app works without it
  }
}

export const loadPractice = (): PracticeMemory => (read(PRACTICE) as PracticeMemory | null) || {}

export const savePractice = (patch: PracticeMemory) => write(PRACTICE, { ...loadPractice(), ...patch })

export function loadCourse(): CourseMemory {
  const m = read(COURSE) as Partial<CourseMemory> | null
  return m && m.v === 1 && m.stages ? { v: 1, stages: m.stages } : { v: 1, stages: {} }
}

export const saveCourse = (memory: CourseMemory) => write(COURSE, memory)
