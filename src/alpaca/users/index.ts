import _ from 'lodash'
import { getTransactions, getTransfers } from '../../account'
import { fetchPriceUSD } from '../../coingecko'
import { ITransferInfo } from '../../type'
import { getSymbolsFromTransfers } from '../core'
import { formatBigNumberToFixed } from '../utils/converter'
import { ITransactionWithMethod, withMethods, withType } from '../utils/transaction'
import { withDirection, filterInvestmentTransfers, getPositions, summaryPositionInfo, withPriceUSD, withPositionInfo } from "../vaults"
import { getUserLends } from './lend'
import { getUserPositions as getUserPositions, IUserPosition } from "./position"
import { getUserStakes } from './stake'

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
export const fetchUserSummaryFromTransfer = async (account: string) => {
  // TODO : replace with onchain implement
  // 1. Get all active positions
  const positions = await fetchUserPositions(account)
  const activePositions = positions.filter(e => e.equityValueUSD > 0)
  // console.log('activePositions:', activePositions)

  // 2. Get all investment related transactions
  const transfers = await getTransfers(account)
  const transferWithDirections = withDirection(account, transfers)
  const transferObjects = filterInvestmentTransfers(transferWithDirections)

  // 3. Prepare price in USD
  const symbols = getSymbolsFromTransfers(transferObjects)
  const symbolPriceUSDMap = await fetchPriceUSD(symbols)

  // 4. Apply price in USD
  const investmentTransferInfos = withPriceUSD(transferObjects, symbolPriceUSDMap) as ITransferInfo[]

  // 5. Get position from event by block number
  const transferInfos = await withPositionInfo(investmentTransferInfos)

  // 6. Add equity USD
  const investments = summaryPositionInfo(activePositions, transferInfos)

  return investments
}

export const fetchUserSummary = async (account: string) => {
  // Get transactions
  let transactions = await getTransactions(account)

  // Decode methods
  transactions = await withMethods(transactions)

  // Separate actions lend/stake/farm by vault address and method
  transactions = await withType(transactions as ITransactionWithMethod[])

  return transactions

  // Add token info by tokens address

  // Add historical price at contract time

  // Get position from event by block number

  // Define token ratio (for estimate each token amounts) by tokens numbers in vault

  // Separate deposits/withdraws

  // Summary deposits/withdraws

  // Summary token each lend/stake/farm

  ///////////////////////////////////////////////////////////////////

  // Get equity from chain (or API)

  // Divide current token from equity by farm ratio

  // Summary from lend/stake/farm

  // Summary token from lend/stake/farm
}