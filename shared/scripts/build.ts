import fs, { readdir } from 'node:fs/promises'
import { copyDirectory, copyFile } from 'bun-copy-plugin'
import type { Dirent } from 'node:fs'

async function build() {
    await copyDirectory('./contracts', 'dist/contracts')
    await copyDirectory('./features', 'dist/features')
    await copyDirectory('./libs', 'dist/libs')
    await copyDirectory('./shared/config', 'dist/shared/config')
    await copyFile('README_package.md', 'dist/README.md')

    const files: readonly Dirent[] = await readdir('.', { withFileTypes: true })

    for (const file of files) {
        if (file.isFile()) {
            if (['package.json', 'README.md', 'README_package.md'].indexOf(file.name) > -1) {
                continue
            }
            await copyFile(file.name, `dist/${file.name}`)
        }
    }
}

async function processPackageJson() {
    const gv: Record<string, any> = await Bun.readableStreamToJSON(Bun.spawn(['gitversion']).stdout)
    const packageData = await Bun.file('package.json').json()
    const packageDist = {
        name: packageData.name,
        version: `${gv.SemVer}-${gv.ShortSha}`,
        scripts: ['hardhat:test', 'cucumber:hardhat', 'test'].reduce((acc: Record<string, any>, key) => {
            acc[key] = packageData.scripts[key]
            return acc
        }, {}),
        dependencies: packageData.dependencies,
    }

    await fs.writeFile('dist/package.json', JSON.stringify(packageDist, null, 4))
    await copyDirectory('./node_modules', 'dist/node_modules')
    await shell(['bun', 'install'], 'dist')
    await fs.rm('dist/node_modules', { recursive: true, force: true })
}

async function prepare() {
    await processPackageJson()
}

async function clear() {
    await fs.rm('dist', { recursive: true, force: true })
}

async function shell(args: string[], cwd?: string) {
    await new Response(Bun.spawn(args, { stdout: 'inherit', cwd }).stdout).arrayBuffer()
}

const main = async () => {
    await clear()
    await build()
    await prepare()
    await shell(['ls', '-la', 'dist'])
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
