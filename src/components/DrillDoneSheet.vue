<script setup lang="ts">
// The end of a puzzle: how it went, and what to do next.
import { computed } from 'vue'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { doneSummary, doneTitle } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, nextPuzzle } = usePractice()

const summary = computed(() => drill.value ? doneSummary(drill.value) : '')
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
