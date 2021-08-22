import { getAccountTransactions, getAccountTransfers } from ".";
import { filterVaults } from "../alpaca";
import mocked_transfers from './__snapshots__/transfers.json'

const ACCOUNT = '0x8155430e4860e791aeddb43e4764d15de7e0def1'

describe('🐈 User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get all account transactions.', async () => {
    const txList = await getAccountTransactions(ACCOUNT)
    expect(txList).toBeDefined()
  });

  it('can get all account transfers.', async () => {
    const txList = await getAccountTransfers(ACCOUNT)
    expect(txList).toBeDefined()
  });

  it('can get all alpaca vault related transfers.', async () => {
    const txList = filterVaults(mocked_transfers)
    console.log(txList)
    expect(txList).toBeDefined()
  });
})
