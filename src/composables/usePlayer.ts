import { shallowRef } from 'vue'
import { LETTER_MS, UNDO_MS } from '../board/motion'
import { inverse, type Move } from '../cube/model'
import { useCube } from './useCube'
import { usePractice } from './usePractice'

/**
 * The player's own turns, and undoing them. After each turn lands, its letter shows a moment longer, then Undo takes
 * its place for a few seconds. Each tap turns the last one back, and Undo comes back after that for the one before.
 */
const cube = useCube()
const practice = usePractice()

/** The player's turns that can still be undone, newest last. */
const undoable: Move[] = []
const undoOffered = shallowRef(false)
let timers: ReturnType<typeof setTimeout>[] = []

function hideUndo() {
  timers.forEach(clearTimeout)
  timers = []
  undoOffered.value = false
}

function offerUndo() {
  hideUndo()
  if (!undoable.length || practice.drill.value?.done || cube.hasQueuedTurns()) return
  timers = [setTimeout(() => { undoOffered.value = true }, LETTER_MS), setTimeout(hideUndo, LETTER_MS + UNDO_MS)]
}

function playerTurn(move: Move, undoing = false) {
  hideUndo()
  if (!undoing) undoable.push(move)
  practice.recordTurn(move)
  cube.turn(move, true)
}

function undo() {
  if (cube.busy.value || !undoable.length || practice.drill.value?.done) return
  playerTurn(inverse(undoable.pop()!), true)
}

cube.onTurnLanded((_, byPlayer) => { if (byPlayer) offerUndo() })
cube.onReset(() => { undoable.length = 0; hideUndo() })

export function usePlayer() {
  return { undoOffered, playerTurn, undo, hideUndo }
}
