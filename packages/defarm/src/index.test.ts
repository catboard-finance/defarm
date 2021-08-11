import { fetchLendsBySymbols } from "./alpaca";
import { fetchFarmsWithAPRBySymbols, fetchTokenUSDPricesBySymbols } from "./pancakeswap";

describe('🍰🦙', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get ALPACA price', async () => {
    const results = await fetchLendsBySymbols(['ALPACA'])
    const result0 = results[0]

    expect(parseFloat(result0.outputToken.busdPrice)).toBeGreaterThan(0)
    expect(parseFloat(result0.ibTokenPrice)).toBeGreaterThan(0)
  });

  it('can get CAKE-BNB LP info', async () => {
    const results = await fetchFarmsWithAPRBySymbols(['CAKE-BNB LP'])
    const result0 = results[0]

    expect(result0.lpSymbol).toEqual('CAKE-BNB LP')
    expect(parseFloat(result0.apr)).toBeGreaterThan(0)
  });

  it('can get CAKE price', async () => {
    const results = await fetchTokenUSDPricesBySymbols(['CAKE'])
    const result0 = results[0]

    expect(parseFloat(result0)).toBeGreaterThan(1)
  });
})
