import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import abi from './userLend.abi.json'
import pools from '../pools.json'
import { ICall, UserLend } from "./type";

const ALPACA_LEND_POOL_ADDRESSES = pools
  .filter(pool => pool.stakingToken.startsWith("ib"))
  .map(pool => pool.address.toLowerCase())

export const getUserLends = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<UserLend[]> => {
  // Call balanceOf(account) for balanceOf
  let calls: ICall[] = ALPACA_LEND_POOL_ADDRESSES.map(poolAddress => ({
    target: poolAddress,
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

  let lendInfos: UserLend[] = lendBalances.map((lendBalance) => {
    const poolAddress = lendBalance.input.target
    const balance = BigNumber.from(lendBalance.output)

    return {
      poolAddress,
      balance,
    }
  })

  return lendInfos
}