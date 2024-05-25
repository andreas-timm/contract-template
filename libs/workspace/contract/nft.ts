import type { IWorkspace } from '../types'

export class Nft {
    constructor(private workspace: IWorkspace) {}

    async mint(account: number, alias: string, token: number, amount: number) {
        // return await this.workspace.write(
        //     this.workspace.walletClients.initial[account],
        //     account, alias, 'mint', [
        //     this.workspace.getAccountAddress(account),
        //     token,
        //     amount,
        //     '',
        // ])
    }

    async approveForAll(account: number, alias: string, to: string) {
        // return await this.workspace.write(account, alias, 'setApprovalForAll', [
        //     this.workspace.deployed[to] !== undefined
        //         ? this.workspace.deployed[to].address
        //         : this.workspace.getAccountAddress(parseInt(to)),
        //     true,
        // ])
    }

    async saveNftAmountState(state: string, alias: string, token: string, addresses: string) {
        // const parsedAddresses = this.parseAddresses(addresses)
        // this.state.nftAmount[state] = (
        //     (await this.read(this.deployed[alias], 'balanceOfBatch', [
        //         parsedAddresses,
        //         new Array(parsedAddresses.length).fill(token),
        //     ])) as bigint[]
        // ).reduce((acc, amount, index) => {
        //     acc[parsedAddresses[index]] = amount
        //     return acc
        // }, this.state.nftAmount[state] ?? {})
    }

    async getNftAmount(alias: string, token: number, address: `0x${string}`) {
        // return (await this.read(this.deployed[alias], 'balanceOf', [address, token])) as bigint
    }
}
