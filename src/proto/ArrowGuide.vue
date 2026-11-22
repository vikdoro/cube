<script setup lang="ts">
// PROTOTYPE B, "Follow the arrows": the next turn is always on the board as pulsing arrows, with the stickers it moves
// tinted, and the card says only that turn in a few words. The reasons are one tap away under "Why?". A turn can be
// made for the player one at a time.
import { computed, shallowRef, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Bar from './Bar.vue'
import Stage from './Stage.vue'
import { LAYER_COLOUR } from './script'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()
const s = g.current
const why = shallowRef(false)
const hasTurns = computed(() => s.value.turns.length > 0)
const caption = computed(() => g.wrong.value.length ? 'Undo that turn' : s.value.captions[g.done.value] ?? '')
const arrow = computed(() => hasTurns.value && !g.stepDone.value ? g.next.value : null)

watch(() => g.step.value, () => { why.value = false })
watch(() => g.stepDone.value, d => {
  if (d && hasTurns.value && !g.finished.value) setTimeout(() => { if (g.stepDone.value) g.advance() }, 900)
})
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" layer />
  <section class="card">
    <div class="head">
      <span class="title">{{ s.title }}</span>
      <span v-if="hasTurns" class="muted">{{ Math.min(g.done.value + 1, s.turns.length) }} of {{ s.turns.length }}</span>
      <button v-if="hasTurns" class="link" @click="why = !why">{{ why ? 'Hide' : 'Why?' }}</button>
    </div>

    <template v-if="!hasTurns">
      <p class="say" aria-live="polite">{{ s.say[g.said.value - 1] }}</p>
      <div class="row">
        <button v-if="g.said.value < s.say.length" class="btn primary" @click="g.sayMore()">Next ›</button>
        <button v-else class="btn primary" @click="g.advance()">Got it</button>
      </div>
    </template>

    <template v-else>
      <p v-if="why" class="why">{{ s.say.join(' ') }}</p>
      <div class="turn" :class="{ bad: g.wrong.value.length }" aria-live="polite">
        <i v-if="g.next.value && !g.stepDone.value" :style="{ background: LAYER_COLOUR[g.next.value.layer] }" />
        <span v-if="g.finished.value" class="ok">✓ The edge is home</span>
        <span v-else-if="g.stepDone.value" class="ok">✓ Done</span>
        <span v-else>{{ caption }}</span>
      </div>
      <Bar :turns="s.turns" :done="g.done.value" dots />
      <div class="row">
        <button v-if="g.finished.value" class="btn" @click="g.goTo(0)">Again</button>
        <template v-else>
          <button class="btn icon" aria-label="Turn back" :disabled="g.playing.value || (!g.done.value && !g.wrong.value.length)" @click="g.back()">↶</button>
          <button class="btn primary" :disabled="g.playing.value || g.stepDone.value" @click="g.play(1)">Do it for me</button>
          <span class="muted">or follow the arrows</span>
        </template>
      </div>
    </template>
  </section>
</template>

<style scoped>
.card { display: grid; gap: 12px; padding: 14px 16px; border-radius: 18px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); min-height: 196px; align-content: start; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font: 700 15px var(--round); }
.link { margin-left: auto; appearance: none; border: 0; background: none; color: var(--accent); font: 500 15px var(--sans); cursor: pointer; padding: 4px; }
.say { margin: 0; font-size: 17px; line-height: 1.35; min-height: 48px; }
.why { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.35; }
.turn { display: flex; align-items: center; gap: 10px; font: 700 22px var(--round); min-height: 32px; }
.turn i { width: 18px; height: 18px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); }
.turn.bad { color: #d70015; }
.ok { color: #248a3d; }
.row { display: flex; align-items: center; gap: 10px; min-height: 40px; }
.muted { color: var(--muted); font-size: 14px; }
</style>
