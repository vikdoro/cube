<script setup lang="ts">
// A one-screen app: the board fills the screen, a drill takes over the title, and everything that explains or
// chooses slides up from the bottom as a sheet.
import { attachKeyboard, CubeBoard, type KeyAction } from 'flatcube/vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { board } from './board'
import { useGuide } from './composables/useGuide'
import { usePlayer } from './composables/usePlayer'
import { useSheets } from './composables/useSheets'
import BoardSpotlight from './components/BoardSpotlight.vue'
import DrillDoneSheet from './components/DrillDoneSheet.vue'
import DrillIntroSheet from './components/DrillIntroSheet.vue'
import GuidePanel from './components/GuidePanel.vue'
import HintButton from './components/HintButton.vue'
import MoveBadge from './components/MoveBadge.vue'
import PracticeSheet from './components/PracticeSheet.vue'
import StartOverSheet from './components/StartOverSheet.vue'
import TopBar from './components/TopBar.vue'
import UndoButton from './components/UndoButton.vue'

const { playerTurn, undo, hideUndo } = usePlayer()
const guide = useGuide()
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
    <!-- guided play: the panel takes the place of the rows over and under the board, which then fills the stage -->
    <template v-if="guide.active.value">
      <main class="stage guided">
        <!-- the board leaves room for those rows by itself; this box is that much taller than the stage -->
        <div class="fill">
          <div class="boardbox">
            <CubeBoard :board="board" :debug="debug" @turn="playerTurn" @drag="hideUndo" />
            <BoardSpotlight :board="board" :pieces="guide.finished.value ? [] : guide.segment.value?.pieces ?? []" :targets="guide.finished.value ? [] : guide.segment.value?.targets ?? []" :arrow="guide.arrow.value" />
          </div>
        </div>
      </main>
      <GuidePanel />
    </template>
    <!-- the board sits in the middle, the move's name centred in the space above it and Undo in the space under it;
         a drill shows in the top bar and adds Hint beside Undo, so the board keeps its size -->
    <main v-else class="stage">
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
.stage.guided { container-type: normal; position: relative; margin-block-end: 8px; }
.fill { position: absolute; inset: -64px 0; container-type: size; display: flex; flex-direction: column; justify-content: center; pointer-events: none; }
.boardbox { position: relative; display: flex; flex-direction: column; flex: none; }
.boardbox > :deep(svg:first-child) { pointer-events: auto; }
</style>
