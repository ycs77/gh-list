# gh-list

gh-list is the Node.js version of [Github Starred List](https://github.com/haile01/github-starred-list).

A low-effort attempt to automate categorizing starred repositories on GitHub because the REST API isn't going to do that anytime soon.

## Installation

```bash
npm install -g gh-list
```

## Usage

Initialize with your GitHub username and the cookie header grabbed from `https://github.com/<username>?tab=stars`.

*Note: The cookie will only last for 2 weeks.*

```bash
gh-list list:create listname --desc "sample" --user "gh_username" --cookie "cookie_str"

gh-list list:delete listname --user "gh_username" --cookie "cookie_str"

gh-list repo:add owner/repo --list "listname" --user "gh_username" --cookie "cookie_str"

gh-list repo:remove owner/repo --list "listname" --user "gh_username" --cookie "cookie_str
```

For more information, run `gh-list --help`.

## Credits

This package is inspired by [Github Starred List](https://github.com/haile01/github-starred-list) and rewritten from it.

## License

Under the [MIT LICENSE](LICENSE.md)
