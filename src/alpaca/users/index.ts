import _ from 'lodash'
import { ITransferInfo } from '../../type'
import { formatBigNumberToFixed } from '../../utils/converter'
import { _fetchUserPositionWithAPIs } from '../api'
import { getUserInvestmentInfos } from './investment'
import { getTransactionTransferInfos, getTransactionInfos, getTransferInfos } from './info'
import { getUserLends } from './lend'
import { getUserStakes } from './stake'
import { IUserPositionUSD } from './type'
import { getInvestmentSummary } from './summary'
import { getUserEarns } from './earn'
import { getUserPositionWithAPIs } from './positionWithAPI'
import { getCurrentBalanceInfos } from './current'

// User////////////////////////

export const fetchUserPositionWithAPIs = async (account: string): Promise<IUserPositionUSD[]> => {
  // Raw
  const positions = await _fetchUserPositionWithAPIs(account)
  const userPositions = await getUserPositionWithAPIs(positions)

  // Parsed
  const parsedUserPositions = userPositions.map((userPosition) => {
    const positionValue = parseFloat(formatBigNumberToFixed(userPosition.positionValueBN))
    const debtValue = parseFloat(formatBigNumberToFixed(userPosition.debtValueBN))
    const equityValue = positionValue - debtValue
    const debtRatio = debtValue <= 0 ? 0 : (100 * debtValue) / positionValue
    const safetyBuffer = 80 - debtRatio

    // const farmTokenPriceUSD = parseFloat(symbolPriceUSDMap[userPosition.farmSymbol.toUpperCase()])
    // const quoteTokenAmount = positionValue * 0.5
    // const farmTokenAmount = quoteTokenAmount / farmTokenPriceUSD

    return {
      ...userPosition,
      positionValue,
      debtValue,
      vaultSymbol: userPosition.vaultSymbol,
      equityValue,
      debtRatio,
      safetyBuffer
      // farmTokenAmount,
      // quoteTokenAmount,
    }
  })

  return parsedUserPositions
}

export const fetchUserLends = async (account: string) => {
  // Raw
  const lends = await getUserLends(account)
  const parsedLends = lends.map((lend) => ({
    ...lend,
    amount: parseFloat(formatBigNumberToFixed(lend.amount))
  }))

  return parsedLends
}

export const fetchUserStakes = async (account: string) => {
  // Raw
  const stakes = await getUserStakes(account)
  const parsedStakes = stakes.map((stake) => ({
    ...stake,
    amount: parseFloat(formatBigNumberToFixed(stake.amount)),
    rewardDebt: parseFloat(formatBigNumberToFixed(stake.rewardDebt)),
    bonusDebt: parseFloat(formatBigNumberToFixed(stake.bonusDebt)),
    fundedBy: stake.fundedBy,

    pendingAlpaca: parseFloat(formatBigNumberToFixed(stake.pendingAlpaca))
  }))

  return parsedStakes
}

export const fetchUserFarmEarns = async (account: string) => {
  // Raw
  const earns = await getUserEarns(account)
  const parsedEarns = earns.map((earn) => ({
    ...earn,
    pendingAlpaca: parseFloat(formatBigNumberToFixed(earn.pendingAlpaca))
  }))

  return parsedEarns
}

export interface IDepositTransferUSDMap {
  [address: string]: ITransferInfo[]
}

/**
 * Investment per account
 * @param account
 * @returns
 */
export const fetchUserInvestments = async (account: string) => {
  const transactionsInfos = await getTransactionInfos(account)
  const transferInfos = await getTransferInfos(account)

  // Aggregated transactions and transfers
  const transactionTransferInfos = await getTransactionTransferInfos(transactionsInfos, transferInfos)

  // Sum recorded value
  const userInvestmentInfos = await getUserInvestmentInfos(transactionTransferInfos)

  return { userInvestmentInfos, transactionTransferInfos }
}

export const fetchUserInvestmentSummary = async (account: string) => {
  // Get history
  const { userInvestmentInfos, transactionTransferInfos } = await fetchUserInvestments(account)

  // Get current
  const userCurrentBalanceInfos = await getCurrentBalanceInfos(account, transactionTransferInfos)

  // Aggregate
  const summary = await getInvestmentSummary(userInvestmentInfos, userCurrentBalanceInfos)

  return summary
}
