#!/usr/bin/env bun

import { existsSync } from 'node:fs'
import { parseArgs } from 'util'
import { $, ShellError, ShellOutput } from 'bun'

const { values } = parseArgs({
    args: Bun.argv,
    options: {
        source: {
            type: 'string',
            required: true,
        },
        template: {
            type: 'string',
            required: true,
        },
    },
    strict: true,
    allowPositionals: true,
})

const checks = ['libs/config/config.ts', 'libs/config/index.ts', 'libs/workspace']

let sourcePath: string
let templatePath: string
let res: ShellOutput | ShellError

for (const path of checks) {
    sourcePath = `${values.source}/${path}`
    templatePath = `${values.template}/${path}`

    if (!existsSync(sourcePath)) {
        console.log(`W: source not exists: ${sourcePath}`)
        continue
    }

    try {
        res = await $`diff -ur ${sourcePath} ${templatePath} | diffstat`.quiet()
    } catch (err: ShellError) {
        res = err
    }

    console.log(`📂 ${path}`)
    console.log(res.stdout.toString())
}
