<script setup lang="ts">
import { MAX_LEVEL, usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { plural } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, startUndo, resetToSolved, currentLevel } = usePractice()
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'practice'" title="Practice" @close="sheets.close">
    <p>Short puzzles that start close to solved, so every attempt ends with a solved cube.</p>
    <div class="pick">
      <b>Undo the scramble</b>
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
.pick { display: grid; gap: 8px; padding: 12px 14px; border-radius: 14px; background: var(--bg); }
.level { min-width: 44px; padding: 0; }
.level[aria-pressed="true"] { background: var(--accent); color: #fff; }
</style>
