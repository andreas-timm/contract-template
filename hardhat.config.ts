import '@nomicfoundation/hardhat-viem'
import type { HardhatUserConfig } from 'hardhat/config'
import { register } from 'tsconfig-paths'
register()
import { getConfig } from '@shared/config'

const config = getConfig()

let hardhatConfig: HardhatUserConfig = {
    solidity: '0.8.23',
    defaultNetwork: 'hardhat',
    networks: {
    },
}

if (config.account) {
    hardhatConfig.networks!.ganache = {
        url: 'http://127.0.0.1:8545',
        accounts: {mnemonic: config.account.chain.ganache.mnemonic},
    }
}

// noinspection JSUnusedGlobalSymbols
export default hardhatConfig
