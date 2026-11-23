import { drillDef, type DrillDef } from './drills'
import type { Drill } from './composables/usePractice'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export const drillTitle = (d: Drill, def = drillDef(d.kind)) => def.title

/** What the player has done once the drill's goal is reached. */
export const doneTitle = (d: Drill, def = drillDef(d.kind)) => `${def.doneName} in ${plural(d.moves, 'move')}`

/** The done sheet's text: how the turns went against par, then the hints. */
export function doneSummary(d: Drill, def: DrillDef = drillDef(d.kind)) {
  const par = fill(d.moves <= d.par ? def.onPar : def.overPar, d.par)
  return `${par} ${d.hints ? `You used ${plural(d.hints, 'hint')}.` : 'No hints.'}`
}

/** Copy with its placeholders filled in: {turns} as "12 turns", {par} as the bare number. */
export const fill = (text: string, par: number) => text.replaceAll('{turns}', plural(par, 'turn')).replaceAll('{par}', String(par))

/** Copy as text and bold parts, after filling it in: `**words**` are the bold ones. */
export const richText = (text: string, par: number) =>
  fill(text, par).split('**').map((part, i) => ({ text: part, bold: i % 2 === 1 })).filter(p => p.text)
