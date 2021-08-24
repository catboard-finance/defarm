import fetch from 'node-fetch'
import { formatBigNumberToFixed } from '../utils/converter'
import { getPositions } from "../vaults"
import { getUserLends } from './lend'
import { getUserPositions as getUserPositions } from "./position"
import { getUserStakes } from './stake'

const LEND_PRICE_SYMBOL_MAP = {
  wBNB: 'wbnb',
  CAKE: 'pancakeswap-token',
  ALPACA: 'alpaca-finance',
  BUSD: 'binance-usd',
  USDT: 'tether',
  TUSD: 'true-usd',
  BTCB: 'bitcoin-bep2',
  ETH: 'ethereum',
}

export const fetchUserPositions = async (account: string) => {
  // Raw
  const positions = await getPositions(account)
  const userPositions = await getUserPositions(positions)
  const ids = [...Array.from(new Set(userPositions.map(userPosition => LEND_PRICE_SYMBOL_MAP[userPosition.farmSymbol])))]

  const PRICE_URI = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`
  const priceList: [] = await (await fetch(PRICE_URI)).json()
  const _usdPriceMap: any[] = priceList.map(e => ({ [`${(e['symbol'] as string).toUpperCase()}`]: e['current_price'] }))
  const usdPriceMap = Object.assign({}, ..._usdPriceMap)

  // Parsed
  const parsedUserPositions = userPositions.map(userPosition => {
    const positionValueUSD = parseFloat(formatBigNumberToFixed(userPosition.positionValueUSD))
    const debtValueUSD = parseFloat(formatBigNumberToFixed(userPosition.debtValueUSD))
    const equityValue = positionValueUSD - debtValueUSD
    const debtRatio = debtValueUSD <= 0 ? 0 : 100 * debtValueUSD / positionValueUSD
    const safetyBuffer = 80 - debtRatio
    const farmTokenPriceUSD = usdPriceMap[userPosition.farmSymbol.toUpperCase()] as number
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

export const fetchUserLends = async (account: string) => {
  // Raw
  const lends = await getUserLends(account)
  const parsedLend = lends.map(lend => ({
    ...lend,
    balance: parseFloat(formatBigNumberToFixed(lend.amount))
  }))

  return parsedLend
}

export const fetchUserStakes = async (account: string) => {
  // Raw
  const lends = await getUserStakes(account)
  const parsedStake = lends.map(stake => ({
    ...stake,
    amount: parseFloat(formatBigNumberToFixed(stake.amount)),
    rewardDebt: parseFloat(formatBigNumberToFixed(stake.rewardDebt)),
    bonusDebt: parseFloat(formatBigNumberToFixed(stake.bonusDebt)),
    fundedBy: stake.fundedBy,
  }))

  return parsedStake
}

