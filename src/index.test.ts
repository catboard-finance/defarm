import { fetchLendsBySymbols } from "./alpaca";
import { fetchFarmsWithAPRBySymbols, fetchFarmUserDataAsync, fetchTokenUSDPricesBySymbols, getSupportedUSDSymbols } from "./pancakeswap";
import { farmsConfig } from "./pancakeswap/config/constants";
import { farmsSymbolMap } from "./pancakeswap/config/constants/mapper";
import tokens from "./pancakeswap/config/constants/tokens";

describe('🍰🦙 global data', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('has supported symbol list', async () => {
    const supportedSymbols = getSupportedUSDSymbols()
    expect(supportedSymbols).toMatchSnapshot()
  });

  it('can get CAKE price', async () => {
    const [cake] = await fetchTokenUSDPricesBySymbols(['CAKE'])

    expect(cake.address).toMatchSnapshot()
    expect(parseFloat(cake.busdPrice)).toBeGreaterThan(1)
  }, 10000);

  it('can get ALPACA, ETH, BNB prices', async () => {
    const [alpaca, eth, bnb] = await fetchTokenUSDPricesBySymbols(['ALPACA', 'ETH', 'BNB'])
    // console.log(alpaca, eth, bnb)

    expect(alpaca.symbol).toEqual(tokens.alpaca.symbol)
    expect(alpaca.address).toEqual(tokens.alpaca.address[56])
    expect(parseFloat(alpaca.busdPrice)).toBeGreaterThan(0)

    expect(eth.symbol).toEqual(tokens.eth.symbol)
    expect(eth.address).toEqual(tokens.eth.address[56])
    expect(parseFloat(eth.busdPrice)).toBeGreaterThan(0)

    expect(bnb.symbol).toEqual(tokens.bnb.symbol)
    expect(bnb.address).toEqual(tokens.wbnb.address[56])
    expect(parseFloat(bnb.busdPrice)).toBeGreaterThan(0)
  }, 10000);

  it('can get ALPACA price', async () => {
    const [alpaca] = await fetchLendsBySymbols(['ALPACA'])

    expect(parseFloat(alpaca.outputToken.busdPrice)).toBeGreaterThan(0)
    expect(parseFloat(alpaca.ibTokenPrice)).toBeGreaterThan(0)
  }, 10000);

  it('can get CAKE-BNB LP info', async () => {
    const [cake_bnb] = await fetchFarmsWithAPRBySymbols(['CAKE-BNB LP'])

    expect(cake_bnb.lpSymbol).toEqual('CAKE-BNB LP')
    expect(cake_bnb.lpAddresses[56]).toEqual(farmsSymbolMap['CAKE-BNB LP'].lpAddresses[56])
    expect(parseFloat(cake_bnb.cakeRewardsApr)).toBeGreaterThan(0)
    expect(parseFloat(cake_bnb.lpRewardsApr)).toBeGreaterThan(0)
    expect(parseFloat(cake_bnb.mintRate)).toBeGreaterThan(0)
  }, 10000);

  it('can return null for unknown price', async () => {
    const [alpaca, not_exist] = await fetchTokenUSDPricesBySymbols(['ALPACA', 'NOT_EXIST'])

    expect(not_exist.symbol).toEqual('NOT_EXIST')
    expect(not_exist.address).toBeNull()
    expect(not_exist.busdPrice).toBeNull()

    expect(alpaca.symbol).toEqual(tokens.alpaca.symbol)
    expect(alpaca.address).toEqual(tokens.alpaca.address[56])
    expect(parseFloat(alpaca.busdPrice)).toBeGreaterThan(0)
  }, 10000);
})

describe('🍰 account data', () => {
  it('can get account data', async () => {
    const account = "0xE462f59392C5b2754283162A665bb4d6Ff5033ab"
    const pid = farmsConfig[0].pid
    const accountData = await fetchFarmUserDataAsync(farmsConfig, { account, pids: [pid] })

    expect(accountData).toEqual([
      {
        pid: 0,
        allowance: '0',
        tokenBalance: '0',
        stakedBalance: '0',
        earnings: '0'
      }
    ])
  }, 10000)
});
