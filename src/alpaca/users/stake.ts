import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import abi from './userStake.abi.json'
import { ICall, IUserStake } from "./type";
import { FAIR_LAUNCH_ADDRESS, getPoolByPoolId, IB_POOLS } from '../core'

export const getUserStakes = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<IUserStake[]> => {
  const poolIds = IB_POOLS.map(e => e.id)
  return getUserStakesByPoolIds(account, poolIds, block, chain)
}

export const getUserStakesFromSymbols = async (account: string, symbols: string[], block = 'latest', chain: Chain = 'bsc'): Promise<IUserStake[]> => {
  const poolIds = IB_POOLS.filter(e => symbols.includes(e.stakingToken)).map(e => e.id)
  return getUserStakesByPoolIds(account, poolIds, block, chain)
}

export const getUserStakesByPoolIds = async (account: string, poolIds: number[], block = 'latest', chain: Chain = 'bsc'): Promise<IUserStake[]> => {
  // Call balanceOf(account) for balanceOf from FairLaunch
  let calls: ICall[] = poolIds.map(poolId => ({
    target: FAIR_LAUNCH_ADDRESS, // FairLaunch
    params: [poolId, account],
  }))

  const stakeBalances =
    api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.userInfo,
      chain,
    })

  const pendingBalances =
    api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.pendingAlpaca,
      chain,
    })

  const promises = await Promise.all([stakeBalances, pendingBalances])
  const outputs = promises.map(e => e.output)

  //  amount uint256, rewardDebt uint256, bonusDebt uint256, fundedBy address
  let stakeInfos: IUserStake[] = outputs[0].map((stakeBalance, i) => {
    const pool = getPoolByPoolId(poolIds[i])
    const amount = BigNumber.from(stakeBalance.output.amount)
    const rewardDebt = BigNumber.from(stakeBalance.output.rewardDebt)
    const bonusDebt = BigNumber.from(stakeBalance.output.bonusDebt)
    const fundedBy = stakeBalance.output.fundedBy

    const pendingAlpaca = BigNumber.from(outputs[1][i].output)

    return {
      fairLaunchPoolAddress: FAIR_LAUNCH_ADDRESS,
      poolId: pool.id,
      poolAddress: pool.address,
      stakingToken: pool.stakingToken,
      rewardToken: 'ALPACA',

      amount,
      rewardDebt,
      bonusDebt,
      fundedBy,

      pendingAlpaca,
    }
  })

  return stakeInfos
}