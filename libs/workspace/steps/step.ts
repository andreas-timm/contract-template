import { /*before,*/ binding, given /*, then, when*/ } from 'cucumber-tsflow'
import '@nomicfoundation/hardhat-viem'
import { Workspace } from '../index'
// import type { WalletClients } from '@libs/workspace/types.ts'
// import { parseEther } from 'viem'

@binding([Workspace])
export class Step {
    constructor(protected workspace: Workspace) {}

    @given('init')
    async init() {
        await this.workspace.init()
    }

    @given('{int}: deployed {word} as {word}')
    async deployed(account: number, name: string, alias: string) {
        return await this.workspace.deploy(account, name, alias)
    }

    @given('{int}: saved deployed {word} as {word}')
    async savedDeployed(account: number, name: string, alias: string) {
        let contractData = this.workspace.getContract(alias)
        if (!contractData) {
            contractData = await this.workspace.deploy(account, name, alias)
            await this.workspace.saveDeployed(alias, contractData.address)
        }
        // console.log('contractData', contractData.address)
    }

    // @given('{int}: deployed {word} bytecode as {word}')
    // async deployedBytecode(account: number, name: string, alias: string) {
    //     await this.workspace.deploy(account, name, alias)
    // }

    // @given('{int}: deployed erc20 {word}\\({word},{word}) as {word}')
    // async deployedErc20(account: number, name: string, ercName: string, ercSymbol: string, alias: string) {
    //     await this.workspace.deploy(name, account, alias, [ercName, ercSymbol])
    // }
    //
    // @given('{int}: deployed nft {word} as {word}')
    // async deployedNft(account: number, name: string, alias: string) {
    //     await this.workspace.deploy(name, account, alias, [''])
    // }
    //
    // @given('{int}: grant role {word} for {word} to {word}')
    // async grantRole(account: number, role: string, roleAccount: string, alias: string) {
    //     await this.workspace.grantRole(account, role, roleAccount, alias)
    // }
    //
    // @given('{int}: mint {word} token {int} with amount {int}')
    // async mint(account: number, alias: string, token: number, amount: number) {
    //     await this.workspace.nft.mint(account, alias, token, amount)
    // }
    //
    // @given('{int}: set pool nft amount as {word}')
    // async setPoolNftAmount(account: number, alias: string) {
    //     await this.workspace.escrow.setPoolNftAmount(account, alias)
    // }
    //
    // @given('{int}: set pool nft range as {word}')
    // async setPoolNftRange(account: number, alias: string) {
    //     await this.workspace.escrow.setPoolNftRange(account, alias)
    // }
    //
    // @then('{int}: approve {word} to {word}')
    // async approveForAll(account: number, alias: string, to: string) {
    //     await this.workspace.nft.approveForAll(account, alias, to)
    // }
    //
    // @when('save value state of {} as {word}')
    // async saveValueState(addresses: string, state: string) {
    //     await this.workspace.saveValueState(state, addresses)
    // }
    //
    // @when('save nft amount state of {word} token {int} by {} as {word}')
    // async saveNftAmountState(alias: string, token: string, addresses: string, state: string) {
    //     await this.workspace.saveNftAmountState(state, alias, token, addresses)
    // }
    //
    // @then('value state {word} diff by {word} is {}Ξ')
    // async checkValueStateDiff(state: string, addressAlias: string, diff: string) {
    //     const diffValue = this.workspace.calcValue(diff)
    //     const address = this.workspace.getAddress(addressAlias)
    //     const balance = await this.workspace.getBalanceByAlias(addressAlias)
    //     this.workspace.closeToRate(parseEther(diffValue), balance - this.workspace.state.value[state][address])
    // }
    //
    // @then('nft amount {word} token {int} state {word} diff by {word} is {int}')
    // async checkNftAmountStateDiff(
    //     alias: string,
    //     token: number,
    //     state: string,
    //     address: string,
    //     diff: number,
    // ) {
    //     const parsedAddress = this.workspace.parseAddresses(address)[0]
    //     const amount = await this.workspace.getNftAmount(alias, token, parsedAddress)
    //     this.workspace.expect(BigInt(diff)).to.equal(amount - this.workspace.state.nftAmount[state][parsedAddress])
    // }
}
