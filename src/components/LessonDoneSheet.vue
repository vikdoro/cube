<script setup lang="ts">
// The end of a lesson (or of an undo puzzle): how it went, and what to do next.
import { computed } from 'vue'
import { stage } from '../cube/stages'
import { LESSON_SIZE, SOLID, useCourse } from '../composables/useCourse'
import { MAX_LEVEL, usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { plural } from '../text'
import BottomSheet from './BottomSheet.vue'
import Meter from './Meter.vue'

const sheets = useSheets()
const course = useCourse()
const { drill, nextPuzzle, startUndo, startLesson } = usePractice()

const title = computed(() => {
  const d = drill.value
  return !d ? 'Solved' : d.kind === 'undo' ? `Solved in ${plural(d.moves, 'move')}` : 'Lesson complete'
})

const undoSummary = computed(() => {
  const d = drill.value
  if (!d) return ''
  const par = d.par !== null ? (d.moves <= d.par ? 'That is the shortest way. ' : `It can be done in ${d.par}. `) : ''
  return par + (d.hints ? `You used ${plural(d.hints, 'hint')}.` : 'No hints.')
})

/** A clean solve of "undo" (shortest, no hints) offers the next level up. */
const levelUp = computed(() => {
  const d = drill.value
  return d && d.kind === 'undo' && d.par !== null && d.moves <= d.par && !d.hints && d.level < MAX_LEVEL ? d.level + 1 : null
})

const verdict = computed(() => {
  const r = drill.value?.result
  if (!r) return ''
  if (r.after > r.before) return r.after === SOLID ? 'Solid. Nicely done.' : r.before ? 'One bar up.' : 'First bar lit. From now on the arrows only come when you ask.'
  if (r.after < r.before) return 'One bar down. Another lesson brings it back.'
  return r.after === SOLID ? 'Still solid, refreshed.' : 'Steady. A cleaner lesson adds a bar.'
})

/** Another stage worth doing next, when it isn't the one just practised. */
const nextStage = computed(() => {
  const d = drill.value
  return d && course.recommended.value !== d.stage ? course.recommended.value : null
})
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'done'" :title="title" @close="sheets.close">
    <template v-if="drill?.kind === 'undo'">
      <p>{{ undoSummary }}</p>
      <div class="actions">
        <button class="btn primary big" autofocus @click="nextPuzzle">Next puzzle</button>
        <button v-if="levelUp" class="btn big" @click="startUndo(levelUp)">Try {{ plural(levelUp, 'move') }}</button>
        <button class="btn plain" @click="sheets.open('course')">Back to Learn</button>
      </div>
    </template>
    <template v-else-if="drill?.lesson && drill.result">
      <p>{{ drill.lesson.clean }} of {{ LESSON_SIZE }} puzzles without hints.</p>
      <div class="result">
        <b>{{ stage(drill.stage!).title }}</b>
        <span class="meta"><Meter :bars="drill.result.after" /> <span>{{ course.status(drill.stage!) }}</span></span>
      </div>
      <p>{{ verdict }}</p>
      <div class="actions">
        <button class="btn primary big" autofocus @click="startLesson(drill.stage!)">Another lesson</button>
        <button v-if="nextStage" class="btn big" @click="startLesson(nextStage)">Next up: {{ stage(nextStage).title }}</button>
        <button class="btn plain" @click="sheets.open('course')">Back to Learn</button>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
.result { display: grid; gap: 6px; padding: 12px 14px; border-radius: 14px; background: var(--bg); }
.meta { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
</style>
