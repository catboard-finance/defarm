import { getPositionIds } from "../vaults"
import { getPositionValue } from "./position"

export const fetchPositionValue = async (account: string) => {
  const positions = await getPositionIds(account)
  // TODO : loop positions
  const positionValue = await getPositionValue(positions[0])

  return positionValue
}