<h2 align="center">
o0th/action-check-version
</h2>

This github action check in the current pr if `version` field in `package.json`
or `build.zig.zon` was updated and increased according to sem versioning.

### Usage

```yaml
name: check-version 

on:
  pull_request:
    branches:
      - master 

permissions:
  contents: write
  pull-requests: write

jobs:

  check-version:
    runs-on: ubuntu-latest

    steps:

      - name: Check-version
        uses: o0th/action-check-version@v0.0.5
```

### Options

**Comments**

The action by default will comment the pr in case the version from `base` is
smaller than the one in `head`. To disable use

```yaml
      - name: Check-version
        uses: o0th/action-check-version@v0.0.5
        with:
          comment: false
```

When comments are disable there's no need to have

```yaml
permissions:
  pull-requests: write
```

**comment-same** and **comment-smaller**

When commenting the action will use the default template. To set a custom
one use

```yaml
      - name: Check-version
        uses: o0th/action-check-version@v0.0.5
        with:
          comment-same: |
            Version in `{{file}}` from `{{headBranch}}`
            https://github.com/{{owner}}/{{repo}}/blob/{{headSha}}/{{file}}#L{{headLine}}
            is the same as the one in `{{baseBranch}}`
            https://github.com/{{owner}}/{{repo}}/blob/{{baseSha}}/{{file}}#L{{baseLine}}
          comment-smaller: |
            Version in `{{file}}` from `{{headBranch}}`
            https://github.com/{{owner}}/{{repo}}/blob/{{headSha}}/{{file}}#L{{headLine}}
            is smaller then the one in `{{baseBranch}}`
            https://github.com/{{owner}}/{{repo}}/blob/{{baseSha}}/{{file}}#L{{baseLine}}
```

The github action use mustache to render this variables for the comments

| variable       | description                                          |
|----------------|------------------------------------------------------|
| `{{file}}`     | `package.json` or `build.zig.zon`                    |
| `{{owner}}`    | Repository owner                                     |
| `{{repo}}`     | Repository name                                      |
| `{{headSha}}`  | Commit sha from head                                 |
| `{{headLine}}` | Line number where version field is located from head |
| `{{baseSha}}`  | Commit sha from base                                 |
| `{{baseLine}}` | Line number where version field is located from base |
