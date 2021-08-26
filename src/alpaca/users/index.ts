import _ from 'lodash'
import fetch from 'node-fetch'
import { getTransfers } from '../../account'
import { ITransferInfo } from '../../type'
import { formatBigNumberToFixed } from '../utils/converter'
import { getSymbolPriceUSDMapByAddresses } from '../utils/price'
import { withDirection, filterInvestmentTransfers, getPositions, summaryPositionInfo, withPriceUSD, withPositionInfo } from "../vaults"
import { getUserLends } from './lend'
import { getUserPositions as getUserPositions, IUserPosition } from "./position"
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

export interface IUserPositionUSD extends IUserPosition {
  positionValueUSD: number;
  debtValueUSD: number;
  vaultSymbol: string;
  equityValueUSD: number;
  debtRatio: number;
  safetyBuffer: number;
  farmTokenAmount: number;
  quoteTokenAmount: number;
}

export const fetchUserPositions = async (account: string): Promise<IUserPositionUSD[]> => {
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
    const positionValueUSD = parseFloat(formatBigNumberToFixed(userPosition.positionValueUSDbn))
    const debtValueUSD = parseFloat(formatBigNumberToFixed(userPosition.debtValueUSDbn))
    const equityValueUSD = positionValueUSD - debtValueUSD
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
      equityValueUSD,
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
    amount: parseFloat(formatBigNumberToFixed(lend.amount))
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

export interface IDepositTransferUSDMap {
  [address: string]: ITransferInfo[]
}

export const fetchUserSummary = async (account: string) => {
  // 1. Get all active positions
  const positions = await fetchUserPositions(account)
  const activePositions = positions.filter(e => e.equityValueUSD > 0)
  // console.log('activePositions:', activePositions)

  // 2. Get all investment related transactions
  const transfers = await getTransfers(account)
  const investmentTransfers = filterInvestmentTransfers(transfers)

  // 3. Apply USD
  const symbolPriceUSDMap = await getSymbolPriceUSDMapByAddresses(investmentTransfers)

  // 5. Prepare price in USD for required symbols
  const investmentTransferUSDs = await withPriceUSD(investmentTransfers, symbolPriceUSDMap)
  const investmentTransferInfos = withDirection(investmentTransferUSDs)

  // 6. Get position from event by block number
  const transferInfos = await withPositionInfo(investmentTransferInfos)

  // 7. Add equity USD
  const investments = summaryPositionInfo(activePositions, transferInfos)

  return investments
}