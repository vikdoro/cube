<script setup lang="ts">
// PROTOTYPE (throwaway, ?proto in the URL): guiding the player through one hardcoded middle layer puzzle, to pin
// down the UX before building it into the drills. Nothing here touches the real app's state.
import { onBeforeUnmount, onMounted } from 'vue'
import { attachKeyboard, createBoard } from 'flatcube/vue'
import Guide from './Guide.vue'
import { START } from './script'
import { useGuide } from './useGuide'

const board = createBoard({ state: START })
const guide = useGuide(board)

let detach: (() => void) | undefined
onMounted(() => {
  detach = attachKeyboard({
    getView: () => board.view.value,
    onAction: a => a.type === 'turn' ? board.turn(a.move, true) : a.type === 'roll' ? board.roll(a.towards) : guide.back(),
  })
})
onBeforeUnmount(() => detach?.())
</script>

<template>
  <div class="app">
    <Guide :board="board" :guide="guide" />
  </div>
</template>

<style scoped>
.app { position: relative; height: 100%; touch-action: none; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; padding-inline: 12px; padding-block: calc(12px + env(safe-area-inset-top, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)); }
</style>
