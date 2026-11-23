<script setup lang="ts">
import { shallowRef } from 'vue'
import { DRILLS, type DrillKind } from '../drills'
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { loadPractice, savePractice } from '../storage'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, start, resetToSolved } = usePractice()

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
    <div v-for="def in DRILLS" :key="def.kind" class="pick">
      <b>{{ def.pick }}</b>
      <p>{{ def.about }}</p>
      <div class="chips">
        <button class="btn level" :aria-pressed="drill?.kind === def.kind" @click="start(def.kind)">
          {{ drill?.kind === def.kind ? 'New puzzle' : 'Start' }}
        </button>
      </div>
      <label v-if="def.guided" class="guided">
        <input type="checkbox" role="switch" :checked="!!guided[def.kind]" @change="setGuided(def.kind, ($event.target as HTMLInputElement).checked)">
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
