import fs, { readdir } from 'node:fs/promises'
import { copyDirectory, copyFile } from 'bun-copy-plugin'
import type { Dirent } from 'node:fs'

async function build() {
    await copyDirectory('./contracts', 'dist/contracts')
    await copyDirectory('./features', 'dist/features')
    await copyDirectory('./libs', 'dist/libs')
    await copyFile('README_package.md', 'dist/README.md')
    const files: readonly Dirent[] = await readdir('.', { withFileTypes: true })
    for (const file of files) {
        if (file.isFile()) {
            if (['bun.lockb', 'package.json', 'README_package.md'].indexOf(file.name) > -1) {
                continue
            }
            await copyFile(file.name, `dist/${file.name}`)
        }
    }
}

async function processPackageJson() {
    const gv: Record<string, any> = await Bun.readableStreamToJSON(Bun.spawn(['gitversion']).stdout)

    let packageData = await Bun.file('package.json').json()
    delete packageData['files']
    delete packageData['devDependencies']
    packageData.version = `${gv.SemVer}-${gv.ShortSha}`
    packageData['scripts'] = {}
    // packageData['module'] = 'index.js'

    await fs.writeFile('dist/package.json', JSON.stringify(packageData, null, 4))
}

async function prepare() {
    await processPackageJson()
}

async function clear() {
    await fs.rm('dist', { recursive: true, force: true })
}

async function shell(args: string[]) {
    await new Response(Bun.spawn(args, { stdout: 'inherit' }).stdout).arrayBuffer()
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
