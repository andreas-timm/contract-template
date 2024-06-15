import { binding, given } from 'cucumber-tsflow'
import '@nomicfoundation/hardhat-viem'
import { Workspace } from '@libs/workspace'

@binding([Workspace])
export class Test {
    constructor(private workspace: Workspace) {}

    @given('test')
    async test() {
        await this.workspace.init()
        console.log('test')
    }
}
