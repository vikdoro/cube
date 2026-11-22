import { applyMove, pieceSlots, SLOTS, type CubeState, type Face, type Move } from 'flatcube'
import { isFirstLayer } from './corners'
import { COLOUR, type Guide, type GuideSegment, type GuideSlide } from './guide'
import { EDGES, edges, insert, isHome, isTwoLayers, onSide, onTop, plan, RIGHT } from './middle'

/**
 * The middle layer, guided. Each segment is one edge: lined up if it needs to be, then the two triggers that put it in.
 * The first trigger brings the top corner by the edge's home onto the yellow face next to the edge; the second, its
 * mirror with the other side, drops the two in together. An edge stuck in a wrong gap, or flipped in its own, is a
 * segment of its own: the same eight turns push it out onto the yellow face.
 */

const U = (amount: Move['amount'] = 1): Move => ({ layer: 'U', amount })

/** The corner of the white face between sides `x` and `y`, as its sticker ids. */
const cornerOf = (x: Face, y: Face) =>
  pieceSlots(SLOTS.find(s => { const faces = pieceSlots(s.index).map(i => SLOTS[i].face); return faces.length === 3 && [x, y, 'D'].every(f => faces.includes(f as Face)) })!.index)

const lined = (state: CubeState, i: number) => onTop(state, i) && onSide(state, i).at === onSide(state, i).colour

/** The yellow face's quarter turn that lines edge `i` up soonest. */
function lineUp(state: CubeState, i: number): Move {
  for (let n = 1; n <= 3; n++) {
    let s = state
    for (let k = 0; k < n; k++) s = applyMove(s, U())
    if (lined(s, i)) return n === 3 ? U(3) : U()
  }
  return U()
}

const one = (say: string, move: Move): GuideSlide => ({ say, turns: [move] })

/** The eight turns that put a lined-up edge in, from side `x` towards side `y`, one slide each, saying what they do. */
function putIn(x: Face, y: Face, explained: boolean): GuideSlide[] {
  const [a, b] = [COLOUR[x], COLOUR[y]], m = insert(x, y)
  return [
    ...explained ? [] : [
      { say: `First the top ${a} and ${b} corner joins the edge on the yellow face, so the two can go down together.`, turns: [] },
      { say: `That takes a trigger: the yellow face, the ${b} side, then both back.`, turns: [] },
    ],
    one('Turn the yellow face to move the edge out of the way.', m[0]),
    one(`Turn the ${b} side to bring the corner onto the yellow face.`, m[1]),
    one('Turn the yellow face back, and the edge comes back too.', m[2]),
    one(`Turn the ${b} side back. The corner stays on the yellow face, right next to the edge.`, m[3]),
    ...explained ? [] : [{ say: `The edge and the corner are now a pair. A second trigger, with the ${a} side, puts them down.`, turns: [] }],
    one('Turn the yellow face the other way to move the pair round.', m[4]),
    one(`Turn the ${a} side to lift the gap up to the yellow face.`, m[5]),
    one('Turn the yellow face back, and the pair lands right over the gap.', m[6]),
    one(`Turn the ${a} side down, and both drop home together.`, m[7]),
  ]
}

/** The next edge's story from a done white face with no eight turns begun, or null once the middle layer is done. */
export function middleSegment(state: CubeState, explained: boolean): GuideSegment | null {
  if (isTwoLayers(state) || !isFirstLayer(state)) return null
  // follow the routine's yellow turns to the edge it lines up, or to an edge stuck in the middle row
  let s = state, moves = plan(s)!
  const ups: Move[] = []
  while (moves.length === 1) { ups.push(moves[0]); s = applyMove(s, moves[0]); moves = plan(s)! }
  const i = edges.find(j => lined(s, j))

  if (i === undefined) {
    const stuck = edges.find(j => !isHome(s, j) && !onTop(s, j))!
    const at = SLOTS[s.indexOf(EDGES[stuck][0])].face, other = SLOTS[s.indexOf(EDGES[stuck][1])].face
    const x = RIGHT[at] === other ? at : other, y = RIGHT[x]
    const own = EDGES[stuck].every(id => [at, other].includes(SLOTS[id].face))
    const where = own ? 'is in its own gap but flipped' : 'is stuck in the wrong gap'
    const m = insert(x, y), [a, b] = [COLOUR[x], COLOUR[y]]
    return {
      slides: [
        { say: `This edge ${where}. The same two triggers push it out onto the yellow face.`, turns: [] },
        one('Turn the yellow face.', m[0]), one(`Turn the ${b} side.`, m[1]), one('Turn the yellow face back.', m[2]), one(`Turn the ${b} side back.`, m[3]),
        one('Turn the yellow face the other way.', m[4]), one(`Turn the ${a} side.`, m[5]), one('Turn the yellow face back.', m[6]), one(`Turn the ${a} side back.`, m[7]),
      ],
      pieces: EDGES[stuck], targets: [],
    }
  }

  const { colour: x, other: y } = onSide(s, i), [a, b] = [COLOUR[x], COLOUR[y]]
  const intro = explained ? `Next, the ${a} and ${b} edge. Its home is between those sides.` : `This edge’s home is between the ${a} and ${b} sides, outlined on the board.`
  const slides: GuideSlide[] = [{ say: ups.length ? intro : `${intro} It’s lined up already.`, turns: [] }]
  if (ups.length) {
    slides.push({
      say: `Turn the yellow face until the edge’s ${a} sticker sits on the ${a} side.`, turns: ups,
      free: { layer: 'U', goal: st => lined(st, i), next: st => lineUp(st, i) },
    })
  }
  slides.push(...putIn(x, y, explained))
  return { slides, pieces: [...EDGES[i], ...cornerOf(x, y)], targets: EDGES[i] }
}

export const middleGuide: Guide = {
  segment: middleSegment,
  intact: isFirstLayer,
  broken: 'That turn moved the white face. Turn it back the way the arrows show.',
  stray: 'Not that one. Turn it back the way the arrows show.',
  done: 'Both layers are done. 🎉',
}
