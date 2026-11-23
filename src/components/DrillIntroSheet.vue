<script setup lang="ts">
// How the drill works: shown before its first puzzle, and later from "Steps".
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillDef } from '../drills'
import { drillTitle, richText } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, nextPuzzle, retry, resetToSolved } = usePractice()

function startOver() {
  retry()
  sheets.close()
}
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'intro'" :title="drill ? drillTitle(drill) : ''" @close="sheets.close">
    <template v-if="drill">
      <ol class="steps">
        <li v-for="step in drillDef(drill.kind).steps" :key="step">
          <span><template v-for="(part, i) in richText(step, drill.par)" :key="i"><b v-if="part.bold">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></span>
        </li>
      </ol>
      <div class="actions">
        <button class="btn primary big" autofocus @click="sheets.close">{{ sheets.introMidway.value ? 'Continue' : 'Start' }}</button>
        <template v-if="sheets.introMidway.value">
          <div class="split">
            <button class="btn" :disabled="drill.done" @click="startOver">Start over</button>
            <button class="btn" @click="nextPuzzle">New puzzle</button>
          </div>
          <button class="btn plain" @click="resetToSolved">Stop practising</button>
        </template>
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
