interface ChainCollection {
    maticmum: Chain
    ganache: Chain
}

export type ChainCollectionKeys = keyof ChainCollection

export type ContractChain = ChainCollectionKeys | 'scrollSepolia'

interface Chain {
    rpc?: string[]
    transportProvider?: string
}

interface Account {
    name: string
    key?: `0x${string}`
    address?: `0x${string}`
    mnemonic?: string
    entropyPlain?: string
}

interface AccountCollection {
    // group: Record<string, Account[]>
    chain: Record<string, Account>
}

interface ConfigParameters {
    added: string[]
    gsm?: {
        project: string
        secret: string
    }
}

// interface Cache {
//     basePath: string
//     ttl: Record<string, number>
// }

type DeployedDataPath = {
    default: string
    chain: Partial<Record<ContractChain, string>>
}

interface ContractConfig {
    deployed_config_path: DeployedDataPath
    abi?: Record<string, string[]>
    deployed?: Record<string, Partial<Record<ContractChain, `0x${string}`>>>
}

export interface Config {
    debug: boolean
    config: ConfigParameters
    contract: ContractConfig
    chain: ChainCollection
    account?: AccountCollection
    // args: Args
    // test: Test
    // cache: Cache
}
