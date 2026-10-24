<script setup lang="ts">
import { computed } from 'vue'
import { MAX_LEVEL, usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { plural } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, nextPuzzle, startDrill } = usePractice()

const summary = computed(() => {
  const d = drill.value
  if (!d) return ''
  const par = d.kind === 'undo' && d.par !== null ? (d.moves <= d.par ? 'That is the shortest way. ' : `It can be done in ${d.par}. `) : ''
  return par + (d.hints ? `You used ${plural(d.hints, 'hint')}.` : 'No hints.')
})

/** A clean solve of "undo" (shortest, no hints) offers the next level up. */
const levelUp = computed(() => {
  const d = drill.value
  return d && d.kind === 'undo' && d.par !== null && d.moves <= d.par && !d.hints && d.level < MAX_LEVEL ? d.level + 1 : null
})
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'done'" :title="drill ? `Solved in ${plural(drill.moves, 'move')}` : 'Solved'" @close="sheets.close">
    <p>{{ summary }}</p>
    <div class="actions">
      <button class="btn primary big" autofocus @click="nextPuzzle">Next puzzle</button>
      <button v-if="levelUp" class="btn big" @click="startDrill('undo', levelUp)">Try {{ plural(levelUp, 'move') }}</button>
      <button class="btn plain" @click="sheets.open('practice')">Other drills</button>
    </div>
  </BottomSheet>
</template>
