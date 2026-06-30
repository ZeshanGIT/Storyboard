declare module '@onespec-dev/shell/vite' {
  import type { ViteDevServer } from 'vite'

  export type OnespecConfigOptions = {
    root: string
    port?: number
    onespecDir?: string
  }

  export function createOnespecDevServer(options: OnespecConfigOptions): Promise<ViteDevServer>

  export function defineOnespecConfig(options: OnespecConfigOptions): import('vite').UserConfig
}
