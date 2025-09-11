import { GHList } from '../src/core'
import 'dotenv/config'

const USERNAME = process.env.GH_USERNAME || ''
const COOKIE = process.env.GH_COOKIE || ''

if (!USERNAME || !COOKIE) {
  console.error('Please set GH_USERNAME and GH_COOKIE environment variables.')
  process.exit(1)
}

async function main() {
  const ghList = new GHList(USERNAME, COOKIE, true)

  const lists = await ghList.all()
  console.log('Lists:', lists)

  await ghList.create('My New List', 'This is a description for my new list.')
  console.log('List created')

  await ghList.addRepo('octocat/Hello-World', 'My New List')
  console.log('Repo added to list')

  await ghList.removeRepo('octocat/Hello-World', 'My New List')
  console.log('Repo removed from list')

  await ghList.delete('My New List')
  console.log('List deleted')
}

main()
