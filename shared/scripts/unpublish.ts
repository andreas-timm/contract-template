const name = Bun.argv[2]
const version = Bun.argv[3]

const otp = Bun.spawnSync(['oathtool', '--totp', '-b', Bun.env.TOTP_SEED!]).stdout.toString()
const command = ['npm', 'unpublish', '--otp', otp, `${name}@${version}`]

const p = Bun.spawnSync(command, { env: Bun.env, cwd: 'dist' })

console.log(p.stdout.toString())
console.log(p.stderr.toString())
