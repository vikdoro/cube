<script setup lang="ts">
import { shallowRef } from 'vue'
import type { DrillKind } from '../cube/drills'
import { GUIDES } from '../composables/useGuide'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { loadPractice, savePractice } from '../storage'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, start, resetToSolved } = usePractice()

// the steps of the method in order, each drill starting where the one before leaves the cube
const PICKS: { kind: DrillKind, title: string, about: string }[] = [
  { kind: 'lily', title: 'Make the white lily', about: 'The first step of solving, from a full scramble: the four white edges around the yellow centre.' },
  { kind: 'cross', title: 'Make the white cross', about: 'From the lily, the petals drop onto the lid, each on the side of its own colour.' },
  { kind: 'corners', title: 'Put in the white corners', about: 'From the cross, with white in the middle, the corners go in between the cross\'s edges, which finishes the white face.' },
  { kind: 'middle', title: 'Fill the middle layer', about: 'From the white face, the four edges with no yellow go into the middle row, each between the sides of its colours.' },
  { kind: 'yellow', title: 'Make the yellow cross', about: 'From the first two layers, the yellow edges turn so their yellow is on the yellow face. Six turns, done once, twice or three times.' },
  { kind: 'edges', title: 'Put the yellow edges in place', about: 'From the yellow cross, the yellow edges swap round until each one\'s other colour matches its side. Nine turns, done once or twice.' },
]

// guided play, chosen per drill and remembered; it takes effect from the next puzzle started
const guided = shallowRef(loadPractice().guided ?? {})
function setGuided(kind: DrillKind, on: boolean) {
  guided.value = { ...guided.value, [kind]: on }
  savePractice({ guided: guided.value })
}
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'practice'" title="Practice" @close="sheets.close">
    <p>Short puzzles, one for each step of solving. Each starts where the step before leaves the cube.</p>
    <div v-for="pick in PICKS" :key="pick.kind" class="pick">
      <b>{{ pick.title }}</b>
      <p>{{ pick.about }}</p>
      <div class="chips">
        <button class="btn level" :aria-pressed="drill?.kind === pick.kind" @click="start(pick.kind)">
          {{ drill?.kind === pick.kind ? 'New puzzle' : 'Start' }}
        </button>
      </div>
      <label v-if="GUIDES[pick.kind]" class="guided">
        <input type="checkbox" role="switch" :checked="!!guided[pick.kind]" @change="setGuided(pick.kind, ($event.target as HTMLInputElement).checked)">
        <span>Guided, step by step<small>Every turn shown and explained.</small></span>
      </label>
    </div>
    <button v-if="drill" class="btn plain" @click="resetToSolved">Stop practising</button>
  </BottomSheet>
</template>

<style scoped>
.pick { display: grid; gap: 8px; padding: 12px 14px; border-radius: 14px; background: var(--bg); }
.level { padding: 0 14px; }
.level[aria-pressed="true"] { background: var(--accent); color: #fff; }
.guided { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.guided span { display: grid; font-weight: 500; }
.guided small { color: var(--muted); font-size: 13px; font-weight: 400; }
.guided input { appearance: none; flex: none; position: relative; width: 44px; height: 26px; margin: 0; border-radius: 13px; background: var(--fill); cursor: pointer; transition: background-color 0.2s; }
.guided input::after { content: ''; position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: transform 0.2s; }
.guided input:checked { background: #34c759; }
.guided input:checked::after { transform: translateX(18px); }
.guided input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
