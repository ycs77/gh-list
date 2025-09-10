import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      index: 'src/core/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
  },
  {
    entry: {
      cli: 'src/cli/index.ts',
    },
    dts: false,
  },
])
