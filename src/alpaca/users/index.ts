import _ from 'lodash'
import { getTransfers } from '../../account'
import { fetchPriceUSD } from '../../coingecko'
import { ITransferInfo } from '../../type'
import { getSymbolsFromTransfers } from '../core'
import { formatBigNumberToFixed } from '../utils/converter'
import { withDirection, filterInvestmentTransfers, getPositions, deprecated_summaryPositionInfo, withPriceUSD, deprecated_withPositionInfo } from "../vaults"
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

// Will be deprecate?
// This working but in the end gathering deposit/withdraw from transfer is no efficient due to 
// It will need knowledge of all address to filter in/out behavior.
export const deprecated_fetchUserSummaryFromTransfer = async (account: string) => {
  // TODO : replace with onchain implement
  // 1. Get all active positions
  const positions = await fetchUserPositions(account)
  const activePositions = positions.filter(e => e.equityValueUSD > 0)
  // console.log('activePositions:', activePositions)

  // 2. Get all investment related transactions
  const transfers = await getTransfers(account)
  let transferInfos = withDirection(account, transfers)
  transferInfos = filterInvestmentTransfers(transferInfos) as ITransferInfo[]

  // 3. Prepare price in USD
  const symbols = getSymbolsFromTransfers(transferInfos)
  const symbolPriceUSDMap = await fetchPriceUSD(symbols)

  // 4. Apply price in USD
  transferInfos = withPriceUSD(transferInfos, symbolPriceUSDMap) as ITransferInfo[]

  // 5. Get position from event by block number
  transferInfos = await deprecated_withPositionInfo(transferInfos as ITransferInfo[])

  // 6. Add equity USD
  const investments = deprecated_summaryPositionInfo(activePositions, transferInfos)

  return investments
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