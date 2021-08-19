import { getPositionIds } from ".";

describe('🦙 User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get log', async () => {
    const txHash = '0x5590f91d196f06f8ad23ae26ae11f918805264735550b377fb8c6078d312bc6a'
    const log = await getPositionIds(txHash)
    console.log('log:', log)

    expect(log).toBeDefined()
  }, 100000);
})
