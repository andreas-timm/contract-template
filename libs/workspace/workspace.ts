import hre from 'hardhat'
// import type { PublicClient as HardhatPublicClient } from '@nomicfoundation/hardhat-viem/types'
import { Nft } from './contract/nft'
import { Erc } from './contract/erc'
import type { ContractData, IWorkspace, State, WalletClients, WorldHardhat } from './types'
import keccak from 'keccak'
import { Keccak } from 'keccak'
import { type DataTable } from '@cucumber/cucumber'
import { Parser } from 'expr-eval'
import chai from 'chai'
import chaiString from 'chai-string'
import chaiBn from 'chai-bn'
import BN from 'bn.js'
import '@nomicfoundation/hardhat-viem/internal/type-extensions'
import { ViemAdapter } from './utils/viemAdapter'
import {
    type Abi,
    parseEther,
    type GetContractReturnType,
    createWalletClient,
    type PublicClient,
    type WalletClient,
    zeroAddress,
    type Account,
    getContract,
    sha256,
    type Chain,
} from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { entropyToMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
chai.use(chaiString)
chai.use(chaiBn(BN))
import { getConfig, Config } from '@libs/config'
import fs from 'fs'
import yaml from 'js-yaml'
// import SourceMap from 'js-yaml-source-map'
import { ContractChain } from '@libs/config/types'

export const UINT32_DISCRETION: number = 4294967295

class World {
    walletClients: WalletClients = { initial: [], named: {} }
    state: State = { value: {}, nftAmount: {} }
    deployed: Record<string, ContractData> = {}
    hardhat: WorldHardhat = {} as WorldHardhat
    publicClient!: PublicClient
    viemAdapter!: ViemAdapter
    chain!: Chain
    nft!: Nft
    erc!: Erc

    save() {}
    load() {}
}

const world = new World()

export class Workspace implements IWorkspace {
    config: Config

    constructor() {
        this.config = getConfig()
    }

    async init() {
        world.hardhat.publicClient = await hre.viem.getPublicClient()
        world.hardhat.chainName = hre.hardhatArguments.network as string
        const walletClients = await hre.viem.getWalletClients()
        world.viemAdapter = new ViemAdapter(world.hardhat.publicClient, walletClients[0])
        world.publicClient = world.viemAdapter.getPublicClient()
        world.chain = world.publicClient.chain!
        world.walletClients.initial = walletClients.map(
            (wc) => world.viemAdapter.getWalletClient(wc) as WalletClient,
        )
        world.nft = new Nft(this)
        world.erc = new Erc(this)
    }

    world() {
        return world
    }

    getWalletClient(account: number | string) {
        if (Number.isFinite(account)) {
            return world.walletClients.initial[account as number]
        }
        account = account as string
        return account.match(/^\d+$/)
            ? world.walletClients.initial[parseInt(account)]
            : world.walletClients.named[account]
    }

    getAliasAddress(alias: string) {
        return world.deployed[alias] !== undefined
            ? world.deployed[alias].address
            : this.getWalletClient(alias).account!.address
    }

    async deployBytecode(
        account: number | string,
        alias: string,
        bytecode: `0x${string}`,
        abi: Abi,
        args: any[] = [],
    ) {
        if (world.deployed[alias] !== undefined) {
            return world.deployed[alias]
        }

        const walletClient = this.getWalletClient(account)

        const hash = await walletClient.deployContract({
            account: walletClient.account as Account,
            chain: world.chain,
            bytecode,
            abi,
            args,
        })
        const transaction = await world.publicClient.waitForTransactionReceipt({ hash })

        const res = getContract({
            address: transaction.contractAddress!,
            abi,
            client: { wallet: walletClient },
        })

        return { address: res.address, abi: res.abi } as ContractData
    }

    // async deployBytecodeFromFile(account: number | string, alias: string, path: string, args: any[] = []) {
    //     if (this.deployed[alias] !== undefined) {
    //         return this.deployed[alias]
    //     }
    //
    //     const walletClient = this.getWalletClient(account)
    //
    //     const bytecode = readFileSync(path, {encoding: 'utf-8'})
    //     const artifact = JSON.parse(readFileSync(path.replace('.bin', '.json'), {encoding: 'utf-8'}))
    //     const abi = artifact.abi as Abi
    //
    //     const hash = await walletClient.deployContract({
    //         account: walletClient.account as Account,
    //         chain: this.chain,
    //         bytecode: `0x${bytecode}`,
    //         abi,
    //         args,
    //     })
    //     const transaction = await this.publicClient.waitForTransactionReceipt({ hash })
    //
    //     this.deployed[alias] = getContract({
    //         address: transaction.contractAddress!,
    //         abi,
    //         client: {wallet: walletClient},
    //     })
    //
    //     return this.deployed[alias]
    // }

    async getContractData(name: string) {
        let bytecode: `0x${string}`
        let abi = [] as Abi

        if (await hre.artifacts.artifactExists(name)) {
            const artifact = await hre.artifacts.readArtifact(name)
            bytecode = artifact.bytecode as `0x${string}`
            abi = artifact.abi as Abi
        } else {
            const rootDir = path.resolve(path.join(__dirname, '../..'))
            const bytecodePath = path.join(rootDir, `shared/bytecode/imported/${name}.bin`)
            if (!existsSync(bytecodePath)) {
                throw new Error(`Bytecode file "${bytecodePath}" not found`)
            }
            const content = readFileSync(bytecodePath).toString('hex')
            bytecode = `0x${content}`

            const abiPath = path.join(rootDir, `shared/bytecode/imported/${name}.json`)
            if (existsSync(abiPath)) {
                abi = JSON.parse(readFileSync(abiPath).toString()).abi as Abi
            }
        }

        return { bytecode, abi }
    }

    async deploy(
        account: number | string,
        name: string,
        alias: string,
        args: any[] = [],
    ): Promise<ContractData> {
        if (world.deployed[alias] !== undefined) {
            return world.deployed[alias]
        }

        const contractData = await this.getContractData(name)
        const size = contractData.bytecode.length / 2 - 1
        console.log(`ℹ️ contract deployed: ${alias}, ${size} bytes`)

        world.deployed[alias] = await this.deployBytecode(
            account,
            alias,
            contractData.bytecode,
            contractData.abi,
            args,
        )

        return world.deployed[alias]
    }

    async transfer(account: string, value: bigint, alias: string) {
        const walletClient = this.getWalletClient(account)
        await walletClient.sendTransaction({
            account: walletClient.account as Account,
            to: this.getAliasAddress(alias),
            value,
            chain: world.chain,
        })
    }

    async writeWithSimulate(
        account: number,
        alias: string,
        functionName: string,
        args: any[],
        value?: string,
    ) {
        const publicClient = await hre.viem.getPublicClient()
        const { request } = await publicClient.simulateContract({
            account: world.walletClients.initial[account].account,
            address: world.deployed[alias].address,
            abi: world.deployed[alias].abi,
            functionName,
            args,
            value: value ? parseEther(value) : undefined,
        })
        return await world.walletClients.initial[account].writeContract(request)
    }

    toUint32Discretion(value: number): number {
        return Math.round((UINT32_DISCRETION * value) / 100)
    }

    getAddress(alias: string | number) {
        if (typeof alias === 'string') {
            if (alias == '-') {
                return zeroAddress
            } else {
                return world.deployed[alias].address
            }
        } else {
            return this.getAccountAddress(alias)
        }
    }

    getAccountAddress(index: number) {
        return world.walletClients.initial[index].account!.address
    }

    createStruct<T>(type: new (...args: any[]) => T, args: any[]): T {
        return new type(...args)
    }

    getRoleId(name: string): string {
        const keccakData: Keccak = keccak('keccak256', {}).update(name)
        return name === 'DEFAULT_ADMIN_ROLE' ? `0x${'0'.repeat(64)}` : `0x${keccakData.digest('hex')}`
    }

    async grantRole(account: number | string, role: string, roleAccount: string, alias: string) {
        const walletClient = this.getWalletClient(account)
        return await this.write(
            walletClient,
            alias,
            'grantRole',
            [this.getRoleId(role), this.getAddress(roleAccount)],
            0n,
        )
    }

    public getDataArgs(): Record<string, any> {
        const table: DataTable = arguments[0]
        return table.raw().reduce(
            (acc, row) => {
                const valueParts = row[0].split(' ')
                if (valueParts.length == 1) {
                    acc[row[0]] = row[1]
                } else {
                    if (acc[valueParts[0]] == undefined) {
                        acc[valueParts[0]] = {}
                    }
                    acc[valueParts[0]][valueParts[1]] = row[1]
                }
                return acc
            },
            {} as Record<string, any>,
        )
    }

    public parseAccounts(addressesStr: string): `0x${string}`[] {
        return addressesStr.split(/\s*,\s*/).map((a) => this.getAccountAddress(parseInt(a.trim())))
    }

    public parseAddresses(addresses: string): `0x${string}`[] {
        return addresses
            .split(/\s*,\s*/)
            .map((a) => a.trim())
            .map((a) => this.getAddress(/\d+/.test(a) ? parseInt(a) : a))
    }

    async saveValueState(state: string, addresses: string) {
        world.state.value[state] = await this.parseAddresses(addresses).reduce(
            async (accPromise, address) => {
                const acc = await accPromise
                acc[address] = await world.publicClient.getBalance({ address })
                return acc
            },
            Promise.resolve(world.state.value[state] ?? {}),
        )
    }

    async getBalanceByAlias(addressAlias: string) {
        return await world.publicClient.getBalance({ address: this.getAddress(addressAlias) })
    }

    calcValue(value: string) {
        if (value.startsWith('(') && value.endsWith(')')) {
            value = value.slice(1, value.length - 1)
            value = value.replace(/\S+/g, (part) => {
                if (part.endsWith('Ξ')) {
                    part = part.slice(0, part.length - 1)
                } else if (part.endsWith('%')) {
                    part = part.slice(0, part.length - 1)
                    part = (parseFloat(part) / 100).toFixed(15)
                }
                return part
            })
            value = Parser.parse(value).evaluate().toFixed(15)
        }
        return value
    }

    expect(value: any) {
        return chai.expect(value)
    }

    closeToRate(a: bigint, b: bigint) {
        this.expect(new BN(a.toString())).to.bignumber.closeTo(b.toString(), '10000000')
    }

    getBool(value: string): boolean {
        return value.indexOf('true') >= -1
    }

    createAccount(name: string, entropyText: string) {
        const seed = sha256(new TextEncoder().encode(entropyText), 'bytes')
        const mnemonic = entropyToMnemonic(seed, wordlist)

        // noinspection UnnecessaryLocalVariableJS
        const account = createWalletClient({
            account: mnemonicToAccount(mnemonic),
            chain: world.chain,
            transport: world.viemAdapter.getTransport(),
        })

        // console.info(`ℹ️ Account created: ${name} ${account.account.address} (${entropyText}: ${mnemonic})`)

        world.walletClients.named[name] = account
        return world.walletClients.named[name]
    }

    async read(contract: string | GetContractReturnType, functionName: string, args?: any[]) {
        if (typeof contract === 'string') {
            contract = world.deployed[contract]
        }
        return await world.publicClient.readContract({
            address: contract.address,
            abi: contract.abi,
            functionName,
            args,
        })
    }

    async write(
        walletClient: WalletClient,
        contract: string | GetContractReturnType,
        functionName: string,
        args: any[],
        value: bigint,
    ) {
        if (typeof contract === 'string') {
            contract = world.deployed[contract]
        }
        return await walletClient.writeContract({
            address: contract.address,
            abi: contract.abi,
            chain: world.publicClient.chain,
            account: walletClient.account as Account,
            functionName,
            args,
            value,
        })
    }

    getContract(alias: string) {
        return world.deployed[alias]
    }

    async saveDeployed(alias: string, address: `0x${string}`) {
        const deployedDataPath =
            this.config.contract.deployed_config_path.chain[world.hardhat.chainName as ContractChain] ??
            this.config.contract.deployed_config_path.default

        let data: Record<string, any>
        if (!existsSync(deployedDataPath)) {
            data = {}
        } else {
            data = yaml.load(fs.readFileSync(deployedDataPath, 'utf-8')) as Record<string, any>
        }

        if (data.contract == undefined) {
            data.contract = {}
        }
        if (data.contract.deployed == undefined) {
            data.contract.deployed = {}
        }
        if (data.contract.deployed[alias] == undefined) {
            data.contract.deployed[alias] = {}
        }
        data.contract.deployed[alias][hre.network.name] = address

        fs.writeFileSync(deployedDataPath, yaml.dump(data))
    }
}
