import CAC from 'cac'
import { hello } from '../core'

const cli = CAC('gh-list')

cli
  .command('')
  .action(() => {
    cli.outputHelp()
  })

cli
  .command('hello')
  .action(() => {
    console.log(hello())
  })

cli.help()

cli.parse()
