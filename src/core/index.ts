import type { FetchResponse, MappedResponseType, ResponseType } from 'ofetch'
import { ofetch } from 'ofetch'

export class GHList {
  HOST = 'https://github.com'
  CSRF_TOKEN_PATTERN = /<input type="hidden" name="authenticity_token" value="(.+?)" autocomplete="off" \/>/
  REPO_ID_PATTERN = /<input type="hidden" name="repository_id" value="(\d+)">/
  GH_LIST_LIMIT = 32

  username: string
  cookie: string
  debug: boolean

  constructor(username: string, cookie: string, debug = false) {
    this.username = username
    this.cookie = cookie
    this.debug = debug
  }

  async all(raw = false): Promise<string[]> {
    const { mapping } = await this.#getListsPageData(undefined, raw)

    return Object.keys(mapping)
  }

  async create(name: string, description?: string): Promise<boolean> {
    const lists = await this.all()
    if (lists.length >= this.GH_LIST_LIMIT) {
      console.error(`GitHub limit reached, can't create more than ${this.GH_LIST_LIMIT} lists`)
      return false
    }

    if (lists.includes(this.#preprocessString(name))) {
      console.log(`List "${name}" already exists`)
      return true
    }

    const html = await this.#get<string, 'text'>(`/${this.username}?tab=stars`)
    const token = this.#searchCsrfTokenBefore(html, 'Create a list to organize your starred repositories.')
    if (!token) {
      throw new Error('Failed to get CSRF token')
    }

    const res = await this.#post<string, 'text'>(`/stars/${this.username}/lists`, {
      authenticity_token: token,
      'user_list[name]': name,
      'user_list[description]': description || '',
    })
    return res.ok
  }

  async delete(list: string): Promise<boolean> {
    list = this.#preprocessString(list)

    const html = await this.#get<string, 'text'>(`/stars/${this.username}/lists/${list}`)

    const token = this.#searchCsrfTokenBefore(html, '<button type="submit" data-view-component="true" class="btn-danger btn">')
    if (!token) {
      throw new Error(`Failed to get CSRF token, list "${list}" may not exist`)
    }

    const res = await this.#post<string, 'text'>(`/stars/${this.username}/lists/${list}`, {
      _method: 'delete',
      authenticity_token: token,
    })
    return res.ok
  }

  addRepo(repo: string, list: string): Promise<boolean> {
    return this.#repoToList(repo, list)
  }

  removeRepo(repo: string, list: string): Promise<boolean> {
    return this.#repoToList(repo, list, false)
  }

  #debug(...args: any[]): void {
    if (this.debug) {
      console.log('[gh-list]', ...args)
    }
  }

  #get<T = any, R extends ResponseType = 'json'>(path: string): Promise<MappedResponseType<R, T>> {
    this.#debug('GET', path)
    return ofetch<T, R>(`${this.HOST}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Cookie: this.cookie,
      },
    })
  }

  #post<T = any, R extends ResponseType = 'json'>(path: string, data: Record<string, any>): Promise<FetchResponse<MappedResponseType<R, T>>> {
    this.#debug('POST', path, data)
    return ofetch.raw<T, R>(`${this.HOST}${path}`, {
      method: 'POST',
      body: new URLSearchParams(data),
      credentials: 'include',
      headers: {
        Cookie: this.cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.71 Safari/537.36',
        Accept: 'text/html, application/json',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: 'https://github.com',
        Referer: 'https://github.com/octocat/Hello-World',
      },
    })
  }

  #preprocessString(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/[^\w\s\p{Unified_Ideograph}]/gu, ' ') // replace special chars with space
      .toLowerCase().trim() // lower case and remove leading/trailing spaces
      .replace(/\s+/g, ' ') // combine multiple spaces into one
      .replace(/ /g, '-') // replace space with dash
  }

  #searchCsrfTokenBefore(html: string, searchStr: string): string | undefined {
    const index = html.indexOf(searchStr)
    if (index !== -1) {
      html = html.slice(0, index)
    }

    const matches = html.match(this.CSRF_TOKEN_PATTERN)
    return matches?.[1]
  }

  async #getListsPageData(repo = 'octocat/Hello-World', raw = false): Promise<{
    mapping: Record<string, string>
    csrfToken: string
    repoId: string
  }> {
    const mapping: Record<string, string> = {}

    const html = await this.#get<string, 'text'>(`/${repo}/lists`)

    // list
    const pattern = `<input
                    type="checkbox"
                    class="mx-0 js-user-list-menu-item"
                    name="list_ids\\[\\]"
                    value="(\\d+)"
                    (?:checked)?
                  >
                  <span data-view-component="true" class="Truncate ml-2 text-normal f5">
    <span data-view-component="true" class="Truncate-text">(.+?)</span>`

    const listMatches = html.matchAll(new RegExp(pattern, 'g'))

    for (const match of listMatches) {
      const listId = match[1]
      const listName = raw ? match[2] : this.#preprocessString(match[2])
      mapping[listName] = listId
    }

    // csrf token
    const tokenMatches = html.match(this.CSRF_TOKEN_PATTERN)
    const csrfToken = tokenMatches?.[1]
    if (!csrfToken) {
      throw new Error('Failed to get CSRF token')
    }

    // repo id
    const repoIdMatches = html.match(this.REPO_ID_PATTERN)
    const repoId = repoIdMatches?.[1]
    if (!repoId) {
      throw new Error(`Repository "${repo}" does not exist`)
    }

    return { mapping, csrfToken, repoId }
  }

  async #repoToList(repo: string, list: string, add = true): Promise<boolean> {
    const { mapping, csrfToken, repoId } = await this.#getListsPageData(repo)

    list = this.#preprocessString(list)
    if (!(list in mapping)) {
      throw new Error(`List "${list}" does not exist, available lists: ${Object.keys(mapping).join(', ')}`)
    }

    const listId = mapping[list]

    const res = await this.#post<string, 'text'>(`/${repo}/lists`, {
      _method: 'put',
      authenticity_token: csrfToken,
      repository_id: repoId,
      context: 'user_list_menu',
      'list_ids[]': add ? listId : '',
    })
    return res.ok
  }
}
