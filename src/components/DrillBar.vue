<script setup lang="ts">
// The practice bar: one slim row under the board while a drill runs, in thumb reach, and the routine being followed.
import { computed } from 'vue'
import { boardMoveName } from '../cube/view'
import { LESSON_SIZE } from '../composables/useCourse'
import { useCube } from '../composables/useCube'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillTitle, plural } from '../text'

const { view } = useCube()
const { drill, routineView, retry, hint, nextPuzzle } = usePractice()
const sheets = useSheets()

const title = computed(() => {
  const d = drill.value!
  return d.kind === 'undo' ? drillTitle(d) : routineView.value?.stageTitle ?? drillTitle(d)
})

const count = computed(() => {
  const d = drill.value!
  if (d.done) return `Solved in ${plural(d.moves, 'move')}`
  return plural(d.moves, 'move') + (d.hints ? ` · ${plural(d.hints, 'hint')}` : '')
})

/** Puzzles of the lesson done so far (the one being solved counts once solved). */
const dots = computed(() => {
  const d = drill.value!
  return d.lesson ? d.lesson.index + (d.done ? 1 : 0) : null
})

const lessonOver = computed(() => {
  const d = drill.value!
  return d.done && !!d.lesson && d.lesson.index + 1 >= LESSON_SIZE
})

// where each chunk's moves start in the algorithm, for lighting one move across chunks
const chunkOffsets = computed(() => {
  const out: number[] = []
  let n = 0
  for (const chunk of routineView.value?.chunks ?? []) { out.push(n); n += chunk.moves.length }
  return out
})

const isLit = (part: 'pre' | 'alg' | 'post', index: number) => {
  const lit = routineView.value?.lit
  return !!lit && lit.part === part && lit.index === index
}
</script>

<template>
  <section v-if="drill" class="bar" aria-label="Practice">
    <div class="row">
      <div class="title" aria-live="polite">
        <b>{{ title }}</b>
        <span class="count">
          <span v-if="dots !== null" class="dots" :aria-label="`${dots} of ${LESSON_SIZE} puzzles`">
            <span v-for="i in LESSON_SIZE" :key="i" class="dot" :class="{ on: i <= dots }" />
          </span>
          {{ count }}
        </span>
      </div>
      <button class="btn" aria-haspopup="dialog" @click="sheets.openIntro(true)">Steps</button>
      <template v-if="!drill.done">
        <button class="btn icon" aria-label="Start over" title="Start over" @click="retry">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 3.5v4h4" /></svg>
        </button>
        <button class="btn primary" @click="hint">Hint</button>
      </template>
      <button v-else-if="lessonOver" class="btn primary" @click="sheets.open('done')">Summary</button>
      <button v-else class="btn primary" @click="nextPuzzle">Next</button>
    </div>
    <!-- the routine: setup turns, the stage's moves in chunks, setup turned back; the next move lit up -->
    <div v-if="routineView" class="routine">
      <div class="label">{{ routineView.label }}</div>
      <div class="chips">
        <template v-if="routineView.offTrack">
          <span class="mv on">{{ boardMoveName(view, routineView.offTrack) }}</span>
        </template>
        <template v-else>
          <span v-for="(move, i) in routineView.pre" :key="'pre' + i" class="mv" :class="{ on: isLit('pre', i) }">{{ boardMoveName(view, move) }}</span>
          <span v-if="routineView.pre.length" class="note">then</span>
          <span v-for="(chunk, c) in routineView.chunks" :key="'chunk' + c" class="chunk">
            <span class="chunk-name">{{ chunk.name }}</span>
            <span class="chunk-moves">
              <span v-for="(move, i) in chunk.moves" :key="i" class="mv" :class="{ on: isLit('alg', chunkOffsets[c] + i) }">{{ boardMoveName(view, move) }}</span>
            </span>
          </span>
          <span v-if="routineView.post.length" class="note">then</span>
          <span v-for="(move, i) in routineView.post" :key="'post' + i" class="mv" :class="{ on: isLit('post', i) }">{{ boardMoveName(view, move) }}</span>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bar { display: grid; gap: 8px; margin-block-start: 6px; padding: 8px 8px 8px 14px; background: var(--card); border-radius: 16px; }
.row { display: flex; align-items: center; gap: 6px; }
.title { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
.title b { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.dots { display: inline-flex; gap: 3px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--fill-press); }
.dot.on { background: var(--accent); }
.routine { display: grid; gap: 6px; padding-inline-end: 6px; }
.label { font-size: 13px; color: var(--muted); }
.note { color: var(--muted); font-size: 13px; margin-inline-end: 4px; }
</style>
