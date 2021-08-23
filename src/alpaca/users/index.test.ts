import { fetchUserPositions, fetchUserLends, fetchUserStakes } from ".";

describe('User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it(`can fetch user position value`, async () => {
    const account = '0x83F4A1B5E1c662C749939575C39CA37e5B08822B'
    const positionValues = await fetchUserPositions(account)
    // console.log('positionValues:', positionValues)

    expect(positionValues).toBeDefined
  }, 10000);

  it(`can fetch balance from lend`, async () => {
    const account = '0x8155430e4860e791aeddb43e4764d15de7e0def1'
    const lends = await fetchUserLends(account)
    // console.log('lends:', lends)

    expect(lends).toBeDefined
  }, 10000)

  it(`can fetch user info from stake`, async () => {
    const account = '0x8155430e4860e791aeddb43e4764d15de7e0def1'
    const stakes = await fetchUserStakes(account)
    // console.log('stakes:', stakes)

    expect(stakes).toBeDefined
  }, 10000)
})
