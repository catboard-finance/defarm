import { readBlockForPositionValue } from "./userEncoder"

export const fetchPositionValue = async (account: string) => {
  const positionValue = await readBlockForPositionValue(account)

  return positionValue
}