import { fetchTokenUSDPricesBySymbols, getSupportedUSDSymbols } from ".";

describe('🦙', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('has supported symbol list', async () => {
    const supportedSymbols = getSupportedUSDSymbols()
    expect(supportedSymbols).toMatchSnapshot()
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
    console.log(ALPACA, ibALPACA)

    expect(parseFloat(ALPACA.busdPrice)).toBeGreaterThan(0)
    expect(parseFloat(ibALPACA.busdPrice)).toBeGreaterThan(0)
    expect(parseFloat(ibALPACA.busdPrice)).toBeGreaterThan(parseFloat(ALPACA.busdPrice))
  });
})
