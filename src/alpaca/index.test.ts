import { fetchTokenUSDPricesBySymbols, getSupportedUSDSymbols } from ".";

describe('🦙', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('has supported symbol list', async () => {
    const supportedSymbols = getSupportedUSDSymbols()
    expect(supportedSymbols).toMatchSnapshot()
  }, 10000);

  it('is not case sensitive', async () => {
    const [ibALPACA] = await fetchTokenUSDPricesBySymbols(['IBaLPaCa'])
    expect(ibALPACA.address).toBe('0xf1bE8ecC990cBcb90e166b71E368299f0116d421')
    expect(parseFloat(ibALPACA.busdPrice)).toBeDefined()
  }, 10000);

  it('can get ibALPACA price', async () => {
    const [ibALPACA] = await fetchTokenUSDPricesBySymbols(['ibALPACA'])

    expect(ibALPACA.address).toBe('0xf1bE8ecC990cBcb90e166b71E368299f0116d421')
    expect(parseFloat(ibALPACA.busdPrice)).toBeDefined()
  }, 10000);

  it('can get ALPACA price', async () => {
    const [ALPACA] = await fetchTokenUSDPricesBySymbols(['ALPACA'])

    expect(ALPACA.address).toBe('0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F')
    expect(parseFloat(ALPACA.busdPrice)).toBeDefined()
  }, 10000);

  it('can get ALPACA, ibALPACA price', async () => {
    const [ALPACA, ibALPACA] = await fetchTokenUSDPricesBySymbols(['ALPACA', 'ibALPACA'])

    expect(ALPACA.address).toBe('0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F')
    expect(ibALPACA.address).toBe('0xf1bE8ecC990cBcb90e166b71E368299f0116d421')

    expect(parseFloat(ALPACA.busdPrice)).toBeGreaterThan(0)
    expect(parseFloat(ibALPACA.busdPrice)).toBeGreaterThan(0)
    expect(parseFloat(ibALPACA.busdPrice)).toBeGreaterThan(parseFloat(ALPACA.busdPrice))
  }, 10000);
})
