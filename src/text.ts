import type { Drill } from './composables/usePractice'
import { stage } from './cube/stages'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export const drillTitle = (d: Drill) => d.kind === 'undo' ? `Undo ${plural(d.level, 'move')}` : stage(d.stage!).title
