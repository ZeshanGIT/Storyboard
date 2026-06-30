declare module '@onespec-dev/shell/vite' {
  import type { ViteDevServer } from 'vite'

  export type StoryboardConfigOptions = {
    root: string
    port?: number
    storyboardDir?: string
  }

  export function createStoryboardDevServer(
    options: StoryboardConfigOptions,
  ): Promise<ViteDevServer>

  export function defineStoryboardConfig(
    options: StoryboardConfigOptions,
  ): import('vite').UserConfig
}
