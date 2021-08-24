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

export const stringToFixed = (value: string) => formatBigNumberToFixed(ethers.BigNumber.from(value))
export const stringToFloat = (value: string) => parseFloat(stringToFixed(value))
