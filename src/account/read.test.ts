import { fetchAccountBalance } from './read'
import { WhiteListChain } from './type'

const BSC_TEST_ACCOUNT_ADDRESS = '0x00cF4aCe6Fb30B0834225c7ae7C5F336EB8DE268'
const SOLANA_TEST_ACCOUNT_ADDRESS = 'FAehHPoVJ8Zi5pEZyn5xTJEYMSbTxRRcTsWupLM9LtNH'

describe('User', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it(`can fetch bsc account balance value`, async () => {
    const balances = await fetchAccountBalance(WhiteListChain.bsc, BSC_TEST_ACCOUNT_ADDRESS)
    expect(balances).toBeDefined
  }, 10000)

  it(`can fetch solana account balance value`, async () => {
    const balances = await fetchAccountBalance(WhiteListChain.solana, SOLANA_TEST_ACCOUNT_ADDRESS)
    expect(balances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: expect.any(String),
          address: expect.any(String),
          amount: expect.any(Number)
        })
      ])
    )
  }, 10000)
})
