import { describe, it, expect } from 'vitest'
import { md5 } from '../src/runtime/utils/md5'

describe('md5', () => {
    // Known-answer vectors from RFC 1321. useLaravelIndex uses this hash to
    // decide whether sort/search/filter changed, so a regression here silently
    // breaks automatic reloading rather than throwing.
    it.each([
        ['', 'd41d8cd98f00b204e9800998ecf8427e'],
        ['a', '0cc175b9c0f1b6a831c399e269772661'],
        ['abc', '900150983cd24fb0d6963f7d28e17f72'],
        ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
        ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
        [
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
            'd174ab98d277d9f5a5611c2c9f419d9f',
        ],
        [
            '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
            '57edf4a22be3c955ac49da2e2107b67a',
        ],
    ])('hashes %j', (input, expected) => {
        expect(md5(input)).toBe(expected)
    })

    it('hashes the JSON payload shape useLaravelIndex actually passes', () => {
        const payload = JSON.stringify({
            sort: '-created_at',
            search: 'john',
            filter: { name: { $containsi: 'mar' } },
        })

        expect(md5(payload)).toHaveLength(32)
        expect(md5(payload)).toBe(md5(payload))
        expect(md5(payload)).not.toBe(md5(payload + ' '))
    })
})
