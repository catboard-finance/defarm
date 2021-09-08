import { fetchPriceUSD } from "../../coingecko"
import { getPoolByPoolId, REWARD_TOKEN_SYMBOL } from "../core"
import { IFarmTransaction, InvestmentTypeObject, IStakeTransaction, ITransactionInfo, withCurrentReward, withRewardPriceUSD } from "../utils/transaction"

interface ICurrentPositionInfo {
  investmentType: InvestmentTypeObject,
  aggregatedAt: string // Date
}

export const getCurrentBalanceInfos = async (account: string, transactionInfos: ITransactionInfo[]) => {
  // Get current reward from chain
  let currentBalanceInfos = await withCurrentReward(account, transactionInfos)

  // Apply price in USD to rewards
  const symbolPriceUSDMap = await fetchPriceUSD([REWARD_TOKEN_SYMBOL]) // TODO: use cached price
  currentBalanceInfos = withRewardPriceUSD(currentBalanceInfos, symbolPriceUSDMap)

  // only investment related
  currentBalanceInfos = currentBalanceInfos.filter(e => e.investmentType !== InvestmentTypeObject.none)

  // sum each transfers
  const userInvestmentInfos = currentBalanceInfos.map(e => {

    // parse for view
    const baseInvestment: ICurrentPositionInfo = {
      investmentType: e.investmentType,
      aggregatedAt: new Date().toISOString(),
    }

    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as unknown as IFarmTransaction
        return {
          ...baseInvestment,

          positionId: farmTx.positionId,

          rewardPoolAddress: farmTx.rewardPoolAddress,
          rewardTokenSymbol: farmTx.rewardTokenSymbol,
          rewardAmount: farmTx.rewardAmount,
          rewardValueUSD: farmTx.rewardValueUSD,
        }
      case InvestmentTypeObject.lend:
        return baseInvestment
      case InvestmentTypeObject.stake:
        const stakeTx = e as unknown as IStakeTransaction
        var pool = getPoolByPoolId(stakeTx.poolId)
        return {
          ...baseInvestment,

          poolId: pool.id,

          rewardTokenSymbol: stakeTx.rewardTokenSymbol,
          rewardAmount: stakeTx.rewardAmount,
          rewardValueUSD: stakeTx.rewardValueUSD,
        }
      default:
        return null
    }
  })

  return userInvestmentInfos.filter(e => e)
}