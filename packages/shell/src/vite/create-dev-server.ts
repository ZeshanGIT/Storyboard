import { createServer } from 'vite'
import { defineStoryboardConfig, type StoryboardConfigOptions } from './storyboard-config'

export async function createStoryboardDevServer(options: StoryboardConfigOptions) {
  const config = defineStoryboardConfig(options)
  return createServer(config)
}
