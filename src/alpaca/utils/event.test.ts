import { getPositionIdFromGetBlock } from "./events"

test('can get positions', async () => {
  const position = await getPositionIdFromGetBlock('0x158da805682bdc8ee32d52833ad41e74bb951e59', '9959085')

  expect(position).toBeDefined()
}, 10000)