import type { Stage, StageId } from '../method'
import { positionCorners } from './positionCorners'
import { twistCorners } from './twistCorners'

/** The stages built so far, by id. */
export const STAGES: Partial<Record<StageId, Stage>> = {
  6: positionCorners,
  7: twistCorners,
}

export const stage = (id: StageId): Stage => {
  const s = STAGES[id]
  if (!s) throw new Error(`stage ${id} is not built yet`)
  return s
}
