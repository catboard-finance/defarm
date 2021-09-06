import _ from 'lodash'
import { getERC20Balance, getNativeBalance } from '../../account'
import { ITransferInfo } from '../../type'
import { formatBigNumberToFixed, stringToFloat } from '../utils/converter'
import { getPositions } from "../vaults"
import { getUserInvestmentInfos } from './investment'
import { getTransactionTransferInfo, getTransactionInfos, getTransferInfos } from './info'
import { getUserLends } from './lend'
import { getUserPositions as getUserPositions, IUserPosition } from "./position"
import { getUserStakes } from './stake'
import { IUserBalance } from './type'
import { getInvestmentSummary } from './summary'
import { getUserEarns } from './earn'

// User////////////////////////

export const fetchUserBalance = async (account: string): Promise<IUserBalance[]> => {
  const [native, erc20] = await Promise.all([
    getNativeBalance(account),
    getERC20Balance(account),
  ])

  const parsedERC20s = erc20.map(e => ({
    symbol: e.symbol,
    name: e.name,
    address: e.token_address,
    amount: stringToFloat(e.balance, parseInt(e.decimals), parseInt(e.decimals)),
  }))

  return [
    {
      symbol: 'BNB',
      amount: stringToFloat(native.balance),
    },
    ...parsedERC20s,
  ]
}

// Farm ////////////////////////

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
  const parsedLends = lends.map(lend => ({
    ...lend,
    amount: parseFloat(formatBigNumberToFixed(lend.amount))
  }))

  return parsedLends
}

export const fetchUserStakes = async (account: string) => {
  // Raw
  const stakes = await getUserStakes(account)
  const parsedStakes = stakes.map(stake => ({
    ...stake,
    amount: parseFloat(formatBigNumberToFixed(stake.amount)),
    rewardDebt: parseFloat(formatBigNumberToFixed(stake.rewardDebt)),
    bonusDebt: parseFloat(formatBigNumberToFixed(stake.bonusDebt)),
    fundedBy: stake.fundedBy,

    pendingAlpaca: parseFloat(formatBigNumberToFixed(stake.pendingAlpaca)),
  }))

  return parsedStakes
}

export const fetchUserFarmEarns = async (account: string) => {
  // Raw
  const earns = await getUserEarns(account)
  const parsedEarns = earns.map(earn => ({
    ...earn,
    pendingAlpaca: parseFloat(formatBigNumberToFixed(earn.pendingAlpaca)),
  }))

  return parsedEarns
}


export interface IDepositTransferUSDMap {
  [address: string]: ITransferInfo[]
}

export const fetchUserInvestments = async (account: string) => {
  const transactionsInfos = await getTransactionInfos(account)
  const transferInfos = await getTransferInfos(account)
  const transactionTransferInfo = await getTransactionTransferInfo(account, transactionsInfos, transferInfos)
  const userInvestmentInfos = await getUserInvestmentInfos(transactionTransferInfo)

  return userInvestmentInfos
}

export const fetchUserInvestmentSummary = async (account: string) => {
  const userInvestments = await fetchUserInvestments(account)
  const summaryByPositions = await getInvestmentSummary(userInvestments)

  return summaryByPositions
}

// TODO: fetchUserReward