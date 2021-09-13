import { getEventsByBlockNumber, getTransactions, getTransfers } from ".";

const TEST_ACCOUNT_ADDRESS = '0x8155430e4860e791aeddb43e4764d15de7e0def1'

describe('🐈 User', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  it('can get all account transactions.', async () => {
    const res = await getTransactions(TEST_ACCOUNT_ADDRESS)
    expect(res).not.toBeNull()
  });

  it('can get all account transfers.', async () => {
    const res = await getTransfers(TEST_ACCOUNT_ADDRESS)
    expect(res).not.toBeNull()
  });

  it('can get work events by topic.', async () => {
    const abi = require('../alpaca/users/userWork.abi.json')

    const topic = 'Work(uint256,uint256)'
    const events = await getEventsByBlockNumber('0x158da805682bdc8ee32d52833ad41e74bb951e59', JSON.stringify(abi.Work), topic, 9967403)

    expect(events).not.toBeNull()
  });

  it('can get kill events by topic.', async () => {
    const abi = require('../alpaca/users/userKill.abi.json')

    const topic = 'Kill(uint256,address,address,uint256,uint256,uint256,uint256)'
    const events = await getEventsByBlockNumber('0x158da805682bdc8ee32d52833ad41e74bb951e59', JSON.stringify(abi.Kill), topic, 9967403)

    expect(events).not.toBeNull()
  });
})
