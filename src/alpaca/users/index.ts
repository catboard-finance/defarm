import fetch from 'node-fetch'
import { getPositions } from "../vaults"
import { getUserPositions as getUserPositions } from "./position"

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

export const fetchUserPositions = async (account: string) => {
  // Raw
  const positions = await getPositions(account)
  const userPositions = await getUserPositions(positions)

  // Prices
  const PRICE_URI = 'https://api.binance.com/api/v3/ticker/price?symbol='
  const [CAKE, ALPACA] = await Promise.all([
    (await fetch(`${PRICE_URI}CAKEUSDT`)).json(),
    (await fetch(`${PRICE_URI}ALPACAUSDT`)).json()
  ])
  // const PRICE_URI = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='
  // const [CAKE, ALAPACA] = await Promise.all([
  //   (await fetch(`${PRICE_URI}pancakeswap-token`)).json(),
  //   (await fetch(`${PRICE_URI}alpaca-finance`)).json()
  // ])

  const priceMap = {
    CAKE,
    ALPACA
  }

  // Parsed
  const parsedUserPositions = userPositions.map(userPosition => {
    const positionValueUSD = parseFloat(formatBigNumberToFixed(userPosition.positionValueUSD))
    const debtValueUSD = parseFloat(formatBigNumberToFixed(userPosition.debtValueUSD))
    const equityValue = positionValueUSD - debtValueUSD
    const debtRatio = debtValueUSD <= 0 ? 0 : 100 * debtValueUSD / positionValueUSD
    const safetyBuffer = 80 - debtRatio
    const farmTokenPriceUSD = priceMap[userPosition.farmSymbol].price
    const quoteTokenAmount = positionValueUSD * 0.5
    const farmTokenAmount = quoteTokenAmount / farmTokenPriceUSD

    return ({
      ...userPosition,
      positionValueUSD,
      debtValueUSD,
      vaultSymbol: userPosition.vaultSymbol,
      equityValue,
      debtRatio,
      safetyBuffer,
      farmTokenAmount,
      quoteTokenAmount,
    })
  })

  return parsedUserPositions
}
