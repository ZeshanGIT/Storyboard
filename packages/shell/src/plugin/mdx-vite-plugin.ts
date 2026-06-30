import mdx from '@mdx-js/rollup'
import type { Plugin } from 'vite'

type MdxOptions = NonNullable<Parameters<typeof mdx>[0]>

/** MDX rollup plugin with `?raw` imports left to Vite's raw loader. */
export function mdxVitePlugin(options: MdxOptions = {}): Plugin {
  const plugin = mdx(options)
  const transform = plugin.transform?.bind(plugin)

  return {
    ...plugin,
    async transform(code, id) {
      if (id.includes('?raw')) return null
      return transform?.(code, id)
    },
  }
}
