<script setup lang="ts">
// How the drill works: shown before its first puzzle, and later from "Steps".
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillTitle, plural } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, nextPuzzle, resetToSolved } = usePractice()
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'intro'" :title="drill ? drillTitle(drill) : ''" @close="sheets.close">
    <template v-if="drill">
      <ol class="steps">
        <li><span>The cube was turned <b>{{ plural(drill.level, 'time') }}</b> from solved. Turn it back.</span></li>
        <li><span>Each of your turns can cancel one of them, so {{ plural(drill.level, 'turn') }} is the shortest way. Taking more is fine.</span></li>
        <li><span>A wrong turn is just one more to undo. You can't get stuck.</span></li>
        <li><span>Stuck anyway? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <div class="actions">
        <button class="btn primary big" autofocus @click="sheets.close">{{ sheets.introMidway.value ? 'Continue' : 'Start' }}</button>
        <div v-if="sheets.introMidway.value" class="split">
          <button class="btn" @click="nextPuzzle">New puzzle</button>
          <button class="btn" @click="resetToSolved">Stop practising</button>
        </div>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
.steps { margin: 0; padding: 0; list-style: none; counter-reset: step; display: grid; gap: 12px; }
.steps li { counter-increment: step; display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: start; }
.steps li::before { content: counter(step); width: 28px; height: 28px; border-radius: 50%; background: var(--fill); color: var(--accent); display: grid; place-items: center; font: 700 14px var(--round); }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
