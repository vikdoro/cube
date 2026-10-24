<script setup lang="ts">
import { computed } from 'vue'
import { scramble } from '../cube/drills'
import { isSolved } from '../cube/model'
import { useCube } from '../composables/useCube'
import { usePlayer } from '../composables/usePlayer'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'

const cube = useCube()
const { undoOffered, undo } = usePlayer()
const { drill } = usePractice()
const sheets = useSheets()

const canScramble = computed(() => isSolved(cube.state.value) && !drill.value)
</script>

<template>
  <header class="nav">
    <h1>Cube</h1>
    <!-- the move being made, centred in the bar so it never covers the board or its arrows -->
    <div class="pill badge" :class="{ on: cube.badge.value.on }" aria-live="polite">{{ cube.badge.value.text }}</div>
    <!-- Undo takes the move's place once its letter has had its moment, then fades away on its own -->
    <button class="pill undo" :class="{ on: undoOffered }" aria-label="Undo the last move" @click="undo">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
      Undo
    </button>
    <button v-if="canScramble" @click="cube.reset(scramble(cube.state.value))">Scramble</button>
    <button aria-haspopup="dialog" @click="sheets.open('practice')">Practice</button>
    <button class="info" aria-haspopup="dialog" aria-label="How to read the board" @click="sheets.open('help')">?</button>
  </header>
</template>

<style scoped>
.nav { position: relative; display: flex; align-items: center; gap: 8px; padding-block: 8px 4px; }
h1 { flex: 1; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
button { appearance: none; border: 0; background: transparent; color: var(--accent); font: 500 16px var(--sans); padding: 8px 6px; border-radius: 10px; cursor: pointer; min-height: 40px; }
.info { width: 32px; height: 32px; min-height: 0; padding: 0; border-radius: 50%; background: var(--fill); font-weight: 700; font-size: 15px; }
.pill {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); white-space: nowrap;
  font: 700 15px var(--round); color: var(--accent); background: var(--card); border-radius: 999px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06); opacity: 0;
}
.badge { padding: 4px 12px; transition: opacity 0.2s; pointer-events: none; }
.badge.on { opacity: 1; }
.undo { min-height: 0; padding: 4px 14px 4px 10px; display: flex; align-items: center; gap: 5px; visibility: hidden; transition: opacity 0.2s, visibility 0s 0.2s; }
.undo.on { opacity: 1; visibility: visible; transition: opacity 0.2s; }
.undo:active { background: var(--fill-press); }
</style>
