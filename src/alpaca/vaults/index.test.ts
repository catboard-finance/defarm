import { getPositions } from ".";

describe('🦙 User', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it('can get positions', async () => {
    const positions = await getPositions('0x8155430e4860e791aeddb43e4764d15de7e0def1')
    console.log('positions:', positions)

    expect(positions).toBeDefined()
  }, 100000);
})
