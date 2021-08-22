import { getAccountTransactions } from ".";
import { filterVaults, parseVaultInput } from "../alpaca";
import mockedTxList from './__snapshots__/0x8155430e4860e791aeddb43e4764d15de7e0def1.json'

describe('🐈 User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get all account transactions.', async () => {
    const txList = await getAccountTransactions('0x8155430e4860e791aeddb43e4764d15de7e0def1')

    expect(txList).toBeDefined()
  });

  it('can get all alpaca related transactions.', async () => {
    const txList = filterVaults(mockedTxList.result)
    console.log('txList:', txList)

    const inputs = txList.map(tx => parseVaultInput(tx.input))

    expect(inputs).toBeDefined()
  });
})
