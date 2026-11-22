<script setup lang="ts">
// PROTOTYPE: each step's explanation floats over the board in a bubble, the pieces it talks about lit and the rest
// dimmed. The player makes every turn; the next one is always drawn on the board as pulsing arrows, and the bar under
// the board names it. The bubble goes once the player starts turning, and tapping the bar brings it back. The bar
// turns green when the step is done and red after a wrong turn, whose undo the arrows then show.
import { computed, shallowRef, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Mini from './Mini.vue'
import Stage from './Stage.vue'
import { LAYER_COLOUR, STEPS } from './script'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()
const s = g.current
const hasTurns = computed(() => s.value.turns.length > 0)

/** The bubble is up: at the start of each step, and when the player asks for it. */
const reading = shallowRef(true)
watch(() => g.step.value, () => { reading.value = true })
board.onTurnApplied(() => { reading.value = false })

const caption = computed(() => {
  if (g.finished.value) return '✓ The edge is home'
  if (g.wrong.value.length) return 'Not that one. Undo it.'
  if (g.stepDone.value) return '✓ Done'
  return s.value.captions[g.done.value]
})
const arrow = computed(() => hasTurns.value && !g.stepDone.value ? g.next.value : null)
const colour = computed(() => arrow.value && !g.wrong.value.length ? LAYER_COLOUR[arrow.value.layer] : undefined)
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" dim>
    <template v-if="reading || !hasTurns" #bubble>
      <div class="head">
        <span class="title">{{ s.title }}</span>
        <span class="muted">{{ g.step.value + 1 }} of {{ STEPS.length }}</span>
        <button v-if="hasTurns" class="link" @click="reading = false">Hide</button>
      </div>
      <p class="say" aria-live="polite">{{ s.say.join(' ') }}</p>
    </template>
  </Stage>

  <Mini :turns="s.turns" :done="g.done.value" :expandable="hasTurns" :colour="colour"
    :tone="g.wrong.value.length ? 'bad' : g.stepDone.value && hasTurns ? 'ok' : ''" @expand="reading = !reading">
    <span v-if="!hasTurns" class="muted">Step {{ g.step.value + 1 }} of {{ STEPS.length }}</span>
    <template v-else>{{ caption }}</template>
    <template #actions>
      <button v-if="!hasTurns" class="btn primary" @click="g.advance()">Got it</button>
      <button v-else-if="g.finished.value" class="btn primary" @click="g.goTo(0)">Again</button>
      <button v-else-if="g.stepDone.value" class="btn primary" @click="g.advance()">Next step</button>
    </template>
  </Mini>
</template>

<style scoped>
.muted { color: var(--muted); font-weight: 600; font-size: 14px; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font: 700 15px var(--round); }
.link { margin-left: auto; appearance: none; border: 0; background: none; color: var(--accent); font: 500 15px var(--sans); cursor: pointer; padding: 4px; }
.say { margin: 0; font-size: 17px; line-height: 1.35; }
</style>
