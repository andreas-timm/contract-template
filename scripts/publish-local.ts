const shell = (args: string[], cwd?: string) => {
    const proc = Bun.spawnSync(args, {env: Bun.env, cwd})
    console.log(proc.stdout.toString())
    console.error(proc.stderr.toString())
}

shell(['bun', 'run', 'build'])
shell(['npm', 'unpublish', '--force', '--registry', 'http://localhost:4873'], 'dist')
shell(['npm', 'publish', '--registry', 'http://localhost:4873'], 'dist')
