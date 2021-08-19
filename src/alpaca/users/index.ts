import { getPositions } from "../vaults"
import { getPositionsInfo } from "./position"

export const fetchPositionsInfo = async (account: string) => {
  const positions = await getPositions(account)
  const positionsInfo = await getPositionsInfo(positions)

  return positionsInfo
}
