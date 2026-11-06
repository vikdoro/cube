<script setup lang="ts">
import { computed } from 'vue'
import { scramble } from '../cube/drills'
import { isSolved } from '../cube/model'
import { useCube } from '../composables/useCube'
import { usePlayer } from '../composables/usePlayer'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillTitle, plural } from '../text'

const cube = useCube()
const { drill, startOver } = usePractice()
const { turnsMade } = usePlayer()
const sheets = useSheets()

// the logo starts over, asking first if that would throw away more than a couple of turns
function onLogo() {
  if (turnsMade.value > 2) sheets.open('startOver')
  else startOver()
}

const canScramble = computed(() => isSolved(cube.state.value) && !drill.value)

// during a drill the title gives way to the puzzle and its count; tapping it opens the drill's menu
const count = computed(() => {
  const d = drill.value
  if (!d) return ''
  if (d.done) return `Solved in ${plural(d.moves, 'move')}`
  return plural(d.moves, 'move') + (d.hints ? ` · ${plural(d.hints, 'hint')}` : '')
})
</script>

<template>
  <header class="nav">
    <button v-if="drill" class="status" aria-haspopup="dialog" @click="sheets.openIntro(true)">
      <span class="name">{{ drillTitle(drill) }}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </span>
      <span class="count" aria-live="polite">{{ count }}</span>
    </button>
    <h1 v-else><button class="logo" @click="onLogo">Tadacube</button></h1>
    <button v-if="canScramble" @click="cube.reset(scramble(cube.state.value))">Scramble</button>
    <button aria-haspopup="dialog" @click="sheets.open('practice')">Practice</button>
  </header>
</template>

<style scoped>
.nav { display: flex; align-items: center; gap: 8px; padding-block: 8px 4px; min-height: 52px; }
h1 { flex: 1; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
button { appearance: none; border: 0; background: transparent; color: var(--accent); font: 500 16px var(--sans); padding: 8px 6px; border-radius: 10px; cursor: pointer; min-height: 40px; }
.logo { padding: 0; color: inherit; font: inherit; letter-spacing: inherit; }
.status { flex: 1; min-width: 0; display: grid; justify-items: start; padding: 0; color: var(--fg); text-align: start; line-height: 1.2; }
.name { display: flex; align-items: center; gap: 4px; max-width: 100%; font: 700 19px var(--sans); letter-spacing: -0.01em; white-space: nowrap; }
.name svg { flex: none; color: var(--muted); }
.count { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
