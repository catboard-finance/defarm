import { getPositionIdFromGetBlock } from "./getblock"

test.skip('can get positions from getblock', async () => {
  const position = await getPositionIdFromGetBlock('0x158da805682bdc8ee32d52833ad41e74bb951e59', '9959085', '0xc007bdeadc18d4c9effef31fad9a174e3605a849f3a6862c4c948b0802a1d12f')
  const expected = {
    id: 18243,
    loan: expect.objectContaining({
      hex: expect.stringMatching(/0x[0-9a-fA-F]*/),
      type: 'BigNumber',
    }),
  }

  expect(position).toEqual(expect.not.objectContaining(expected));
}, 10000)
