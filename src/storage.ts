/** What the practice drills remember between visits, in this browser only. */
export interface PracticeMemory {
  /** Drills to play guided, as chosen in the Practice sheet. */
  guided?: Record<string, boolean>
  /** Drills whose steps have been explained once already. */
  seen?: Record<string, boolean>
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
