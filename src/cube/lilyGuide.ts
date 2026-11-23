import { applyMove, pieceSlots, SLOTS, type CubeState, type Face, type Move } from 'flatcube'
import { COLOUR, type Guide, type GuideSegment, type GuideSlide } from './guide'
import { isLily, PETAL_SLOTS, QUARTER_TURNS, WHITE_EDGES } from './lily'

/**
 * The white lily, guided. Each segment is one petal: the white edge that can come up in the fewest turns without any
 * petal already made leaving the yellow face, so the lily only ever grows. That can take a turn or two more than the
 * shortest way, which may move petals off and back; it is the way a person does it. Turns of the yellow face that
 * start a segment move the petals round to free the edge's place, and any turns of it count until it's free.
 */

const U = (amount: Move['amount'] = 1): Move => ({ layer: 'U', amount })

/** The white edge stickers' slots that are petals. */
const petalsOf = (state: CubeState) => PETAL_SLOTS.filter(slot => WHITE_EDGES.includes(state[slot])).map(slot => state[slot])
const isPetal = (state: CubeState, id: number) => SLOTS[state.indexOf(id)].face === 'U'

/** The fewest quarter turns that bring one more white edge up, keeping every petal already made. */
function route(state: CubeState): Move[] {
  const kept = petalsOf(state), wanted = kept.length + 1
  const search = (s: CubeState, depth: number, last: Face | null, acc: Move[]): Move[] | null => {
    if (petalsOf(s).length === wanted) return acc
    if (!depth) return null
    for (const move of QUARTER_TURNS) {
      if (move.layer === last) continue
      const next = applyMove(s, move)
      if (kept.some(id => !isPetal(next, id))) continue
      const found = search(next, depth - 1, move.layer as Face, [...acc, move])
      if (found) return found
    }
    return null
  }
  for (let depth = 1; ; depth++) {
    const found = search(state, depth, null, [])
    if (found) return found
  }
}

const same = (a: CubeState, b: CubeState) => a.every((id, i) => id === b[i])

/** What a turn does for the edge `w` coming up, in plain words. */
function says(state: CubeState, move: Move, w: number): string {
  const after = applyMove(state, move), side = move.layer as Face, c = COLOUR[side]
  const at = SLOTS[state.indexOf(w)]
  const inLayer = pieceSlots(state.indexOf(w)).some(slot => SLOTS[slot].face === side)
  if (side === 'U') return inLayer ? 'Turn the yellow face to take the edge round.' : 'Turn the yellow face to move the petals out of the way.'
  if (side === 'D') return 'Turn the white face to take the edge round, under a free place.'
  if (isPetal(after, w)) return `Turn the ${c} side to bring the edge up. Its white now faces the same way as the yellow.`
  if (inLayer && at.face === 'U') return `Turn the ${c} side to take the edge down, the right way round to come back up.`
  if (inLayer) return `Turn the ${c} side to take the edge round, where it can come up.`
  return `Turn the ${c} side to make way for the edge.`
}

/** The next petal's story, or null once the lily is made. */
export function lilySegment(state: CubeState, explained: boolean): GuideSegment | null {
  if (isLily(state)) return null
  const moves = route(state), before = petalsOf(state)
  const end = moves.reduce(applyMove, state)
  const w = petalsOf(end).find(id => !before.includes(id))!
  const piece = pieceSlots(w)

  const slides: GuideSlide[] = explained
    ? [{ say: 'Next, this white edge. It comes up to the outlined place.', turns: [] }]
    : [
        { say: 'The lily is the four white edges round the yellow centre, their white facing the same way as the yellow. The corners don’t matter.', turns: [] },
        { say: 'This white edge comes up first, to the outlined place. Each petal stays once it’s made.', turns: [] },
      ]
  // turns of the yellow face first: they free the edge's place, either way round
  let s = state, k = 0
  while (k < moves.length && moves[k].layer === 'U' && !isPetal(applyMove(s, moves[k]), w)) s = applyMove(s, moves[k++])
  if (k) {
    const freed = s
    slides.push({
      say: before.length ? 'Turn the yellow face to move the petals round. That frees the place this edge comes up to.' : 'Turn the yellow face to move the edge round.',
      turns: moves.slice(0, k),
      free: { layer: 'U', goal: st => same(st, freed), next: st => same(applyMove(st, U(3)), freed) ? U(3) : U() },
    })
  }
  for (const move of moves.slice(k)) {
    slides.push({ say: says(s, move, w), turns: [move] })
    s = applyMove(s, move)
  }
  return { slides, pieces: piece, targets: piece.map(id => end.indexOf(id)) }
}

export const lilyGuide: Guide = {
  segment: lilySegment,
  // nothing comes before the lily, so every turn can be carried on from
  intact: () => true,
  broken: '',
  stray: 'Not that one. Turn it back the way the arrows show.',
  done: 'The lily is made. 🎉',
}
