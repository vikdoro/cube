import type { DrillKind } from './cube/drills'

/** What the practice drills remember between visits, in this browser only. */
export interface PracticeMemory {
  /** The last "undo" level played. */
  level?: number
  /** The last "lily" level played. */
  lilyLevel?: number
  /** The last "cross" level played. */
  crossLevel?: number
  /** The last "corners" level played. */
  cornersLevel?: number
  /** The last "middle" level played. */
  middleLevel?: number
  /** The last "yellow" level played. */
  yellowLevel?: number
  /** The last "edges" level played. */
  edgesLevel?: number
  /** Drills whose steps have been explained once already. */
  seen?: Partial<Record<DrillKind, boolean>>
}

const PRACTICE = 'practice'

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
