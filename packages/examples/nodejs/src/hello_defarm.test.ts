import { fetchALPACA, fetchCAKEBNB, fetchCAKE } from "./hello_defarm";

describe('feeders/chain', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get ALPACA price', async () => {
    const results = await fetchALPACA()
    expect(results[0].ibTokenPrice).toBeDefined()
  });

  it('can get CAKE-BNB LP info', async () => {
    const results = await fetchCAKEBNB()
    const result0 = results[0]

    expect(result0.lpSymbol).toEqual('CAKE-BNB LP')
    expect(parseFloat(result0.apr)).toBeGreaterThan(0)
  });

  it('can get CAKE price', async () => {
    const results = await fetchCAKE()
    const result0 = results[0]

    expect(parseFloat(result0)).toBeGreaterThan(1)
  });
})
