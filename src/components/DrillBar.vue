<script setup lang="ts">
// The practice bar: one slim row under the board while a drill runs, in thumb reach.
import { computed } from 'vue'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillTitle, plural } from '../text'

const { drill, retry, hint, nextPuzzle } = usePractice()
const sheets = useSheets()

const count = computed(() => {
  const d = drill.value!
  if (d.done) return `Solved in ${plural(d.moves, 'move')}`
  return plural(d.moves, 'move') + (d.hints ? ` · ${plural(d.hints, 'hint')}` : '')
})
</script>

<template>
  <section v-if="drill" class="bar" aria-label="Practice">
    <div class="title" aria-live="polite">
      <b>{{ drillTitle(drill) }}</b>
      <span class="count">{{ count }}</span>
    </div>
    <button class="btn" aria-haspopup="dialog" @click="sheets.openIntro(true)">Steps</button>
    <template v-if="!drill.done">
      <button class="btn icon" aria-label="Start over" title="Start over" @click="retry">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 3.5v4h4" /></svg>
      </button>
      <button class="btn primary" @click="hint">Hint</button>
    </template>
    <button v-else class="btn primary" @click="nextPuzzle">Next</button>
  </section>
</template>

<style scoped>
.bar { display: flex; align-items: center; gap: 6px; margin-block-start: 6px; padding: 8px 8px 8px 14px; background: var(--card); border-radius: 16px; }
.title { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
.title b { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
