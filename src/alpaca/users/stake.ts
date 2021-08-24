import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import abi from './userStake.abi.json'
import { ICall, IUserStake } from "./type";
import { IB_POOLS } from '../core'

export const getUserStakes = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<IUserStake[]> => {
  // Call balanceOf(account) for balanceOf from FairLaunch
  let calls: ICall[] = IB_POOLS.map(pool => ({
    target: '0xa625ab01b08ce023b2a342dbb12a16f2c8489a8f', // FairLaunch
    params: [pool.id, account],
  }))

  const stakeBalances = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.userInfo,
      chain,
    })
  ).output

  //  amount uint256, rewardDebt uint256, bonusDebt uint256, fundedBy address
  let stakeInfos: IUserStake[] = stakeBalances.map((stakeBalance, i) => {
    const pool = IB_POOLS[i]
    const amount = BigNumber.from(stakeBalance.output.amount)
    const rewardDebt = BigNumber.from(stakeBalance.output.rewardDebt)
    const bonusDebt = BigNumber.from(stakeBalance.output.bonusDebt)
    const fundedBy = stakeBalance.output.fundedBy

    return {
      poolId: pool.id,
      poolAddress: pool.address,
      stakingToken: pool.stakingToken,
      unstakingToken: pool.unstakingToken,

      amount,
      rewardDebt,
      bonusDebt,
      fundedBy
    }
  })

  return stakeInfos
}