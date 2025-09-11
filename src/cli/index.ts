import { log, outro, spinner, text } from '@clack/prompts'
import cac from 'cac'
import { GHList } from '../core'

interface CliOptions {
  user?: string
  cookie?: string
  debug?: boolean
  desc?: string
  list?: string
}

const cli = cac('gh-list')

cli
  .command('')
  .action(() => {
    cli.outputHelp()
  })

cli.option('--user <username>', 'GitHub username')
cli.option('--cookie <cookie>', 'GitHub cookie')
cli.option('--debug', 'Enable debug mode')

cli
  .command('list:create [name]', 'Create a new list')
  .option('--desc <description>', 'List description')
  .action(async (name: string | undefined, options: CliOptions) => {
    name = await prepareListNameAndArgs(name, options, true)

    const ghList = await prepareGhList(options)

    const s = spinner()
    s.start('List creating...')
    try {
      await ghList.create(name, options.desc)
    } catch (error) {
      s.stop('Failed to create list!')
      log.error((error as Error).message)
      process.exit(1)
    }
    s.stop('List created!')

    outro('Done!')
  })

cli
  .command('list:delete [name]', 'Delete a list')
  .action(async (name: string | undefined, options: CliOptions) => {
    name = await prepareListNameAndArgs(name, options)

    const ghList = await prepareGhList(options)

    const s = spinner()
    s.start('List deleting...')
    try {
      await ghList.delete(name)
    } catch (error) {
      s.stop('Failed to delete list!')
      log.error((error as Error).message)
      process.exit(1)
    }
    s.stop('List deleted!')

    outro('Done!')
  })

cli
  .command('repo:add [repo]', 'Add repo to a list')
  .option('--list <list>', 'List name')
  .action(async (repo: string | undefined, options: CliOptions) => {
    repo = await prepareRepoNameAndArgs(repo, options)

    const ghList = await prepareGhList(options)

    const s = spinner()
    s.start('Adding repo to list...')
    try {
      await ghList.addRepo(repo, options.list!)
    } catch (error) {
      s.stop('Failed to add repo to list!')
      log.error((error as Error).message)
      process.exit(1)
    }
    s.stop('Repo added to list!')

    outro('Done!')
  })

cli
  .command('repo:remove [repo]', 'Remove repo from a list')
  .option('--list <list>', 'List name')
  .action(async (repo: string | undefined, options: CliOptions) => {
    repo = await prepareRepoNameAndArgs(repo, options)

    const ghList = await prepareGhList(options)

    const s = spinner()
    s.start('Removing repo from list...')
    try {
      await ghList.removeRepo(repo, options.list!)
    } catch (error) {
      s.stop('Failed to remove repo from list!')
      log.error((error as Error).message)
      process.exit(1)
    }
    s.stop('Repo removed from list!')

    outro('Done!')
  })

cli.help()

cli.parse()

async function prepareGhList(options: CliOptions) {
  if (!options.user) {
    const input = await text({
      message: 'Enter your GitHub username:',
      validate(value) {
        if (value.length === 0) return 'Username cannot be empty'
      },
    })
    if (typeof input === 'string') {
      options.user = input
    } else {
      log.error('Username is required!')
      process.exit(1)
    }
  }

  if (!options.cookie) {
    const input = await text({
      message: 'Enter your GitHub cookie:',
      validate(value) {
        if (value.length === 0) return 'Cookie cannot be empty'
      },
    })
    if (typeof input === 'string') {
      options.cookie = input
    } else {
      log.error('Cookie is required!')
      process.exit(1)
    }
  }

  const ghList = new GHList(options.user, options.cookie, options.debug)
  return ghList
}

async function prepareListNameAndArgs(name: string | undefined, options: CliOptions, withDesc = false): Promise<string> {
  if (!name) {
    let input = await text({
      message: 'Enter the name of the new list:',
      validate(value) {
        if (value.length === 0) return 'List name cannot be empty'
      },
    })
    if (typeof input === 'string') {
      name = input
    } else {
      log.error('List name is required!')
      process.exit(1)
    }

    if (withDesc) {
      input = await text({
        message: 'Enter the description of the new list (optional):',
      })
      if (typeof input === 'string') {
        options.desc = input
      }
    }
  }

  return name
}

async function prepareRepoNameAndArgs(name: string | undefined, options: CliOptions): Promise<string> {
  if (!name) {
    let input = await text({
      message: 'Enter the repo name of the format "owner/repo":',
      validate(value) {
        if (value.length === 0) return 'Repo name cannot be empty'
      },
    })
    if (typeof input === 'string') {
      name = input
    } else {
      log.error('Repo name is required!')
      process.exit(1)
    }

    input = await text({
      message: 'Enter the list name:',
      validate(value) {
        if (value.length === 0) return 'List name cannot be empty'
      },
    })
    if (typeof input === 'string') {
      options.list = input
    }
  }

  if (!options.list) {
    log.error('List name is required!')
    process.exit(1)
  }

  return name
}
