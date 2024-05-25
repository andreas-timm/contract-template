import type {IWorkspace} from '../types';

export class Erc {
    constructor(private workspace: IWorkspace) {}

    async approve(account: number, alias: string, spender: `0x${string}`, value: bigint) {
        // await this.workspace.write(account, alias, 'approve', [spender, value])
    }
}
