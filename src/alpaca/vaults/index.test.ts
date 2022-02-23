import { filterRelated } from '.'
import { _fetchUserPositionWithAPIs } from '../api'
import { parseVaultInput } from './worker'
import mockedTransactions from './__snapshots__/transactions.json'
import mocked_transfers from '../../lib/moralis/__snapshots__/transfers.json'

const TEST_ACCOUNT_ADDRESS = '0x8155430e4860e791aeddb43e4764d15de7e0def1'

describe('🦙 Vault', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('can get all alpaca vault related transfers.', async () => {
    const res = filterRelated([TEST_ACCOUNT_ADDRESS], mocked_transfers['result'])
    expect(res).toBeDefined()
  })

  it('can get positions', async () => {
    const positions = await _fetchUserPositionWithAPIs(TEST_ACCOUNT_ADDRESS)

    expect(positions).toBeDefined()
  }, 100000)

  it('can get parseVaultInput', async () => {
    let res = mockedTransactions.result
      .map((e) => {
        if (e.from_address !== TEST_ACCOUNT_ADDRESS && e.to_address !== TEST_ACCOUNT_ADDRESS) return null

        return {
          ...parseVaultInput(e.input),
          from_address: e.from_address,
          to_address: e.to_address,
          block_timestamp: e.block_timestamp,
          block_number: e.block_number
        }
      })
      .filter((e) => e)

    expect(res).toBeDefined()
  }, 100000)
})
