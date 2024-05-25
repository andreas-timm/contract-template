import {type Account, createPublicClient, createWalletClient, custom, defineChain} from 'viem'
import type {
    PublicClient as HardhatPublicClient,
    WalletClient as HardhatWalletClient,
} from '@nomicfoundation/hardhat-viem/types'

export class ViemAdapter {
    constructor(
        public hardhatPublicClient: HardhatPublicClient | undefined = undefined,
        public hardhatWalletClient: HardhatWalletClient | undefined = undefined,
    ) {

    }

    private getHardhatPublicClient(client?: HardhatPublicClient) {
        if (client !== undefined) {
            return client
        }
        if (this.hardhatPublicClient !== undefined) {
            return this.hardhatPublicClient
        }
        throw new Error('No hardhat public client available')
    }

    private getHardhatWalletClient(client?: HardhatWalletClient) {
        if (client !== undefined) {
            return client
        }
        if (this.hardhatWalletClient !== undefined) {
            return this.hardhatWalletClient
        }
        throw new Error('No hardhat wallet client available')
    }

    private getHardhatPublicOrWalletClient(client?: HardhatPublicClient | HardhatWalletClient) {
        if (client !== undefined) {
            return client
        }
        if (this.hardhatPublicClient !== undefined) {
            return this.hardhatPublicClient
        }
        if (this.hardhatWalletClient !== undefined) {
            return this.hardhatWalletClient
        }
        throw new Error('No hardhat public or wallet client available')
    }

    getTransport(client?: HardhatPublicClient | HardhatWalletClient) {
        client = this.getHardhatPublicOrWalletClient(client)
        return custom({
            key: client.transport.key,
            name: client.transport.name,
            retryCount: client.transport.retryCount,
            retryDelay: client.transport.retryDelay,
            timeout: client.transport.timeout,
            request: client.request,
        })
    }

    getChain(client?: HardhatPublicClient | HardhatWalletClient) {
        client = this.getHardhatPublicOrWalletClient(client)
        return defineChain({
            id: client.chain.id,
            name: client.chain.name,
            nativeCurrency: client.chain.nativeCurrency,
            rpcUrls: client.chain.rpcUrls,
        })
    }

    getPublicClient(client?: HardhatPublicClient) {
        client = this.getHardhatPublicClient(client)
        return createPublicClient({
            transport: this.getTransport(client),
            chain: this.getChain(client),
        })
    }

    getWalletClient(client?: HardhatWalletClient) {
        client = this.getHardhatWalletClient(client)
        return createWalletClient({
            account: client.account as Account,
            chain: this.getChain(client),
            transport: this.getTransport(client),
        })
    }
}
