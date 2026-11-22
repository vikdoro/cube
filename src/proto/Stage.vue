<script setup lang="ts">
// PROTOTYPE: the board with the spotlight over it.
import type { Move } from 'flatcube'
import { CubeBoard, type Board } from 'flatcube/vue'
import Spotlight from './Spotlight.vue'

defineProps<{ board: Board; pieces: number[]; targets: number[]; arrow: Move | null; dim?: boolean; layer?: boolean }>()
</script>

<template>
  <main class="stage">
    <div class="boardbox">
      <CubeBoard :board="board" @turn="m => board.turn(m, true)" />
      <Spotlight :board="board" :pieces="pieces" :targets="targets" :arrow="arrow" :dim="!!dim" :layer="layer" />
    </div>
  </main>
</template>

<style scoped>
/* the board's own sizing leaves room for rows above and below it; the guide panel takes the place of those here */
.stage { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; container-type: size; }
.boardbox { position: relative; display: flex; flex-direction: column; flex: none; margin-block: -40px -24px; }
</style>
