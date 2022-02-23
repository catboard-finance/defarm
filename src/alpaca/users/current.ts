import { fetchPriceUSD } from '../../lib/coingecko'
import { getPoolByPoolId, REWARD_TOKEN_SYMBOL } from '../core'
import { IFarmTransaction, InvestmentTypeObject, IStakeTransaction, ITransactionInfo, withCurrentReward, withCurrentRewardPriceUSD } from '../utils/transaction'

export interface ICurrentBalanceInfo {
  investmentType: InvestmentTypeObject
  aggregatedAt: string // Date

  positionId?: number
  poolId?: string

  rewardPoolName?: string
  rewardPoolAddress?: string
  rewardSymbol?: string
  rewardAmount?: number
  rewardValueUSD?: number
}

export const getCurrentBalanceInfos = async (account: string, transactionInfos: ITransactionInfo[]): Promise<ICurrentBalanceInfo[]> => {
  // only investment related
  transactionInfos = transactionInfos.filter((e) => e.investmentType !== InvestmentTypeObject.none)

  // Get current reward from chain
  let currentBalanceInfos = await withCurrentReward(account, transactionInfos)

  // Apply price in USD to rewards
  const symbolPriceUSDMap = await fetchPriceUSD([REWARD_TOKEN_SYMBOL])
  currentBalanceInfos = withCurrentRewardPriceUSD(currentBalanceInfos, symbolPriceUSDMap)

  // sum each transfers
  const userInvestmentInfos = currentBalanceInfos.map((e) => {
    // parse for view
    const baseInvestment: ICurrentBalanceInfo = {
      investmentType: e.investmentType,
      aggregatedAt: new Date().toISOString()
    }

    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as unknown as IFarmTransaction
        return {
          ...baseInvestment,

          // Group by
          positionId: farmTx.positionId,

          rewardPoolName: farmTx.rewardPoolName,
          rewardPoolAddress: farmTx.rewardPoolAddress,
          rewardSymbol: farmTx.rewardSymbol,
          rewardAmount: farmTx.rewardAmount,
          rewardValueUSD: farmTx.rewardValueUSD
        }
      case InvestmentTypeObject.lend:
        return baseInvestment
      case InvestmentTypeObject.stake:
        const stakeTx = e as unknown as IStakeTransaction
        var pool = getPoolByPoolId(stakeTx.poolId)
        return {
          ...baseInvestment,

          // Group by
          poolId: pool.id,

          rewardPoolName: stakeTx.rewardPoolName,
          rewardPoolAddress: stakeTx.rewardPoolAddress,
          rewardSymbol: stakeTx.rewardSymbol,
          rewardAmount: stakeTx.rewardAmount,
          rewardValueUSD: stakeTx.rewardValueUSD
        }
      default:
        return null
    }
  })

  return userInvestmentInfos.filter((e) => e) as ICurrentBalanceInfo[]
}
