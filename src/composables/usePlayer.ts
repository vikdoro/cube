import { shallowRef } from 'vue'
import { inverse, sameMove, type Move } from 'flatcube'
import { UNDO_MS } from 'flatcube/board'
import { board as cube } from '../board'
import { usePractice } from './usePractice'

/**
 * The player's own turns, and undoing them. Undo shows under the board the moment a turn is made, for two seconds. Each tap
 * turns the last one back, and Undo shows again for the one before.
 */
const practice = usePractice()

/** The player's turns that can still be undone, newest last. */
const undoable: Move[] = []
const undoOffered = shallowRef(false)
/** How many turns the player has made since the cube was last reset, undoing included. */
const turnsMade = shallowRef(0)
let timers: ReturnType<typeof setTimeout>[] = []

function hideUndo() {
  timers.forEach(clearTimeout)
  timers = []
  undoOffered.value = false
}

function offerUndo() {
  hideUndo()
  if (!undoable.length || practice.drill.value?.done) return
  undoOffered.value = true
  timers = [setTimeout(hideUndo, UNDO_MS)]
}

function playerTurn(move: Move, undoing = false) {
  hideUndo()
  if (!undoing) undoable.push(move)
  turnsMade.value++
  practice.recordTurn(move)
  cube.turn(move, true)
  offerUndo()
}

function undo() {
  if (!undoable.length || practice.drill.value?.done) return // a tap while the turn plays queues behind it
  playerTurn(inverse(undoable.pop()!), true)
}

/** Turn a turn back for the guided story: as Undo does when it's the last turn made, else as a turn of its own. */
function turnBack(move: Move) {
  const last = undoable[undoable.length - 1]
  if (last && sameMove(last, move)) undoable.pop()
  playerTurn(inverse(move), true)
}

cube.onReset(() => { undoable.length = 0; turnsMade.value = 0; hideUndo() })

export function usePlayer() {
  return { undoOffered, turnsMade, playerTurn, undo, hideUndo, turnBack }
}
