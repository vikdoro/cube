<script setup lang="ts">
// A one-screen app: the board fills the screen, a drill takes over the title, and everything that explains or
// chooses slides up from the bottom as a sheet.
import { attachKeyboard, CubeBoard, type KeyAction } from 'flatcube/vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { board } from './board'
import { usePlayer } from './composables/usePlayer'
import { useSheets } from './composables/useSheets'
import DrillDoneSheet from './components/DrillDoneSheet.vue'
import DrillIntroSheet from './components/DrillIntroSheet.vue'
import HintButton from './components/HintButton.vue'
import MoveBadge from './components/MoveBadge.vue'
import PracticeSheet from './components/PracticeSheet.vue'
import StartOverSheet from './components/StartOverSheet.vue'
import TopBar from './components/TopBar.vue'
import UndoButton from './components/UndoButton.vue'

const { playerTurn, undo, hideUndo } = usePlayer()
const sheets = useSheets()
const debug = new URLSearchParams(location.search).has('debug')

function onAction(action: KeyAction) {
  if (action.type === 'turn') playerTurn(action.move)
  else if (action.type === 'undo') undo()
  else board.roll(action.towards)
}

let detach: (() => void) | undefined
onMounted(() => { detach = attachKeyboard({ getView: () => board.view.value, onAction, enabled: () => !sheets.current.value }) })
onBeforeUnmount(() => detach?.())
</script>

<template>
  <div class="app">
    <TopBar />
    <!-- the board sits in the middle, the move's name centred in the space above it and Undo in the space under it;
         a drill shows in the top bar and adds Hint beside Undo, so the board keeps its size -->
    <main class="stage">
      <MoveBadge />
      <CubeBoard :board="board" :debug="debug" @turn="playerTurn" @drag="hideUndo" />
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
