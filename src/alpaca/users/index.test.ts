import { fetchUserPositions, fetchUserLends, fetchUserStakes, fetchUserInvestments } from ".";

const TEST_ACCOUNT_ADDRESS = '0x8155430e4860e791aeddb43e4764d15de7e0def1'
describe('User', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  it.skip(`can fetch user position value`, async () => {
    const positions = await fetchUserPositions(TEST_ACCOUNT_ADDRESS)
    // console.log('positions:', positions)

    expect(positions).toBeDefined
  }, 10000);

  it(`can fetch balance from lend`, async () => {
    const lends = await fetchUserLends(TEST_ACCOUNT_ADDRESS)
    // console.log('lends:', lends)

    expect(lends).toBeDefined
  }, 10000)

  it(`can fetch user info from stake`, async () => {
    const stakes = await fetchUserStakes(TEST_ACCOUNT_ADDRESS)
    // console.log('stakes:', stakes)

    expect(stakes).toBeDefined
  }, 10000)

  it(`can calculate profits`, async () => {
    const profits = await fetchUserInvestments(TEST_ACCOUNT_ADDRESS)
    // console.log('profits:', profits)

    expect(profits).toBeDefined
  }, 100000);
})
