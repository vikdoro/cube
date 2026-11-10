<script setup lang="ts">
// A one-screen app: the board fills the screen, a drill takes over the title, and everything that explains or
// chooses slides up from the bottom as a sheet.
import { onBeforeUnmount, onMounted } from 'vue'
import { type Face } from './cube/model'
import { boardMove } from './cube/view'
import type { Vec3 } from './cube/vec'
import { useCube } from './composables/useCube'
import { usePlayer } from './composables/usePlayer'
import { useSheets } from './composables/useSheets'
import CubeBoard from './components/CubeBoard.vue'
import DrillDoneSheet from './components/DrillDoneSheet.vue'
import DrillIntroSheet from './components/DrillIntroSheet.vue'
import HintButton from './components/HintButton.vue'
import MoveBadge from './components/MoveBadge.vue'
import PracticeSheet from './components/PracticeSheet.vue'
import StartOverSheet from './components/StartOverSheet.vue'
import TopBar from './components/TopBar.vue'
import UndoButton from './components/UndoButton.vue'

const { view, roll } = useCube()
const { playerTurn, undo } = usePlayer()
const sheets = useSheets()

// keyboard: the keys around S are laid out like the board, S the middle (D), W the far side (B), X the near side (F),
// A and D the sides (L, R) and Q the lid (U); Shift turns the other way. Z or ⌘Z / Ctrl+Z undoes. Keys go by where
// they sit on the keyboard, so the layout holds on AZERTY or Dvorak too. The arrow keys roll the side that way to the
// middle and Space brings up the lid, as tapping them does
const KEY_FACE: Record<string, Face> = { KeyS: 'D', KeyW: 'B', KeyX: 'F', KeyA: 'L', KeyD: 'R', KeyQ: 'U' }
const KEY_ROLL: Record<string, Vec3> = { ArrowUp: [0, 0, -1], ArrowDown: [0, 0, 1], ArrowLeft: [-1, 0, 0], ArrowRight: [1, 0, 0], Space: [0, -1, 0] }

function onKeyDown(e: KeyboardEvent) {
  if (sheets.current.value) return
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    undo()
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.code === 'KeyZ') return undo()
  const face = KEY_FACE[e.code], towards = KEY_ROLL[e.code]
  if (face) playerTurn(boardMove(view.value, face, e.shiftKey ? 3 : 1))
  if (towards) {
    e.preventDefault() // no scrolling, and Space doesn't press a focused button
    roll(towards)
  }
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="app">
    <TopBar />
    <!-- the board sits in the middle, the move's name centred in the space above it and Undo in the space under it;
         a drill shows in the top bar and adds Hint beside Undo, so the board keeps its size -->
    <main class="stage">
      <MoveBadge />
      <CubeBoard />
      <UndoButton><HintButton /></UndoButton>
    </main>
  </div>
  <PracticeSheet />
  <DrillIntroSheet />
  <DrillDoneSheet />
  <StartOverSheet />
</template>

<style scoped>
.app { height: 100%; touch-action: none; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; padding-inline: 16px; padding-block-end: calc(12px + env(safe-area-inset-bottom, 0px)); }
.stage { flex: 1; min-height: 0; display: flex; flex-direction: column; container-type: size; }
</style>
