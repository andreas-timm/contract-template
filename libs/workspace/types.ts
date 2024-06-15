import type {
    Abi,
    GetContractReturnType,
    ReadContractReturnType,
    WalletClient,
    WriteContractReturnType,
} from 'viem'
// import { ConfigOptions } from '@shared/config'
import type { PublicClient as HardhatPublicClient } from '@nomicfoundation/hardhat-viem/types'

export type WalletClients = { initial: WalletClient[]; named: Record<string, WalletClient> }

export type State = {
    value: Record<string, Record<`0x${string}`, bigint>>
    nftAmount: Record<string, Record<`0x${string}`, bigint>>
}

export type ContractData = {
    abi: Abi
    address: `0x${string}`
}

export type WorldHardhat = {
    publicClient: HardhatPublicClient
    chainName: string
}

export type IWorkspace = {
    init: (/*options?: ConfigOptions*/) => void
    deploy: (name: number | string, account: string, alias: string, args: any[]) => Promise<ContractData>
    read: (
        contract: GetContractReturnType,
        functionName: string,
        args: any[],
    ) => Promise<ReadContractReturnType>
    write: (
        walletClient: WalletClient,
        contract: GetContractReturnType,
        functionName: string,
        args: any[],
        value: bigint,
    ) => Promise<WriteContractReturnType>
    toUint32Discretion: (value: number) => number
    getAddress: (alias: string | number) => `0x${string}`
    getAccountAddress: (index: number) => `0x${string}`
    createStruct: <T>(type: new (...args: any[]) => T, args: any[]) => T
}
