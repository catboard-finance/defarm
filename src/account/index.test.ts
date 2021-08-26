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

  it('can get events by topic.', async () => {
    const abi = `{
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "loan",
          "type": "uint256"
        }
      ],
      "name": "Work",
      "type": "event"
    }`

    const topic = 'Work(uint256,uint256)'
    const events = await getEventsByBlockNumber('0x158da805682bdc8ee32d52833ad41e74bb951e59', abi, topic, 9967403)

    expect(events).not.toBeNull()
  });

  it('can get all alpaca vault related transfers.', async () => {
    const res = filterVaults(mocked_transfers['result'])
    expect(res).toBeDefined()
  });
})
