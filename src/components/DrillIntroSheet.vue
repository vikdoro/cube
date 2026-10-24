<script setup lang="ts">
// How a drill works: shown before its first puzzle, and later from "Steps".
import { TWIST_ALG } from '../cube/drills'
import { moveName } from '../cube/model'
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
      <ol v-if="drill.kind === 'undo'" class="steps">
        <li><span>The cube was turned <b>{{ plural(drill.level, 'time') }}</b> from solved. Turn it back.</span></li>
        <li><span>Each of your turns can cancel one of them, so {{ plural(drill.level, 'turn') }} is the shortest way. Taking more is fine.</span></li>
        <li><span>A wrong turn is just one more to undo. You can't get stuck.</span></li>
        <li><span>Stuck anyway? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <!-- the twist drill always starts with the top face in the middle, so the cube's own move names apply -->
      <ol v-else class="steps">
        <li><span>Every piece is in place; only some top corners are twisted. Work on the <b>ringed corner</b>, front-right of the middle face.</span></li>
        <li><span>If yellow isn't facing up there, do <span class="seq"><span v-for="(move, i) in TWIST_ALG" :key="i" class="mv">{{ moveName(move) }}</span></span> and repeat it until it is, 2 or 4 times.</span></li>
        <li><span>Then turn only the top, <span class="mv">U</span>to bring the next twisted corner into the ring. Don't roll the cube.</span></li>
        <li><span>Half-way, the rest of the cube looks broken. Keep going: it comes back with the last corner.</span></li>
        <li><span>The moves sit under the board with the next one lit up. <b>Hint</b> draws it on the board.</span></li>
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
.seq { white-space: nowrap; }
.seq .mv:last-child { margin-inline-end: 0; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
