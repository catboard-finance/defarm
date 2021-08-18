import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import abi from './positionValue.abi.json'

interface ICall {
  target: string;
  params?: any[];
}

export const getPositionValue = async (positionId: number, block = 'latest', chain: Chain = 'bsc'): Promise<string[]> => {
  const target = '0xe8084D7Ded35E2840386f04d609cdb49C7E36d88'
  let calls: ICall[] = [{
    target,
    params: [positionId],
  }]

  const shareAmount = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.shares,
      chain,
    })
  ).output[0].output;

  calls = [{
    target,
    params: [shareAmount],
  }]

  const result = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.shareToBalance,
      chain,
    })
  ).output;

  return result
}
