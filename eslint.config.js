import ycs77, { GLOB_SRC } from '@ycs77/eslint-config'

export default ycs77({
  typescript: true,
})
  .append({
    files: [GLOB_SRC],
    rules: {
      'no-console': 'off',
    },
  })
