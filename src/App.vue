<script setup lang="ts">
// A one-screen app: the board fills the screen, a drill adds a slim bar under it, and everything that explains or
// chooses slides up from the bottom as a sheet.
import { onBeforeUnmount, onMounted } from 'vue'
import { FACES, type Face } from './cube/model'
import { usePlayer } from './composables/usePlayer'
import { useSheets } from './composables/useSheets'
import CubeBoard from './components/CubeBoard.vue'
import DrillBar from './components/DrillBar.vue'
import DrillDoneSheet from './components/DrillDoneSheet.vue'
import DrillIntroSheet from './components/DrillIntroSheet.vue'
import HelpSheet from './components/HelpSheet.vue'
import PracticeSheet from './components/PracticeSheet.vue'
import TopBar from './components/TopBar.vue'

const { playerTurn, undo } = usePlayer()
const sheets = useSheets()

// keyboard: U D R L F B turn (Shift for anticlockwise), ⌘Z / Ctrl+Z undoes
function onKeyDown(e: KeyboardEvent) {
  if (sheets.current.value) return
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    undo()
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const key = e.key.toUpperCase()
  if (FACES.includes(key as Face)) playerTurn({ layer: key as Face, amount: e.shiftKey ? 3 : 1 })
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="app">
    <TopBar />
    <main class="stage"><CubeBoard /></main>
    <DrillBar />
  </div>
  <HelpSheet />
  <PracticeSheet />
  <DrillIntroSheet />
  <DrillDoneSheet />
</template>

<style scoped>
.app { height: 100%; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; padding-inline: 16px; padding-block-end: calc(12px + env(safe-area-inset-bottom, 0px)); }
.stage { flex: 1; min-height: 0; position: relative; display: flex; align-items: center; justify-content: center; }
</style>
