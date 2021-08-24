import { getEventsByBlockNumber, getTransactions, getTransfers } from ".";
import { filterVaults } from "../alpaca";
import mocked_transfers from './__snapshots__/transfers.json'

const TEST_ACCOUNT_ADDRESS = '0x8155430e4860e791aeddb43e4764d15de7e0def1'

describe('🐈 User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get all account transactions.', async () => {
    const res = await getTransactions(TEST_ACCOUNT_ADDRESS)
    expect(res).not.toBeNull()
  });

  it('can get all account transfers.', async () => {
    const res = await getTransfers(TEST_ACCOUNT_ADDRESS)
    expect(res).not.toBeNull()
  });

  it.todo('can get events by topic.', async () => {
    const topic = 'Work(uint256 indexed,uint256)'
    const events = await getEventsByBlockNumber('0x158da805682bdc8ee32d52833ad41e74bb951e59', topic)
    console.log('events:', events)
    expect(events).not.toBeNull()
  });

  it('can get all alpaca vault related transfers.', async () => {
    const res = filterVaults(mocked_transfers)
    expect(res).toBeDefined()
  });
})
