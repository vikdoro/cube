import { shallowRef } from 'vue'

/** The bottom sheets: everything that explains or chooses slides up over the board. One is open at a time. */
export type SheetName = 'help' | 'course' | 'intro' | 'done'

const current = shallowRef<SheetName | null>(null)
/** The intro sheet was opened from a drill in progress ("Steps"), not before its first puzzle. */
const introMidway = shallowRef(false)

export function useSheets() {
  return {
    current,
    introMidway,
    open: (name: SheetName) => { current.value = name },
    openIntro: (midway: boolean) => { introMidway.value = midway; current.value = 'intro' },
    close: () => { current.value = null },
  }
}
