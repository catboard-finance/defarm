import { fetchPositionsInfo } from ".";

describe('🦙 User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get position value', async () => {
    const account = '0x8155430e4860e791aeddb43e4764d15de7e0def1'
    const positionValue = await fetchPositionsInfo(account)
    // console.log('positionValue:', positionValue)

    expect(positionValue).toBeDefined()
  }, 10000);

  it.todo('can get reward from `CAKE`');
})
