<script setup lang="ts">
// The end of a puzzle: how it went, and what to do next.
import { computed } from 'vue'
import { MAX_LEVEL, usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { doneTitle, levelName, plural } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, nextPuzzle, start } = usePractice()

const summary = computed(() => {
  const d = drill.value
  if (!d) return ''
  const par = d.par !== null ? (d.moves <= d.par ? 'That is the shortest way. ' : `It can be done in ${d.par}. `) : ''
  return par + (d.hints ? `You used ${plural(d.hints, 'hint')}.` : 'No hints.')
})

/** A clean solve (shortest, no hints) offers the next level up. */
const levelUp = computed(() => {
  const d = drill.value
  return d && d.par !== null && d.moves <= d.par && !d.hints && d.level < MAX_LEVEL[d.kind] ? d.level + 1 : null
})
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'done'" :title="drill ? doneTitle(drill) : 'Solved'" @close="sheets.close">
    <p>{{ summary }}</p>
    <div class="actions">
      <button class="btn primary big" autofocus @click="nextPuzzle">Next puzzle</button>
      <button v-if="drill && levelUp" class="btn big" @click="start(drill.kind, levelUp)">Try {{ levelUp === 4 && drill.kind === 'lily' ? 'a ' : '' }}{{ levelName(drill.kind, levelUp) }}</button>
      <button class="btn plain" @click="sheets.open('practice')">Back to Practice</button>
    </div>
  </BottomSheet>
</template>
