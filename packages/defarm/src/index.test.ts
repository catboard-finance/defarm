import { fetchLendsBySymbols } from "./alpaca";
import { fetchFarmsWithAPRBySymbols, fetchTokenUSDPricesBySymbols } from "./pancakeswap";
import { farmsSymbolMap } from "./pancakeswap/config/constants/farms";

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

    expect(alpaca.address).toEqual('0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d')
    expect(parseFloat(alpaca.busdPrice)).toBeGreaterThan(0)

    expect(eth.address).toEqual('0x8f0528ce5ef7b51152a59745befdd91d97091d2f')
    expect(parseFloat(eth.busdPrice)).toBeGreaterThan(0)

    expect(bnb.address).toEqual('0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d')
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
})
