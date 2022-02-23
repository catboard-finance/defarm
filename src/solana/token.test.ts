import { getSolanaSymbolInfoByAddress } from './tokens'

describe('token test', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('can get token info from address', async () => {
    const token = getSolanaSymbolInfoByAddress('So11111111111111111111111111111111111111112')
    expect(token).toMatchObject({
      address: 'So11111111111111111111111111111111111111112',
      chainId: 101,
      decimals: 9,
      extensions: {
        coingeckoId: 'solana',
        serumV3Usdc: '9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT',
        serumV3Usdt: 'HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1',
        website: 'https://solana.com/'
      },
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
      name: 'Wrapped SOL',
      symbol: 'SOL'
    })
  })
})
