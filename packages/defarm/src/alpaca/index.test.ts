import { fetchTokenUSDPricesBySymbols, getSupportedUSDSymbols } from ".";

describe('🦙', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('has supported symbol list', async () => {
    const supportedSymbols = getSupportedUSDSymbols()
    expect(supportedSymbols).toEqual([
      'ibWBNB', 'ibBUSD', 'ibETH', 'ibALPACA', 'ibUSDT', 'ibBTCB', 'ibTUSD'
    ])
  });

  it('can get ibALPACA price', async () => {
    const [ibALPACA] = await fetchTokenUSDPricesBySymbols(['ibALPACA'])

    expect(parseFloat(ibALPACA.busdPrice)).toBeDefined()
  });

  it('can get ALPACA price', async () => {
    const [ALPACA] = await fetchTokenUSDPricesBySymbols(['ALPACA'])

    expect(parseFloat(ALPACA.busdPrice)).toBeDefined()
  });

  it('can get ALPACA, ibALPACA price', async () => {
    const [ALPACA, ibALPACA] = await fetchTokenUSDPricesBySymbols(['ALPACA', 'ibALPACA'])

    expect(parseFloat(ALPACA.busdPrice)).toBeDefined()
    expect(parseFloat(ibALPACA.busdPrice)).toBeDefined()
    expect(parseFloat(ibALPACA.busdPrice)).toBeGreaterThan(parseFloat(ALPACA.busdPrice))
  });
})
