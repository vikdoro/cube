<script setup lang="ts">
// The end of a puzzle: how it went, and what to do next.
import { computed } from 'vue'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { doneTitle, plural } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, nextPuzzle } = usePractice()

const summary = computed(() => {
  const d = drill.value
  if (!d) return ''
  const par = d.kind !== 'lily'
    ? (d.moves <= d.par ? 'No wasted turns. ' : `The routine takes ${d.par}. `)
    : (d.moves <= d.par ? 'That is the shortest way. ' : `It can be done in ${d.par}. `)
  return par + (d.hints ? `You used ${plural(d.hints, 'hint')}.` : 'No hints.')
})

</script>

<template>
  <BottomSheet :open="sheets.current.value === 'done'" :title="drill ? doneTitle(drill) : 'Solved'" @close="sheets.close">
    <p>{{ summary }}</p>
    <div class="actions">
      <button class="btn primary big" autofocus @click="nextPuzzle">Next puzzle</button>
      <button class="btn plain" @click="sheets.open('practice')">Back to Practice</button>
    </div>
  </BottomSheet>
</template>
