<script setup lang="ts">
// PROTOTYPE: the board with the spotlight over it, as big as the space the guide bar leaves it, and that size never
// changes. Words float over the board in a bubble, on whichever half the step's pieces are not on (usually the lid).
import { computed } from 'vue'
import type { Move } from 'flatcube'
import { slotCentre } from 'flatcube/board'
import { CubeBoard, type Board } from 'flatcube/vue'
import Spotlight from './Spotlight.vue'

const props = defineProps<{ board: Board; pieces: number[]; targets: number[]; arrow: Move | null; dim?: boolean; layer?: boolean }>()

// the middle face's centre is at 0; the lid is far above it
const side = computed(() => {
  const b = props.board, state = b.state.value
  const ys = props.pieces.map(id => slotCentre(b.view.value, state.indexOf(id))[1])
  const mean = ys.length ? ys.reduce((a, y) => a + y, 0) / ys.length : 100
  return mean > -60 ? 'top' : 'bottom'
})
</script>

<template>
  <main class="stage">
    <!-- the board sizes itself to leave 128px for rows above and below it, which the prototypes don't have: this box
         is that much taller than the stage, so the board fills the stage itself -->
    <div class="sizer">
      <div class="boardbox">
        <CubeBoard :board="board" @turn="m => board.turn(m, true)" />
        <Spotlight :board="board" :pieces="pieces" :targets="targets" :arrow="arrow" :dim="!!dim" :layer="layer" />
      </div>
    </div>
    <Transition name="bubble">
      <div v-if="$slots.bubble" class="bubble" :class="side"><slot name="bubble" /></div>
    </Transition>
  </main>
</template>

<style scoped>
.stage { flex: 1; min-height: 0; position: relative; }
.sizer { position: absolute; inset: -64px 0; container-type: size; display: flex; flex-direction: column; justify-content: center; pointer-events: none; }
.boardbox { position: relative; display: flex; flex-direction: column; flex: none; }
.boardbox > :deep(svg:first-child) { pointer-events: auto; }
.bubble { position: absolute; left: 0; right: 0; z-index: 2; padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--card) 92%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 2px 4px rgba(0,0,0,0.08), 0 10px 30px rgba(0,0,0,0.16); }
.bubble.top { top: 0; right: 52px; }
.bubble.bottom { bottom: 0; }
.bubble-enter-active, .bubble-leave-active { transition: opacity 0.2s, transform 0.2s; }
.bubble-enter-from, .bubble-leave-to { opacity: 0; transform: translateY(6px); }
</style>
