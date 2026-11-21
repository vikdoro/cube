import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Where the line between the open engine and the private app falls. The engine (github:vikdoro/flatcube,
 * installed under node_modules) knows nothing about drills, practice, storage or the app; the app reaches the engine
 * only through its three entry points.
 */

const ROOT = resolve(import.meta.dirname, '..')
const ENGINE = join(ROOT, 'node_modules/flatcube')
const ENTRY_POINTS = ['flatcube', 'flatcube/board', 'flatcube/vue']

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    if (name === 'node_modules' || name === 'dist') return []
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

const sources = (dir: string) => walk(dir).filter(f => /\.(ts|vue)$/.test(f) && !f.endsWith('.test.ts'))

const importsOf = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map(m => m[1])

describe('the engine package', () => {
  it('is installed as a package with a core, a board and a vue entry point', () => {
    const pkg = JSON.parse(readFileSync(join(ENGINE, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('flatcube')
    expect(Object.keys(pkg.exports).sort()).toEqual(['.', './board', './vue'])
  })

  it('has no vue in its core or its board geometry', () => {
    const offenders = sources(join(ENGINE, 'src'))
      .filter(f => !relative(join(ENGINE, 'src'), f).startsWith('vue/'))
      .filter(f => importsOf(f).some(spec => spec === 'vue' || spec.startsWith('vue/')))
    expect(offenders.map(f => relative(ROOT, f))).toEqual([])
  })

  it('imports nothing from outside itself', () => {
    const offenders = sources(join(ENGINE, 'src')).flatMap(file =>
      importsOf(file)
        .filter(spec => spec.startsWith('.'))
        .filter(spec => !resolve(dirname(file), spec).startsWith(join(ENGINE, 'src')))
        .map(spec => `${relative(ROOT, file)} → ${spec}`))
    expect(offenders).toEqual([])
  })

  it('holds no drill, practice or app code', () => {
    const names = walk(join(ENGINE, 'src')).map(f => relative(join(ENGINE, 'src'), f))
    const private_ = /(^|\/)(drills|lily|cross|corners|middle|yellow|edges|usePractice|usePlayer|useSheets|storage|text|App)\b/
    expect(names.filter(n => private_.test(n))).toEqual([])
  })

  it('never says rubik', () => {
    const offenders = walk(ENGINE).filter(f => /rubik/i.test(readFileSync(f, 'utf8')) || /rubik/i.test(f))
    expect(offenders.map(f => relative(ROOT, f))).toEqual([])
  })
})

describe('the app', () => {
  it('has handed the engine its files', () => {
    for (const gone of ['src/cube/model.ts', 'src/cube/view.ts', 'src/cube/vec.ts', 'src/board', 'src/composables/useCube.ts', 'src/components/CubeBoard.vue']) {
      expect(existsSync(join(ROOT, gone)), gone).toBe(false)
    }
  })

  it('reaches the engine only through its entry points', () => {
    const offenders = sources(join(ROOT, 'src')).flatMap(file =>
      importsOf(file)
        .filter(spec => spec.includes('flatcube') || spec.includes('packages/'))
        .filter(spec => !ENTRY_POINTS.includes(spec))
        .map(spec => `${relative(ROOT, file)} → ${spec}`))
    expect(offenders).toEqual([])
  })

  it('does use the engine', () => {
    const users = sources(join(ROOT, 'src')).filter(f => importsOf(f).includes('flatcube'))
    expect(users.length).toBeGreaterThan(0)
  })
})
