<script setup lang="ts">
// The course: the stages in the order they are taught, each with its meter, and the warm-up drill.
import { TEACHING_ORDER } from '../cube/method'
import { stage } from '../cube/stages'
import { useCourse } from '../composables/useCourse'
import { MAX_LEVEL, usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { plural } from '../text'
import BottomSheet from './BottomSheet.vue'
import Meter from './Meter.vue'

const sheets = useSheets()
const course = useCourse()
const { drill, startUndo, startLesson, resetToSolved, currentLevel } = usePractice()
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'course'" title="Learn" @close="sheets.close">
    <p>Learn to solve the cube from its last step backwards. A lesson is five short puzzles that all end with a solved cube. A stage gets solid with a few clean lessons, and asks for a refresh when it has been left a while.</p>
    <div class="stages">
      <button v-for="id in TEACHING_ORDER" :key="id" class="stage" @click="startLesson(id)">
        <span class="line">
          <b>{{ stage(id).title }}</b>
          <span v-if="id === course.recommended.value" class="tag">Next up</span>
        </span>
        <span class="line meta">
          <Meter :bars="course.bars(id)" />
          <span>{{ course.status(id) }}</span>
        </span>
        <span v-if="course.ahead(id)" class="note">Easier once <i>{{ stage(course.frontier.value).title }}</i> is solid.</span>
      </button>
    </div>
    <div class="pick">
      <b>Warm up: undo the scramble</b>
      <p>The cube was turned a few times. Turn it back. Start at 1 and add one when it feels easy.</p>
      <div class="chips">
        <button
          v-for="n in MAX_LEVEL" :key="n" class="btn level"
          :aria-pressed="n === currentLevel()" :aria-label="`Undo ${plural(n, 'move')}`"
          @click="startUndo(n)"
        >{{ n }}</button>
      </div>
    </div>
    <button v-if="drill" class="btn plain" @click="resetToSolved">Stop practising</button>
  </BottomSheet>
</template>

<style scoped>
.stages { display: grid; gap: 8px; }
.stage { appearance: none; border: 0; text-align: start; display: grid; gap: 6px; padding: 12px 14px; border-radius: 14px; background: var(--bg); color: var(--fg); font: 15px var(--sans); cursor: pointer; }
.stage:active { background: var(--fill-press); }
.line { display: flex; align-items: center; gap: 8px; }
.line b { flex: 1; font-weight: 600; }
.meta { color: var(--muted); font-size: 13px; }
.tag { padding: 2px 8px; border-radius: 999px; background: var(--accent); color: #fff; font: 600 12px var(--round); }
.note { color: var(--muted); font-size: 13px; }
.note i { font-style: normal; color: var(--fg); }
.pick { display: grid; gap: 8px; padding: 12px 14px; border-radius: 14px; background: var(--bg); }
.level { min-width: 44px; padding: 0; }
.level[aria-pressed="true"] { background: var(--accent); color: #fff; }
</style>
