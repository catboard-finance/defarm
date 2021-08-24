import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import abi from './userLend.abi.json'
import { ICall, IUserLend } from "./type";
import { IB_POOLS } from '../core'

export const getUserLends = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<IUserLend[]> => {
  // Call balanceOf(account) for balanceOf
  let calls: ICall[] = IB_POOLS.map(pool => ({
    target: pool.address,
    params: [account],
  }))

  const lendBalances = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.balanceOf,
      chain,
    })
  ).output

  let lendInfos: IUserLend[] = lendBalances.map((lendBalance) => {
    const poolAddress = lendBalance.input.target
    const amount = BigNumber.from(lendBalance.output)

    return {
      poolAddress,
      amount,
    }
  })

  return lendInfos
}