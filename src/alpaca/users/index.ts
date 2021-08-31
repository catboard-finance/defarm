import _ from 'lodash'
import { ITransferInfo } from '../../type'
import { formatBigNumberToFixed } from '../utils/converter'
import { getPositions } from "../vaults"
import { getUserInvestmentInfos } from './farms'
import { getTransactionTransferInfo, getTransactionInfos, getTransferInfos } from './info'
import { getUserLends } from './lend'
import { getUserPositions as getUserPositions, IUserPosition } from "./position"
import { getUserStakes } from './stake'
import { getInvestmentPerFarms } from './summary'

export interface IUserPositionUSD extends IUserPosition {
  positionValueUSD: number;
  debtValueUSD: number;
  vaultSymbol: string;
  equityValueUSD: number;
  debtRatio: number;
  safetyBuffer: number;
  // farmTokenAmount: number;
  // quoteTokenAmount: number;
}

export const fetchUserPositions = async (account: string): Promise<IUserPositionUSD[]> => {
  // Raw
  const positions = await getPositions(account)
  const userPositions = await getUserPositions(positions)

  // Parsed
  const parsedUserPositions = userPositions.map(userPosition => {
    const positionValueUSD = parseFloat(formatBigNumberToFixed(userPosition.positionValueUSDbn))
    const debtValueUSD = parseFloat(formatBigNumberToFixed(userPosition.debtValueUSDbn))
    const equityValueUSD = positionValueUSD - debtValueUSD
    const debtRatio = debtValueUSD <= 0 ? 0 : 100 * debtValueUSD / positionValueUSD
    const safetyBuffer = 80 - debtRatio

    // const farmTokenPriceUSD = parseFloat(symbolPriceUSDMap[userPosition.farmSymbol.toUpperCase()])
    // const quoteTokenAmount = positionValueUSD * 0.5
    // const farmTokenAmount = quoteTokenAmount / farmTokenPriceUSD

    return ({
      ...userPosition,
      positionValueUSD,
      debtValueUSD,
      vaultSymbol: userPosition.vaultSymbol,
      equityValueUSD,
      debtRatio,
      safetyBuffer,
      // farmTokenAmount,
      // quoteTokenAmount,
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

  const transactionsInfos = await getTransactionInfos(account)
  const transferInfos = await getTransferInfos(account)
  const transactionTransferInfo = await getTransactionTransferInfo(transactionsInfos, transferInfos)
  const userInvestmentInfos = await getUserInvestmentInfos(transactionTransferInfo)

  // farms
  const summaryByPositions = await getInvestmentPerFarms(userInvestmentInfos)

  return summaryByPositions
}