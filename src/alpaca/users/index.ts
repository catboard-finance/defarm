import { getPositions } from "../vaults"
import { getPositionsInfo } from "./position"

import { formatUnits } from "@ethersproject/units";
import { BigNumber, ethers } from "ethers";

// Expected for view
// positionValue: c,
// totalDebt: f,
// debtRatio: b,
// killBuffer: x,
// currentLeverage: o

/**
 * Method to format the display of wei given an ethers.BigNumber object with toFixed
 * Note: rounds
 */
export const formatBigNumberToFixed = (number: BigNumber, displayDecimals = 18, decimals = 18) => {
  const formattedString = formatUnits(number, decimals)
  return (+formattedString).toFixed(displayDecimals)
}

export const stringToFixed = (value: string) => formatBigNumberToFixed(ethers.BigNumber.from(value))

export const fetchPositionsInfo = async (account: string) => {
  // Raw
  const positions = await getPositions(account)
  const positionsInfo = await getPositionsInfo(positions)

  // Parsed
  const parsedPositionsInfo = positionsInfo.map(positionInfo => ({
    ...positionInfo,
    positionValue: parseFloat(formatBigNumberToFixed(positionInfo.positionValue)),
    totalDebt: parseFloat(formatBigNumberToFixed(positionInfo.totalDebt)),
    vaultSymbol: positionInfo.vaultSymbol,
    equityValue: parseFloat(formatBigNumberToFixed(positionInfo.positionValue.sub(positionInfo.totalDebt))),
  }))

  return parsedPositionsInfo
}
