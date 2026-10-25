<script setup lang="ts">
import { usePlayer } from '../composables/usePlayer'

const { undoOffered, undo } = usePlayer()
</script>

<template>
  <!-- the space under the cube (it overlaps the board's bottom margin, so lets touches through); it keeps its size
       while Undo is hidden, so the board never jumps -->
  <div class="row">
    <!-- Undo shows the moment a turn is made, then fades away on its own -->
    <button class="undo" :class="{ on: undoOffered }" aria-label="Undo the last move" @click="undo">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
    </button>
  </div>
</template>

<style scoped>
.row { flex: 1 0 0; min-height: 64px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.undo {
  appearance: none; border: 0; width: 48px; height: 48px; padding: 0; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: var(--accent); background: var(--card);
  box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
  opacity: 0; visibility: hidden; transition: opacity 0.2s, visibility 0s 0.2s;
}
.undo.on { opacity: 1; visibility: visible; transition: opacity 0.2s; pointer-events: auto; }
.undo:active { background: var(--fill-press); }
</style>
