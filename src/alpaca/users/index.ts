import fetch from 'node-fetch'
import { getPositions } from "../vaults"
import { getPositionsInfo as getUserPositions } from "./position"

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
  const positions = [10121] || await getPositions(account)
  const userPositions = await getUserPositions(positions)

  // Prices
  // const PRICE_URI = 'https://api.binance.com/api/v3/ticker/price?symbol='
  const PRICE_URI = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='
  const [CAKE, ALAPACA] = await Promise.all([
    (await fetch(`${PRICE_URI}pancakeswap-token`)).json(),
    (await fetch(`${PRICE_URI}alpaca-finance`)).json()
  ])

  CAKE
  ALAPACA

  // Parsed
  const parsedUserPositions = userPositions.map(userPosition => {
    const positionValue = parseFloat(formatBigNumberToFixed(userPosition.positionValue))

    // TODO GET SYMBOL
    const positionValueUSDT = positionValue * 22.37 / 2

    const totalDebt = parseFloat(formatBigNumberToFixed(userPosition.totalDebt))
    const equityValue = positionValueUSDT - totalDebt
    const debtRatio = totalDebt <= 0 ? 0 : 100 * totalDebt / positionValueUSDT
    const safetyBuffer = 80 - debtRatio

    return ({
      ...userPosition,
      positionValue,
      positionValueUSDT,
      totalDebt,
      vaultSymbol: userPosition.vaultSymbol,
      equityValue,
      debtRatio,
      safetyBuffer,
    })
  })

  return parsedUserPositions
}
