<script setup lang="ts">
import { board } from '../board'

const { badge } = board
</script>

<template>
  <!-- the space over the cube, Undo's row mirrored: the move being made, as far above the cube as Undo is below it -->
  <div class="row">
    <div class="pill" :class="{ on: badge.on }" aria-live="polite">{{ badge.text }}</div>
  </div>
</template>

<style scoped>
.row { flex: 1 0 0; min-height: 64px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.pill {
  padding: 4px 12px; white-space: nowrap; font: 700 15px var(--round); color: var(--accent); background: var(--card);
  border-radius: 999px; box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
  opacity: 0; transition: opacity 0.2s;
}
.pill.on { opacity: 1; }
</style>
