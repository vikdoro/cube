<script setup lang="ts">
// Hint during a drill, in the row under the cube beside Undo; once solved it becomes Next.
import { usePractice } from '../composables/usePractice'

const { drill, hint, nextPuzzle } = usePractice()
</script>

<template>
  <template v-if="drill">
    <button v-if="!drill.done" class="pill" @click="hint">Hint</button>
    <button v-else class="pill primary" @click="nextPuzzle">Next</button>
  </template>
</template>

<style scoped>
.pill {
  appearance: none; border: 0; height: 40px; padding: 0 16px; border-radius: 999px; cursor: pointer; pointer-events: auto;
  font: 600 15px var(--round); color: var(--accent); background: var(--card);
  box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
}
.pill:active { background: var(--fill-press); }
.pill.primary { background: var(--accent); color: #fff; }
</style>
