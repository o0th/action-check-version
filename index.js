import fs from 'node:fs'
import path from 'node:path'

import core from '@actions/core'
import github from '@actions/github'

const token = core.getInput('token');
const octokit = github.getOctokit(token)

const repository = core.getInput('repository')
const [owner, repo] = repository.split('/')

const currentSha = core.getInput('current-sha')
const currentBranch = core.getInput('current-branch')

const baseSha = core.getInput('base-sha')
const baseBranch = core.getInput('base-branch')

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

const files = await getFiles(octokit, owner, repo, currentSha)
const file = files.find((file) => regexes.hasOwnProperty(file))

if (!file) {
  core.error(`Couldn't find any supported file'`)
  process.exit(1)
}

const currentContent = await getFiles(octokit, owner, repo, currentSha)
console.log(currentContent)
const currentMatches = currentContent.match(regexes[file])
const currentLine = currentContent.split(/\r?\n/)
  .findIndex((line) => line.match(regexes[file])) + 1

if (!currentMatches.groups.version) {
  core.error(`Couldn't find version in ${file}`)
  process.exit(1)
}

const currentVersion = currentMatches.groups.version.split('.')

const masterContent = await getFile(octokit, owner, repo, baseSha, file)
const masterMatches = masterContent.match(regexes[file])
const masterLine = currentContent.split(/\r?\n/)
  .findIndex((line) => line.match(regexes[file])) + 1

if (!masterMatches.groups.version) {
  core.error(`Couldn't find version in ${file}`)
  process.exit(1)
}

const masterVersion = masterMatches.groups.version.split('.')

if (currentVersion[0] > masterVersion[0]) {
  process.exit(0)
} else if (currentVersion[0] < masterVersion[0]) {
  core.error(`${currentVersion.join('.')} < ${masterVersion.join('.')}`)
  process.exit(1)
}

if (currentVersion[1] > masterVersion[1]) {
  process.exit(0)
} else if (currentVersion[1] < masterVersion[1]) {
  core.error(`${currentVersion.join('.')} < ${masterVersion.join('.')}`)
  process.exit(1)
}

if (currentVersion[2] > masterVersion[2]) {
  process.exit(0)
} else {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: github.context.payload.pull_request.number,
    body: `Version in \`${file}\` from \`${currentBranch}\`\n` +
      `https://github.com/${owner}/${repo}/blob/${currentSha}/${file}#L${currentLine}\n` +
      `is the same as in \`${baseBranch}\`\n` +
      `https://github.com/${owner}/${repo}/blob/${baseSha}/${file}#L${masterLine}\n`
  })

  core.error(`${currentVersion.join('.')} = ${masterVersion.join('.')}`)
  core.setFailed(`Same version`)
}
