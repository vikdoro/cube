<script setup lang="ts">
// Asked before the logo starts over, when that would throw away the player's turns.
import { usePlayer } from '../composables/usePlayer'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { plural } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { startOver } = usePractice()
const { turnsMade } = usePlayer()
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'startOver'" title="Start over?" @close="sheets.close">
    <p>The cube goes back to solved, and your {{ plural(turnsMade, 'turn') }} are lost.</p>
    <div class="actions">
      <button class="btn primary big" @click="startOver">Start over</button>
      <button class="btn plain" autofocus @click="sheets.close">Keep turning</button>
    </div>
  </BottomSheet>
</template>
