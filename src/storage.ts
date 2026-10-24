import type { DrillKind } from './cube/drills'

/** What the practice drills remember between visits, in this browser only. */
export interface PracticeMemory {
  /** The last "undo" level played. */
  level?: number
  /** Drills whose steps have been explained once already. */
  seen?: Partial<Record<DrillKind, boolean>>
}

const KEY = 'practice'

export function loadPractice(): PracticeMemory {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') || {}
  } catch {
    return {}
  }
}

export function savePractice(patch: PracticeMemory) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadPractice(), ...patch }))
  } catch {
    // storage can be blocked (private mode, disabled site data); the app works without it
  }
}
