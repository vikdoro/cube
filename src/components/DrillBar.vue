<script setup lang="ts">
// The practice bar: one slim row under the board while a drill runs, in thumb reach.
import { computed } from 'vue'
import { TOP_TURN, TWIST_ALG } from '../cube/drills'
import { boardMoveName } from '../cube/view'
import { useCube } from '../composables/useCube'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillTitle, plural } from '../text'

const { view } = useCube()
const { drill, twistStep, retry, hint, nextPuzzle } = usePractice()
const sheets = useSheets()

const count = computed(() => {
  const d = drill.value!
  if (d.done) return `Solved in ${plural(d.moves, 'move')}`
  return plural(d.moves, 'move') + (d.hints ? ` · ${plural(d.hints, 'hint')}` : '')
})
</script>

<template>
  <section v-if="drill" class="bar" aria-label="Practice">
    <div class="row">
      <div class="title" aria-live="polite">
        <b>{{ drill.kind === 'undo' ? drillTitle(drill) : 'Twist corners' }}</b>
        <span>{{ count }}</span>
      </div>
      <button class="btn" aria-haspopup="dialog" @click="sheets.openIntro(true)">Steps</button>
      <template v-if="!drill.done">
        <button class="btn icon" aria-label="Start over" title="Start over" @click="retry">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 3.5v4h4" /></svg>
        </button>
        <button class="btn primary" @click="hint">Hint</button>
      </template>
      <button v-else class="btn primary" @click="nextPuzzle">Next</button>
    </div>
    <!-- the twist routine, with the next move lit up -->
    <div v-if="twistStep !== null" class="chips alg">
      <span v-for="(move, i) in TWIST_ALG" :key="i" class="mv" :class="{ on: twistStep === i }">{{ boardMoveName(view, move) }}</span>
      <span class="note">repeat, then</span>
      <span class="mv" :class="{ on: twistStep === 4 }">{{ boardMoveName(view, TOP_TURN) }}</span>
    </div>
  </section>
</template>

<style scoped>
.bar { display: grid; gap: 8px; margin-block-start: 6px; padding: 8px 8px 8px 14px; background: var(--card); border-radius: 16px; }
.row { display: flex; align-items: center; gap: 6px; }
.title { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
.title b { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.title span { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
.alg { padding-inline-end: 6px; }
.note { color: var(--muted); font-size: 13px; margin-inline-end: 4px; }
</style>
