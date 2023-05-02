import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import { describe, expect, test } from 'vitest'
import MagicString from 'magic-string'
import { expandShortcut, transformAlias } from '../src'

const uno = createGenerator({
  shortcuts: [
    ['btn', 'text-(white xl) font-bold py-2 px-4 rounded cursor-pointer'],
    [/^btn-(.+)$/, ([,d]) => `bg-${d}-500 hover:bg-${d}-700 btn`],
  ],
})

function createTransformer(prefix = '*') {
  return async (code: string, _uno: UnoGenerator = uno) => {
    const s = new MagicString(code)
    await transformAlias(s, _uno, {
      prefix,
    })
    return s.toString()
  }
}

describe('transformer alias', () => {
  test('basic', async () => {
    const transform = createTransformer()

    const code = `
<template>
  <div *btn>
    <div text-xl class="*btn-red" />
    <div *btn-teal />
  </div>
</template>
    `.trim()

    expect(await transform(code)).toMatchInlineSnapshot(`
      "<template>
        <div text-white text-xl font-bold py-2 px-4 rounded cursor-pointer>
          <div text-xl class=\\"bg-red-500 hover:bg-red-700 text-white text-xl font-bold py-2 px-4 rounded cursor-pointer\\" />
          <div bg-teal-500 hover:bg-teal-700 text-white text-xl font-bold py-2 px-4 rounded cursor-pointer />
        </div>
      </template>"
    `)
  })

  test('prefix', async () => {
    const transform = createTransformer('&')

    const code = `
<template>
  <div &test-none>
    <div text-xl class="&btn-red" />
    <div *btn-red />
  </div>
</template>
    `.trim()

    expect(await transform(code)).toMatchInlineSnapshot(`
      "<template>
        <div &test-none>
          <div text-xl class=\\"bg-red-500 hover:bg-red-700 text-white text-xl font-bold py-2 px-4 rounded cursor-pointer\\" />
          <div *btn-red />
        </div>
      </template>"
    `)
  })

  test('expand shortcut', async () => {
    const code = `
    <template>
        <div class="*btn-red" />
        <div *btn-red />
    </template>
        `.trim()
    const transform = createTransformer()

    expect(await transform(code)).toMatchInlineSnapshot(`
      "<template>
              <div class=\\"bg-red-500 hover:bg-red-700 text-white text-xl font-bold py-2 px-4 rounded cursor-pointer\\" />
              <div bg-red-500 hover:bg-red-700 text-white text-xl font-bold py-2 px-4 rounded cursor-pointer />
          </template>"
    `)

    expect(await expandShortcut('btn-red', uno))
      .toMatchInlineSnapshot(`
        [
          [
            "bg-red-500",
            "hover:bg-red-700",
            "text-white",
            "text-xl",
            "font-bold",
            "py-2",
            "px-4",
            "rounded",
            "cursor-pointer",
          ],
        ]
      `)
  })
})
