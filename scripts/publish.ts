const otp = Bun.spawnSync(['oathtool', '--totp', '-b', Bun.env.TOTP_SEED!]).stdout.toString()

const publishProc = Bun.spawnSync(['npm', 'publish', '--access', 'restricted', '--otp', otp], {
    env: Bun.env,
    cwd: 'dist',
})

console.log(publishProc.stdout.toString())
console.error(publishProc.stderr.toString())
