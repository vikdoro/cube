<script setup lang="ts">
// How the drill works: shown before its first puzzle, and later from "Steps".
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillTitle, plural } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, nextPuzzle, retry, resetToSolved } = usePractice()

function startOver() {
  retry()
  sheets.close()
}
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'intro'" :title="drill ? drillTitle(drill) : ''" @close="sheets.close">
    <template v-if="drill">
      <ol v-if="drill.kind === 'lily'" class="steps">
        <li><span>Bring the four <b>white edges</b> round the <b>yellow centre</b>, white facing the same way as the yellow. That is the lily. The corners don't matter.</span></li>
        <li><span>The cube is fully scrambled. It can be done in {{ plural(drill.par, 'turn') }}.</span></li>
        <li><span>Turning the yellow face moves the petals round without losing them. Turn it first to keep a petal out of the way of the next one.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'cross'" class="steps">
        <li><span>Move the white petals from round the yellow centre to the <b>lid</b>, each on the side of its own colour. That is the white cross.</span></li>
        <li><span>Each petal has a second colour, on the side next to it. Turn the <b>yellow face</b> until that colour is next to the centre of the same colour.</span></li>
        <li><span>Turn that side <b>twice</b>. The petal drops onto the lid.</span></li>
        <li><span>The lily is made. The routine takes {{ plural(drill.par, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'corners'" class="steps">
        <li><span>Put the four <b>white corners</b> in the middle face, between the white edges, each matching the two sides next to it. That finishes the white face.</span></li>
        <li><span>Turn the <b>lid</b> until a white corner is on the outer edge, at the same corner of the board as its slot: the corner of the middle face between the sides of its two colours.</span></li>
        <li><span>Then four turns: a side at that corner, the lid, the side back, the lid back. Repeat them until the corner is in, white in the middle. It takes one, three or five goes.</span></li>
        <li><span>A white corner stuck in the middle face in the wrong place: the four turns once at its corner lift it out.</span></li>
        <li><span>The white cross is made. The routine takes {{ plural(drill.par, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board, and shows which side.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'middle'" class="steps">
        <li><span>Put the four edges with no yellow into the <b>middle row</b> of the sides, each between the two sides of its colours. The white face stays done, on the lid.</span></li>
        <li><span>Find an edge on the yellow face with no yellow on it. Turn the <b>yellow face</b> until its colour on the side matches that side's centre.</span></li>
        <li><span>Its other colour says where it goes: the middle row, towards the side of that colour, left or right. Eight turns put it in: four with that side, then four with the side it is on.</span></li>
        <li><span>An edge stuck in the middle row in the wrong place, or the wrong way round: the eight turns there push it out onto the yellow face.</span></li>
        <li><span>The white face is made. The routine takes {{ plural(drill.par, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'yellow'" class="steps">
        <li><span>Turn the four <b>yellow edges</b> so their yellow is on the yellow face, round the centre. That is the yellow cross. The corners don't matter, and neither do the edges' other colours. The first two layers stay done.</span></li>
        <li><span>The yellow edges already on the yellow face make a <b>dot</b> (none), an <b>L</b> (two next to each other) or a <b>line</b> (two across). Each go of the six turns takes a dot to an L, an L to a line and a line to the cross.</span></li>
        <li><span>Pick the side to work from. For a line: a side it runs alongside. For an L: the side with one arm opposite it and the other on its left. For a dot: any side. Left and right are as seen from that side, looking across the yellow face.</span></li>
        <li><span>Six turns: that side, the side to its right, the yellow face, the right side back, the yellow face back, then that side back.</span></li>
        <li><span>The yellow edges can start in any shape. The routine takes {{ plural(drill.par, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else class="steps">
        <li><span>Swap the four <b>yellow edges</b> round until each one's other colour matches the centre of its side. The yellow cross stays made, and the corners don't matter yet.</span></li>
        <li><span>Turn the <b>yellow face</b> until two edges match their sides. If all four match, you're done.</span></li>
        <li><span>Two <b>side by side</b>: work from the side with one of them opposite it and the other on its right. Two <b>across</b>: work from any side, then turn yellow to find a pair side by side and go again. Left and right are as seen from that side, looking across the yellow face.</span></li>
        <li><span>Nine turns: the side to its right, the yellow face, the right side back, the yellow face, the right side, the yellow face twice, the right side back, then the yellow face.</span></li>
        <li><span>The edges can start in any order. The routine takes {{ plural(drill.par, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <div class="actions">
        <button class="btn primary big" autofocus @click="sheets.close">{{ sheets.introMidway.value ? 'Continue' : 'Start' }}</button>
        <template v-if="sheets.introMidway.value">
          <div class="split">
            <button class="btn" :disabled="drill.done" @click="startOver">Start over</button>
            <button class="btn" @click="nextPuzzle">New puzzle</button>
          </div>
          <button class="btn plain" @click="resetToSolved">Stop practising</button>
        </template>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
.steps { margin: 0; padding: 0; list-style: none; counter-reset: step; display: grid; gap: 12px; }
.steps li { counter-increment: step; display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: start; }
.steps li::before { content: counter(step); width: 28px; height: 28px; border-radius: 50%; background: var(--fill); color: var(--accent); display: grid; place-items: center; font: 700 14px var(--round); }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
