import { fetchUserPositions, fetchUserLends, fetchUserStakes } from ".";
import { sumInvestedVaults } from "..";
import { getTransfers } from "../../account";

const TEST_ACCOUNT_ADDRESS = '0x8155430e4860e791aeddb43e4764d15de7e0def1'
describe('User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it.skip(`can fetch user position value`, async () => {
    const positions = await fetchUserPositions(TEST_ACCOUNT_ADDRESS)
    // console.log('positions:', positions)

    expect(positions).toBeDefined
  }, 10000);

  it(`can calculate profit`, async () => {
    // 1. Get all active positions
    const positions = await fetchUserPositions(TEST_ACCOUNT_ADDRESS)
    const activePositions = positions.filter(e => e.equityValue > 0)
    console.log('activePositions:', activePositions)

    // 2. Get all investment transactions
    const transfers = await getTransfers(TEST_ACCOUNT_ADDRESS)

    // 3. Get position from event
    // const positionWithBlockNumber = positions.map(position => )

    // const events = await getPositionIds('0x158da805682bdc8ee32d52833ad41e74bb951e59', 9959085)
    // console.log('events:', events)

    // 4. Get sum in and out
    const investedVaultSummaryMap = sumInvestedVaults(transfers)
    console.log('investedVaultSummaryMap:', investedVaultSummaryMap)

    // 5. Calculate profit
    const profits = activePositions.map(pos => {
      const investedVaultSummary = investedVaultSummaryMap[pos.vault].totalWithdraw
      return {
        ...pos,
        profit: pos.equityValue - investedVaultSummary,
      }
    })

    console.log('profits:', profits)

    expect(activePositions).toBeDefined
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
})
