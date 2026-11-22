<script setup lang="ts">
// PROTOTYPE (throwaway, ?proto in the URL): three ways of guiding the player through one hardcoded middle layer
// puzzle, to pin down the UX before building it into the drills. Nothing here touches the real app's state.
import { onBeforeUnmount, onMounted } from 'vue'
import { attachKeyboard, createBoard } from 'flatcube/vue'
import ArrowGuide from './ArrowGuide.vue'
import CardGuide from './CardGuide.vue'
import WatchGuide from './WatchGuide.vue'
import { START } from './script'
import { useGuide } from './useGuide'

const VARIANTS = {
  a: { name: 'Coach card', blurb: 'The explanation a sentence at a time, the pieces it mentions lit up. Then “Show me” plays the step, or you turn it.', view: CardGuide },
  b: { name: 'Follow the arrows', blurb: 'The next turn is always drawn on the board, and the card names just that turn. The reasons are behind “Why?”.', view: ArrowGuide },
  c: { name: 'Watch, then try', blurb: 'Each step plays first like a short clip you can pause and step through, then turns back for you to copy.', view: WatchGuide },
} as const
type Key = keyof typeof VARIANTS

const pick = new URLSearchParams(location.search).get('proto') as Key | null
const variant = pick && pick in VARIANTS ? VARIANTS[pick] : null

const board = createBoard({ state: START })
const guide = useGuide(board)

let detach: (() => void) | undefined
onMounted(() => {
  detach = attachKeyboard({
    getView: () => board.view.value,
    onAction: a => a.type === 'turn' ? board.turn(a.move, true) : a.type === 'roll' ? board.roll(a.towards) : guide.back(),
  })
})
onBeforeUnmount(() => detach?.())
</script>

<template>
  <div class="app">
    <header class="nav">
      <a class="back" href="./?proto">Prototypes</a>
      <nav v-if="variant" class="tabs">
        <a v-for="(_, k) in VARIANTS" :key="k" :href="`./?proto=${k}`" :class="{ on: k === pick }">{{ k.toUpperCase() }}</a>
      </nav>
      <button v-if="variant" class="reset" @click="guide.goTo(0)">Restart</button>
    </header>

    <template v-if="variant">
      <component :is="variant.view" :board="board" :guide="guide" />
    </template>

    <section v-else class="index">
      <h1>Guided steps</h1>
      <p>Three throwaway takes on helping the player follow a routine, all on the same puzzle: one middle layer edge to put in.</p>
      <a v-for="(v, k) in VARIANTS" :key="k" class="pick" :href="`./?proto=${k}`">
        <b>{{ k.toUpperCase() }} · {{ v.name }}</b>
        <span>{{ v.blurb }}</span>
      </a>
      <a class="pick plain" href="./">Back to the app</a>
    </section>
  </div>
</template>

<style scoped>
.app { height: 100%; touch-action: none; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; padding-inline: 16px; padding-block-end: calc(12px + env(safe-area-inset-bottom, 0px)); }
.nav { display: flex; align-items: center; gap: 8px; min-height: 52px; }
.nav a, .reset { color: var(--accent); text-decoration: none; font: 500 16px var(--sans); }
.reset { appearance: none; border: 0; background: none; cursor: pointer; padding: 8px 0; }
.tabs { flex: 1; display: flex; justify-content: center; gap: 4px; }
.tabs a { width: 36px; height: 32px; display: grid; place-items: center; border-radius: 9px; font: 700 15px var(--round); }
.tabs a.on { background: var(--accent); color: #fff; }
.index { display: grid; gap: 10px; overflow: auto; touch-action: pan-y; }
.index h1 { margin: 0; font-size: 26px; }
.index p { margin: 0 0 6px; color: var(--muted); }
.pick { display: grid; gap: 4px; padding: 14px 16px; border-radius: 14px; background: var(--card); color: var(--fg); text-decoration: none; }
.pick span { color: var(--muted); font-size: 15px; }
.pick.plain { background: none; color: var(--accent); }
</style>
