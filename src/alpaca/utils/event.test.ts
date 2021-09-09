import { getPositionIdFromGetBlock } from "./events"

test('can get positions', async () => {
  const position = await getPositionIdFromGetBlock('0x158da805682bdc8ee32d52833ad41e74bb951e59', '9959085')
  const expected = {
    id: expect.any(Number),
    loan: expect.objectContaining({
      hex: expect.stringMatching(/0x[0-9a-fA-F]*/),
      type: 'BigNumber',
    }),
  }

  expect(position).toEqual(expect.not.objectContaining(expected));
}, 10000)
