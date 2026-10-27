import { computed, shallowRef } from 'vue'
import { TEACHING_ORDER, type StageId } from '../cube/method'
import { loadCourse, saveCourse, type CourseMemory } from '../storage'

/**
 * The course: how well each stage is known, as a meter of 0–5 bars, and what to practise next.
 * A lesson is a few puzzles; a clean lesson adds a bar, a rough one takes one away. Support under the board follows
 * the meter (the scaffold), so a stage is practised with less and less help until it is solid. A solid stage left
 * alone for a while asks for a refresh, so nothing is assumed to be known for good.
 */
export const LESSON_SIZE = 5
export const SOLID = 5
export const REFRESH_DAYS = 4

/** How much help a lesson gives: arrows after every turn, the next move lit, the moves shown unlit, or nothing. */
export type Scaffold = 'follow' | 'lit' | 'dim' | 'none'
export type Status = 'New' | 'Learning' | 'Practising' | 'Solid' | 'Refresh'

const memory = shallowRef<CourseMemory>(loadCourse())

const bars = (id: StageId) => memory.value.stages[id]?.bars ?? 0

const stale = (id: StageId) => {
  const s = memory.value.stages[id]
  return !!s && s.bars >= SOLID && Date.now() - Date.parse(s.last) > REFRESH_DAYS * 86400e3
}

function status(id: StageId): Status {
  const b = bars(id)
  if (!b) return 'New'
  if (b < 3) return 'Learning'
  if (b < SOLID) return 'Practising'
  return stale(id) ? 'Refresh' : 'Solid'
}

function scaffold(id: StageId): Scaffold {
  const b = bars(id)
  return !b ? 'follow' : b < 3 ? 'lit' : b < SOLID ? 'dim' : 'none'
}

/** The stage being learnt: the first in teaching order that isn't solid yet (or the last one, when all are). */
const frontier = computed(() => TEACHING_ORDER.find(id => bars(id) < SOLID) ?? TEACHING_ORDER[TEACHING_ORDER.length - 1])

/** What to practise next: a solid stage that needs a refresh, else the frontier. */
const recommended = computed(() => TEACHING_ORDER.find(stale) ?? frontier.value)

/** Later in the teaching order than the frontier: fine to try, but easier once the frontier is solid. */
const ahead = (id: StageId) => TEACHING_ORDER.indexOf(id) > TEACHING_ORDER.indexOf(frontier.value)

/** A lesson is over: `clean` of its puzzles were solved without hints. The first lesson always lights the first bar. */
function recordLesson(id: StageId, clean: number): { before: number; after: number } {
  const before = bars(id)
  const after = !before ? 1
    : clean >= LESSON_SIZE - 1 ? Math.min(SOLID, before + 1)
    : clean <= LESSON_SIZE - 3 ? Math.max(1, before - 1)
    : before
  const m = memory.value
  memory.value = { ...m, stages: { ...m.stages, [id]: { bars: after, last: new Date().toISOString() } } }
  saveCourse(memory.value)
  return { before, after }
}

export function useCourse() {
  return { memory, bars, status, scaffold, frontier, recommended, ahead, recordLesson }
}
