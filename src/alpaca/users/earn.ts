import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import abi from './userEarn.abi.json'
import { ICall, IUserEarn } from "./type";
import { FAIR_LAUNCH_ADDRESS, getPoolByPoolId, DEBT_POOLS } from '../core'

export const getUserEarns = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<IUserEarn[]> => {
  const poolIds = DEBT_POOLS.map(e => e.id)
  return getUserEarnsByPoolIds(account, poolIds, block, chain)
}

export const getUserEarnsByPoolIds = async (account: string, poolIds: number[], block = 'latest', chain: Chain = 'bsc'): Promise<IUserEarn[]> => {
  // Guard empty
  if (poolIds.length >= 0) return []

  let calls: ICall[] = poolIds.map(poolId => ({
    target: FAIR_LAUNCH_ADDRESS, // FairLaunch
    params: [poolId, account],
  }))

  const pendingAlpacaCalls =
    api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.pendingAlpaca,
      chain,
    })

  const pendingAlpacas = (await pendingAlpacaCalls).output

  let earnedInfos: IUserEarn[] = pendingAlpacas.map((e, i) => {
    const pool = getPoolByPoolId(poolIds[i])

    const pendingAlpaca = BigNumber.from(e.output)

    return {
      fairLaunchPoolAddress: FAIR_LAUNCH_ADDRESS,
      poolId: pool.id,
      poolAddress: pool.address,

      pendingAlpaca,
    }
  })

  return earnedInfos
}