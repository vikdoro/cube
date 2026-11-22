<script setup lang="ts">
// PROTOTYPE B, "Follow the arrows": the next turn is always on the board as pulsing arrows, with the stickers it moves
// tinted, and the card says only that turn in a few words. The reasons are one tap away under "Why?". A turn can be
// made for the player one at a time. While there are turns to make the card stays folded to one line, so the board
// keeps its room; "Why?" opens the reasons until the next turn.
import { computed, shallowRef, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Mini from './Mini.vue'
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
board.onTurnApplied(() => { why.value = false })
watch(() => g.stepDone.value, d => {
  if (d && hasTurns.value && !g.finished.value) setTimeout(() => { if (g.stepDone.value) g.advance() }, 900)
})
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" layer />

  <section v-if="!hasTurns" class="card">
    <span class="title">{{ s.title }}</span>
    <p class="say" aria-live="polite">{{ s.say[g.said.value - 1] }}</p>
    <div class="row">
      <button v-if="g.said.value < s.say.length" class="btn primary" @click="g.sayMore()">Next ›</button>
      <button v-else class="btn primary" @click="g.advance()">Got it</button>
    </div>
  </section>

  <template v-else>
    <section v-if="why" class="card why">
      <div class="head"><span class="title">{{ s.title }}</span><button class="link" @click="why = false">Hide</button></div>
      <p class="say">{{ s.say.join(' ') }}</p>
    </section>
    <Mini :turns="s.turns" :done="g.done.value" dots expandable
      :tone="g.wrong.value.length ? 'bad' : g.stepDone.value ? 'ok' : ''"
      :colour="g.next.value && !g.stepDone.value ? LAYER_COLOUR[g.next.value.layer] : undefined"
      @expand="why = !why">
      {{ g.finished.value ? '✓ The edge is home' : g.stepDone.value ? '✓ Done' : caption }}
      <template #actions>
        <button v-if="g.finished.value" class="btn" @click="g.goTo(0)">Again</button>
        <template v-else>
          <button class="btn icon" aria-label="Turn back" :disabled="g.playing.value || (!g.done.value && !g.wrong.value.length)" @click="g.back()">↶</button>
          <button class="btn primary" :disabled="g.playing.value || g.stepDone.value" @click="g.play(1)">Do it</button>
        </template>
      </template>
    </Mini>
  </template>
</template>

<style scoped>
.card { display: grid; gap: 10px; padding: 14px 16px; border-radius: 18px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); align-content: start; }
.why { animation: rise 0.25s ease-out; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font: 700 15px var(--round); }
.link { margin-left: auto; appearance: none; border: 0; background: none; color: var(--accent); font: 500 15px var(--sans); cursor: pointer; padding: 4px; }
.say { margin: 0; font-size: 17px; line-height: 1.35; }
.row { display: flex; align-items: center; gap: 10px; min-height: 40px; }
@keyframes rise { from { opacity: 0; transform: translateY(6px) } }
</style>
