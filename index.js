import mustache from 'mustache'
import core from '@actions/core'
import github from '@actions/github'

const token = core.getInput('token');
const octokit = github.getOctokit(token)

const repository = core.getInput('repository')
const [owner, repo] = repository.split('/')

const currentSha = github.context.sha
const currentBranch = github.context.ref
console.log(github.context.payload)

const baseSha = core.getInput('base-sha')
const baseBranch = core.getInput('base-branch')

const comment = core.getInput('comment')
const commentSame = core.getInput('comment-same')
const commentSmaller = core.getInput('comment-smaller')

const regexes = {
  'package.json': /"version": "(?<version>\d.\d.\d)"/,
  'build.zig.zon': /.version = "(?<version>\d.\d.\d)"/
}

const getFiles = async (octokit, owner, repo, ref) => {
  const request = await octokit.rest.repos.getContent({
    owner, repo, ref
  })

  return request.data.map((item) => item.name)
}

const getFile = async (octokit, owner, repo, ref, path) => {
  const request = await octokit.rest.repos.getContent({
    owner, repo, ref, path
  })

  return atob(request.data.content)
}

const matchFile = (files, regexes) => {
  return files.find((file) => regexes.hasOwnProperty(file))
}

const getLine = (content, regex) => {
  return content.split('\n').reduce((accumulator, value, index) => {
    const match = value.match(regex)
    return match?.groups?.version
      ? [index, match.groups.version]
      : accumulator
  }, [])
}

const compare = (a, b) => {
  if (a.startsWith(b + "-")) return -1
  if (b.startsWith(a + "-")) return 1
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "case",
    caseFirst: "upper"
  })
}

const files = await getFiles(octokit, owner, repo, currentSha)
const file = matchFile(files, regexes)

if (!file) {
  core.error(`Couldn't find any supported file'`)
  process.exit(1)
}

const currentContent = await getFile(octokit, owner, repo, currentSha, file)
const [currentLine, currentVersion] = getLine(currentContent, regexes[file])

if (!currentVersion) {
  core.error(`Couldn't find version in ${file}`)
  process.exit(1)
}

const baseContent = await getFile(octokit, owner, repo, baseSha, file)
const [baseLine, baseVersion] = getLine(baseContent, regexes[file])

if (!baseVersion) {
  core.error(`Couldn't find version in ${file}`)
  process.exit(1)
}

const compareResult = compare(currentVersion, baseVersion)

if (compareResult === 0) {
  if (comment) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: github.context.payload.pull_request.number,
      body: mustache.render(commentSame, {
        owner,
        repo,
        file,
        currentSha,
        currentLine,
        currentBranch,
        baseSha,
        baseLine,
        baseBranch
      })
    })
  }

  core.setFailed(`Same version`)
  process.exit(1)
}

if (compareResult > 0) {
  if (comment) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: github.context.payload.pull_request.number,
      body: mustache.render(commentSmaller, {
        owner,
        repo,
        file,
        currentSha,
        currentLine,
        currentBranch,
        baseSha,
        baseLine,
        baseBranch
      })
    })
  }
}
