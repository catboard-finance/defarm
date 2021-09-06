import { fetchUserPositions, fetchUserLends, fetchUserStakes, fetchUserInvestments, fetchUserBalance, fetchUserInvestmentSummary, fetchUserFarmEarns } from ".";

const TEST_ACCOUNT_ADDRESS = '0x8155430e4860e791aeddb43e4764d15de7e0def1'
describe('User', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  it(`can fetch user balance value`, async () => {
    const balances = await fetchUserBalance(TEST_ACCOUNT_ADDRESS)
    console.log('balances:', balances)
    expect(balances).toBeDefined
  }, 10000);

  it(`can fetch user position value`, async () => {
    const positions = await fetchUserPositions(TEST_ACCOUNT_ADDRESS)
    // console.log('positions:', positions)

    expect(positions).toBeDefined
  }, 10000);

  it(`can fetch balance from lends`, async () => {
    const lends = await fetchUserLends(TEST_ACCOUNT_ADDRESS)
    // console.log('lends:', lends)

    expect(lends).toBeDefined
  }, 10000)

  it(`can fetch user info from stakes`, async () => {
    const stakes = await fetchUserStakes(TEST_ACCOUNT_ADDRESS)
    // console.log('stakes:', stakes)

    expect(stakes).toBeDefined
  }, 10000)

  it(`can fetch user earn from pools`, async () => {
    const earns = await fetchUserFarmEarns(TEST_ACCOUNT_ADDRESS)
    // console.log('earns:', earns)

    expect(earns).toBeDefined
  }, 10000)

  it(`can fetch invested history`, async () => {
    const investments = await fetchUserInvestments(TEST_ACCOUNT_ADDRESS)
    // console.log('investments:', investments)

    expect(investments).toBeDefined
  }, 100000);

  it(`can calculate profits summary`, async () => {
    const profits = await fetchUserInvestmentSummary(TEST_ACCOUNT_ADDRESS)
    // console.log('profits:', profits)

    expect(profits).toBeDefined
  }, 100000);
})
