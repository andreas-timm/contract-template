import keccak from 'keccak'
import { Keccak } from 'keccak'

export function getKeccak(value: string): `0x${string}` {
    const keccakData: Keccak = keccak('keccak256', {}).update(value)
    return `0x${keccakData.digest('hex')}`
}

export function getNamespace(name: string): `0x${string}` {
    return name === '0x00' ? `0x${'0'.repeat(64)}` : getKeccak(name)
}

export function getRoleId(name: string): `0x${string}` {
    return ['DEFAULT_ADMIN_ROLE', 'admins'].indexOf(name) > -1 ? `0x${'0'.repeat(64)}` : getKeccak(name)
}
