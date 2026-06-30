import { createServer } from 'vite'
import { defineOnespecConfig, type OnespecConfigOptions } from './onespec-config'

export async function createOnespecDevServer(options: OnespecConfigOptions) {
  const config = defineOnespecConfig(options)
  return createServer(config)
}
