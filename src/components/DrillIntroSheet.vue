<script setup lang="ts">
// How the drill works: shown before its first puzzle, and later from "Steps".
import { MAX_LEVEL, usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { drillTitle, levelName, plural } from '../text'
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
        <li><span v-if="drill.level < 4">{{ drill.level === 1 ? 'One petal is' : `${drill.level} petals are` }} still missing. It can be done in {{ plural(drill.par ?? 0, 'turn') }}.</span>
          <span v-else>The cube is fully scrambled. It can be done in {{ plural(drill.par ?? 0, 'turn') }}.</span></li>
        <li><span>Turning the yellow face moves the petals round without losing them. Turn it first to keep a petal out of the way of the next one.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'cross' && drill.level < MAX_LEVEL.cross" class="steps">
        <li><span>Move the white petals from round the yellow centre to the <b>lid</b>, each on the side of its own colour. That is the white cross.</span></li>
        <li><span>Each petal has a second colour, on the side next to it. Turn the <b>yellow face</b> until that colour is next to the centre of the same colour.</span></li>
        <li><span>Turn that side <b>twice</b>. The petal drops onto the lid.</span></li>
        <li><span>{{ drill.level === 1 ? 'One petal is' : `${drill.level} petals are` }} still to drop. The routine takes {{ plural(drill.par ?? 0, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'cross'" class="steps">
        <li><span>Make the <b>white cross</b>: the four white edges on the lid, round the white centre, each on the side of its own colour.</span></li>
        <li><span>First make the lily: bring the white edges round the yellow centre.</span></li>
        <li><span>Each petal has a second colour, on the side next to it. Turn the <b>yellow face</b> until that colour is next to the centre of the same colour.</span></li>
        <li><span>Turn that side <b>twice</b>. The petal drops onto the lid.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'corners'" class="steps">
        <li v-if="drill.level < MAX_LEVEL.corners"><span>Put the four <b>white corners</b> in the middle face, between the white edges, each matching the two sides next to it. That finishes the white face.</span></li>
        <li v-else><span>Make the <b>white face</b>: first the lily, then the cross, then the four white corners, each matching the two sides next to it.</span></li>
        <li><span>Turn the <b>lid</b> until a white corner is on the outer edge, at the same corner of the board as its slot: the corner of the middle face between the sides of its two colours.</span></li>
        <li><span>Then four turns: a side at that corner, the lid, the side back, the lid back. Repeat them until the corner is in, white in the middle. It takes one, three or five goes.</span></li>
        <li><span>A white corner stuck in the middle face in the wrong place: the four turns once at its corner lift it out.</span></li>
        <li v-if="drill.level < MAX_LEVEL.corners"><span>{{ drill.level === 1 ? 'One corner is' : `${drill.level} corners are` }} still to place. The routine takes {{ plural(drill.par ?? 0, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board, and shows which side.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'middle'" class="steps">
        <li v-if="drill.level < MAX_LEVEL.middle"><span>Put the four edges with no yellow into the <b>middle row</b> of the sides, each between the two sides of its colours. The white face stays done, on the lid.</span></li>
        <li v-else><span>Make the <b>first two layers</b>: the white face first (lily, cross, corners), then the four edges with no yellow into the middle row, each between the two sides of its colours.</span></li>
        <li><span>Find an edge on the yellow face with no yellow on it. Turn the <b>yellow face</b> until its colour on the side matches that side's centre.</span></li>
        <li><span>Its other colour says where it goes: the middle row, towards the side of that colour, left or right. Eight turns put it in: four with that side, then four with the side it is on.</span></li>
        <li><span>An edge stuck in the middle row in the wrong place, or the wrong way round: the eight turns there push it out onto the yellow face.</span></li>
        <li v-if="drill.level < MAX_LEVEL.middle"><span>{{ drill.level === 1 ? 'One edge is' : `${drill.level} edges are` }} still to place. The routine takes {{ plural(drill.par ?? 0, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else-if="drill.kind === 'yellow'" class="steps">
        <li><span>Turn the four <b>yellow edges</b> so their yellow is on the yellow face, round the centre. That is the yellow cross. The corners don't matter, and neither do the edges' other colours. The first two layers stay done.</span></li>
        <li><span>The yellow edges already on the yellow face make a <b>dot</b> (none), an <b>L</b> (two next to each other) or a <b>line</b> (two across). Each go of the six turns takes a dot to an L, an L to a line and a line to the cross.</span></li>
        <li><span>Pick the side to work from. For a line: a side it runs alongside. For an L: the side with one arm opposite it and the other on its left. For a dot: any side. Left and right are as seen from that side, looking across the yellow face.</span></li>
        <li><span>Six turns: that side, the side to its right, the yellow face, the right side back, the yellow face back, then that side back.</span></li>
        <li><span>{{ drill.level < MAX_LEVEL.yellow ? `The yellow edges start as ${levelName('yellow', drill.level)}.` : 'The yellow edges can start in any shape.' }} The routine takes {{ plural(drill.par ?? 0, 'turn') }}.</span></li>
        <li><span>Stuck? <b>Hint</b> draws the next turn on the board.</span></li>
      </ol>
      <ol v-else class="steps">
        <li><span>The cube was turned <b>{{ plural(drill.level, 'time') }}</b> from solved. Turn it back.</span></li>
        <li><span>Each of your turns can cancel one of them, so {{ plural(drill.level, 'turn') }} is the shortest way. Taking more is fine.</span></li>
        <li><span>A wrong turn is just one more to undo. You can't get stuck.</span></li>
        <li><span>Stuck anyway? <b>Hint</b> draws the next turn on the board.</span></li>
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
