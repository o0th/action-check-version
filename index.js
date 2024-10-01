import fs from 'node:fs'
import path from 'node:path'

import core from '@actions/core'

const regexes = {
  'package.json': /"version": "(?<version>\d.\d.\d)"/,
  'build.zig.zon': /.version = "(?<version>\d.\d.\d)"/
}

const files = fs.readdirSync(path.join('current'));
const file = files.find((file) => regexes.hasOwnProperty(file))

if (!file) {
  core.error(`Couldn't find any supported file'`)
  process.exit(1)
}

const currentContent = fs.readFileSync(path.join('current', file), 'utf8')
const currentMatches = currentContent.match(regexes[file])

if (!currentMatches.groups.version) {
  core.error(`Couldn't find version in ${file}`)
  process.exit(1)
}

const currentVersion = currentMatches.groups.version.split('.')

const masterContent = fs.readFileSync(path.join('master', file), 'utf8')
const masterMatches = masterContent.match(regexes[file])

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
  core.error(`${currentVersion.join('.')} = ${masterVersion.join('.')}`)
  core.summary.addHeading('Check version', '2')
  core.summary.addRaw('Current version is the same as the one in master')
  core.summary.addEOL()
  core.summary.write()
  process.exit(1)
}
