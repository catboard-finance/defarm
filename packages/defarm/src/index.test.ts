import { fetchLendsBySymbols } from "./alpaca";
import { fetchFarmsWithAPRBySymbols, fetchTokenUSDPricesBySymbols } from "./pancakeswap";
import { farmsSymbolMap } from "./pancakeswap/config/constants/farms";
import tokens from "./pancakeswap/config/constants/tokens";

describe('🍰🦙', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get CAKE price', async () => {
    const [cake] = await fetchTokenUSDPricesBySymbols(['CAKE'])

    expect(cake.address).toEqual('0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82')
    expect(parseFloat(cake.busdPrice)).toBeGreaterThan(1)
  });

  it('can get ALPACA, ETH, BNB prices', async () => {
    const [alpaca, eth, bnb] = await fetchTokenUSDPricesBySymbols(['ALPACA', 'ETH', 'BNB'])

    expect(alpaca.symbol).toEqual(tokens.alpaca.symbol)
    expect(alpaca.address).toEqual(tokens.alpaca.address[56])
    expect(parseFloat(alpaca.busdPrice)).toBeGreaterThan(0)

    expect(eth.symbol).toEqual(tokens.eth.symbol)
    expect(eth.address).toEqual(tokens.eth.address[56])
    expect(parseFloat(eth.busdPrice)).toBeGreaterThan(0)

    expect(bnb.symbol).toEqual(tokens.bnb.symbol)
    expect(bnb.address).toEqual(tokens.wbnb.address[56])
    expect(parseFloat(bnb.busdPrice)).toBeGreaterThan(0)
  });

  it('can get ALPACA price', async () => {
    const [alpaca] = await fetchLendsBySymbols(['ALPACA'])

    expect(parseFloat(alpaca.outputToken.busdPrice)).toBeGreaterThan(0)
    expect(parseFloat(alpaca.ibTokenPrice)).toBeGreaterThan(0)
  });

  it('can get CAKE-BNB LP info', async () => {
    const [cake_bnb] = await fetchFarmsWithAPRBySymbols(['CAKE-BNB LP'])

    expect(cake_bnb.lpSymbol).toEqual('CAKE-BNB LP')
    expect(cake_bnb.lpAddresses[56]).toEqual(farmsSymbolMap['CAKE-BNB LP'].lpAddresses[56])
    expect(parseFloat(cake_bnb.apr)).toBeGreaterThan(0)
  });

  it('can return null for unknown price', async () => {
    const [alpaca, not_exist] = await fetchTokenUSDPricesBySymbols(['ALPACA', 'NOT_EXIST'])

    expect(not_exist.symbol).toEqual('NOT_EXIST')
    expect(not_exist.address).toBeNull()
    expect(not_exist.busdPrice).toBeNull()

    expect(alpaca.symbol).toEqual(tokens.alpaca.symbol)
    expect(alpaca.address).toEqual(tokens.alpaca.address[56])
    expect(parseFloat(alpaca.busdPrice)).toBeGreaterThan(0)
  });
})
