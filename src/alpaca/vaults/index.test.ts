import { getPositions } from ".";
import { parseVaultInput } from "./worker";
import bar from './transactions.json'

describe('🦙 Vault', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  it('can get positions', async () => {
    const positions = await getPositions('0x8155430e4860e791aeddb43e4764d15de7e0def1')

    expect(positions).toBeDefined()
  }, 100000);

  it('can get parseVaultInput', async () => {

    let foos = bar.result.map(e => {
      if (e.from_address !== '0x8155430e4860e791aeddb43e4764d15de7e0def1') return null

      return {
        ...parseVaultInput(e.input),
        from_address: e.from_address,
        to_address: e.to_address,
        block_timestamp: e.block_timestamp,
        block_number: e.block_number,
      }
    }).filter(e => e)

    expect(foos).toBeDefined()
  }, 100000);
})
