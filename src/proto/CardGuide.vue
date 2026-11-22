<script setup lang="ts">
// PROTOTYPE A, "Coach card": the step's explanation a sentence at a time, the pieces it talks about lit up and the
// rest dimmed. Then "Show me" plays the step, or the player turns it; the bar fills either way. The next turn's
// arrows only appear when the player hesitates.
import { computed, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Bar from './Bar.vue'
import Stage from './Stage.vue'
import { STEPS } from './script'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()
const s = g.current
const allSaid = computed(() => g.said.value >= s.value.say.length)
const arrow = computed(() =>
  g.wrong.value.length || (allSaid.value && !g.playing.value && g.idle.value > 4000) ? g.next.value : null)

// a finished step with turns moves on by itself, after a moment to see it land
watch(() => g.stepDone.value, d => {
  if (d && s.value.turns.length && !g.finished.value) setTimeout(() => { if (g.stepDone.value) g.advance() }, 1100)
})
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" dim />
  <section class="card">
    <div class="head">
      <span class="dots"><i v-for="(_, i) in STEPS" :key="i" :class="{ on: i <= g.step.value }" /></span>
      <span class="title">{{ s.title }}</span>
    </div>
    <div class="say" aria-live="polite">
      <p v-for="(line, i) in s.say.slice(0, g.said.value)" :key="g.step.value + '-' + i" :class="{ old: i < g.said.value - 1 }">{{ line }}</p>
    </div>
    <Bar v-if="s.turns.length && allSaid" :turns="s.turns" :done="g.done.value" />
    <div v-if="g.wrong.value.length" class="row warn">
      <span>That turn isn’t part of this step.</span>
      <button class="btn primary" :disabled="g.playing.value" @click="g.play(g.wrong.value.length)">Undo it</button>
    </div>
    <div v-else-if="g.finished.value" class="row">
      <span class="ok">✓ The edge is home.</span>
      <button class="btn" @click="g.goTo(0)">Again</button>
    </div>
    <div v-else-if="g.stepDone.value && s.turns.length" class="row"><span class="ok">✓ Nice</span></div>
    <div v-else class="row">
      <button v-if="!allSaid" class="btn primary" @click="g.sayMore()">Next ›</button>
      <button v-else-if="!s.turns.length" class="btn primary" @click="g.advance()">Got it</button>
      <template v-else>
        <button class="btn primary" :disabled="g.playing.value" @click="g.play()">{{ g.done.value ? 'Show me the rest' : 'Show me' }}</button>
        <span class="muted">or turn it yourself</span>
      </template>
    </div>
  </section>
</template>

<style scoped>
.card { display: grid; gap: 12px; padding: 14px 16px; border-radius: 18px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); min-height: 196px; align-content: start; }
.head { display: flex; align-items: center; gap: 10px; }
.dots { display: flex; gap: 4px; }
.dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--fill); }
.dots i.on { background: var(--accent); }
.title { font: 700 15px var(--round); }
.say { display: grid; gap: 6px; min-height: 48px; }
.say p { margin: 0; font-size: 17px; line-height: 1.35; animation: rise 0.3s ease-out; }
.say p.old { font-size: 14px; color: var(--muted); }
.row { display: flex; align-items: center; gap: 12px; min-height: 40px; }
.warn span { flex: 1; color: #d70015; font-weight: 500; }
.ok { color: #248a3d; font: 700 16px var(--round); flex: 1; }
.muted { color: var(--muted); font-size: 14px; }
@keyframes rise { from { opacity: 0; transform: translateY(6px) } }
</style>
