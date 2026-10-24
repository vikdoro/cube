import type { Drill } from './composables/usePractice'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export const drillTitle = (d: Drill) => d.kind === 'undo' ? `Undo ${plural(d.level, 'move')}` : 'Twist the last corners'
