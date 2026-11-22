<script setup lang="ts">
// PROTOTYPE: the board with the spotlight over it, as big as the space the guide panel leaves it. The panel never
// changes height, so neither does the board.
import type { Move } from 'flatcube'
import { CubeBoard, type Board } from 'flatcube/vue'
import Spotlight from './Spotlight.vue'

defineProps<{ board: Board; pieces: number[]; targets: number[]; arrow: Move | null; dim?: boolean; layer?: boolean; area?: number[] }>()
</script>

<template>
  <main class="stage">
    <!-- the board sizes itself to leave 128px for rows above and below it, which the prototype doesn't have: this box
         is that much taller than the stage, so the board fills the stage itself -->
    <div class="sizer">
      <div class="boardbox">
        <CubeBoard :board="board" @turn="m => board.turn(m, true)" />
        <Spotlight :board="board" :pieces="pieces" :targets="targets" :arrow="arrow" :dim="!!dim" :layer="layer" :area="area" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.stage { flex: 1; min-height: 0; position: relative; }
.sizer { position: absolute; inset: -64px 0; container-type: size; display: flex; flex-direction: column; justify-content: center; pointer-events: none; }
.boardbox { position: relative; display: flex; flex-direction: column; flex: none; }
.boardbox > :deep(svg:first-child) { pointer-events: auto; }
</style>
