<script setup lang="ts">
// PROTOTYPE A, "Coach card": the step's explanation a sentence at a time, the pieces it talks about lit up and the
// rest dimmed. Then "Show me" plays the step, or the player turns it; the bar fills either way. The next turn's
// arrows only appear when the player hesitates. The words float over the board in a bubble while there's something
// to read; once the player turns (or asks to be shown) it goes, and a new step brings it back.
import { computed, shallowRef, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Mini from './Mini.vue'
import Stage from './Stage.vue'
import { STEPS } from './script'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()
const s = g.current
const allSaid = computed(() => g.said.value >= s.value.say.length)
const arrow = computed(() =>
  g.wrong.value.length || (allSaid.value && !g.playing.value && g.idle.value > 4000) ? g.next.value : null)

/** The player is doing the step: the card is folded. */
const doing = shallowRef(false)
const reading = computed(() => !(doing.value && s.value.turns.length > 0) || g.finished.value)
board.onTurnApplied((_, byPlayer) => { if (byPlayer && s.value.turns.length) doing.value = true })
watch(() => g.step.value, () => { doing.value = false })

const left = computed(() => s.value.turns.length - g.done.value)
const status = computed(() =>
  g.wrong.value.length ? 'Not part of this step' : g.finished.value ? '✓ The edge is home' : g.stepDone.value && s.value.turns.length ? '✓ Nice'
    : reading.value ? `Step ${g.step.value + 1} of ${STEPS.length}` : g.playing.value ? 'Watch the board' : `${s.value.title}: ${left.value} to go`)

function show() { doing.value = true; g.play() }

// a finished step with turns moves on by itself, after a moment to see it land
watch(() => g.stepDone.value, d => {
  if (d && s.value.turns.length && !g.finished.value) setTimeout(() => { if (g.stepDone.value) g.advance() }, 1100)
})
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" dim>
    <template v-if="reading" #bubble>
      <div class="head">
        <span class="dots"><i v-for="(_, i) in STEPS" :key="i" :class="{ on: i <= g.step.value }" /></span>
        <span class="title">{{ s.title }}</span>
      </div>
      <div class="say" aria-live="polite">
        <p v-if="g.finished.value">The edge is home, and the white face is still done.</p>
        <p v-else v-for="(line, i) in s.say.slice(0, g.said.value)" :key="g.step.value + '-' + i" :class="{ old: i < g.said.value - 1 }">{{ line }}</p>
      </div>
    </template>
  </Stage>

  <Mini :turns="reading ? [] : s.turns" :done="g.done.value" :expandable="!reading"
    :tone="g.wrong.value.length ? 'bad' : g.stepDone.value && s.turns.length ? 'ok' : ''" @expand="doing = false">
    <span :class="{ muted: reading && !(g.stepDone.value && s.turns.length) }">{{ status }}</span>
    <template #actions>
      <button v-if="g.wrong.value.length" class="btn primary" :disabled="g.playing.value" @click="g.play(g.wrong.value.length)">Undo it</button>
      <button v-else-if="g.finished.value" class="btn" @click="g.goTo(0)">Again</button>
      <template v-else-if="g.stepDone.value && s.turns.length" />
      <button v-else-if="!allSaid" class="btn primary" @click="g.sayMore()">Next ›</button>
      <button v-else-if="!s.turns.length" class="btn primary" @click="g.advance()">Got it</button>
      <template v-else-if="reading">
        <button class="btn" :disabled="g.playing.value" @click="show">Show me</button>
        <button class="btn primary" @click="doing = true">{{ g.done.value ? 'Carry on' : 'I’ll do it' }}</button>
      </template>
      <button v-else class="btn" :disabled="g.playing.value" @click="g.play()">Show me</button>
    </template>
  </Mini>
</template>

<style scoped>
.head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.dots { display: flex; gap: 4px; }
.dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--fill); }
.dots i.on { background: var(--accent); }
.title { font: 700 15px var(--round); }
.say { display: grid; gap: 4px; }
.say p { margin: 0; font-size: 17px; line-height: 1.35; animation: rise 0.3s ease-out; }
.say p.old { font-size: 14px; color: var(--muted); }
.muted { color: var(--muted); font-weight: 600; font-size: 16px; }
@keyframes rise { from { opacity: 0; transform: translateY(6px) } }
</style>
