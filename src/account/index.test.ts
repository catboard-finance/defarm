import { getTransactions, getTransfers } from ".";
import { filterVaults } from "../alpaca";
import mocked_transfers from './__snapshots__/transfers.json'

const TEST_ACCOUNT_ADDRESS = '0x8155430e4860e791aeddb43e4764d15de7e0def1'

describe('🐈 User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get all account transactions.', async () => {
    const txList = await getTransactions(TEST_ACCOUNT_ADDRESS)
    expect(txList).toBeDefined()
  });

  it('can get all account transfers.', async () => {
    const txList = await getTransfers(TEST_ACCOUNT_ADDRESS)
    expect(txList).toBeDefined()
  });

  it('can get all alpaca vault related transfers.', async () => {
    const txList = filterVaults(mocked_transfers)
    expect(txList).toBeDefined()
  });
})