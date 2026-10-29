<script setup lang="ts">
// A one-screen app: the board fills the screen, a drill takes over the title, and everything that explains or
// chooses slides up from the bottom as a sheet.
import { onBeforeUnmount, onMounted } from 'vue'
import { FACES, type Face } from './cube/model'
import { boardMove } from './cube/view'
import { useCube } from './composables/useCube'
import { usePlayer } from './composables/usePlayer'
import { useSheets } from './composables/useSheets'
import CubeBoard from './components/CubeBoard.vue'
import DrillDoneSheet from './components/DrillDoneSheet.vue'
import DrillIntroSheet from './components/DrillIntroSheet.vue'
import HintButton from './components/HintButton.vue'
import MoveBadge from './components/MoveBadge.vue'
import PracticeSheet from './components/PracticeSheet.vue'
import TopBar from './components/TopBar.vue'
import UndoButton from './components/UndoButton.vue'

const { view } = useCube()
const { playerTurn, undo } = usePlayer()
const sheets = useSheets()

// keyboard: U D R L F B turn, by their names on the board (Shift for a prime), ⌘Z / Ctrl+Z undoes
function onKeyDown(e: KeyboardEvent) {
  if (sheets.current.value) return
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    undo()
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const key = e.key.toUpperCase()
  if (FACES.includes(key as Face)) playerTurn(boardMove(view.value, key as Face, e.shiftKey ? 3 : 1))
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
</template>

<style scoped>
.app { height: 100%; touch-action: none; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; padding-inline: 16px; padding-block-end: calc(12px + env(safe-area-inset-bottom, 0px)); }
.stage { flex: 1; min-height: 0; display: flex; flex-direction: column; container-type: size; }
</style>
