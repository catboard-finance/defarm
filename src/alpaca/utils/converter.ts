import { formatUnits } from "@ethersproject/units";
import { BigNumber, ethers } from "ethers";

/**
 * Method to format the display of wei given an ethers.BigNumber object with toFixed
 * Note: rounds
 */
export const formatBigNumberToFixed = (number: BigNumber, displayDecimals = 18, decimals = 18) => {
  const formattedString = formatUnits(number, decimals)
  return (+formattedString).toFixed(displayDecimals)
}

export const stringToFixed = (value: string, displayDecimals = 18, decimals = 18) => formatBigNumberToFixed(ethers.BigNumber.from(value), displayDecimals, decimals)
export const stringToFloat = (value: string, displayDecimals = 18, decimals = 18) => parseFloat(stringToFixed(value, displayDecimals, decimals))
