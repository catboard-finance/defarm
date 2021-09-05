// import { BigNumber } from "ethers"
// import { IEncodedUserPosition } from "../users/position"
import { api } from "@defillama/sdk"
import { Chain } from "@defillama/sdk/build/general"
import { BigNumber } from "ethers"
import _ from "lodash"
import { stringToFloat } from "../utils/converter"
import abi from './userDebt.abi.json'

export interface IGetDebtParams {
  vaultAddress: string,
  positionId: number
}

interface IEncodedUserPosition extends IGetDebtParams {
  positionValueUSDbn: BigNumber // BigNumber
  debtValueUSDbn: BigNumber // BigNumber
}

export const getDebt = async (params: IGetDebtParams[], block = 'latest', chain: Chain = 'bsc'): Promise<IEncodedUserPosition[]> => {
  // Call positionInfo for positionValue, debtValue
  const calls = params.map(e => ({
    target: e.vaultAddress,
    params: [e.positionId],
  }))

  const positionInfos = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.positionInfo,
      chain,
    })
  ).output

  const encodedPositions: IEncodedUserPosition[] = positionInfos.map((position, i) => ({
    ...params[i],
    positionValueUSDbn: BigNumber.from(positionInfos[i].output[0]),
    debtValueUSDbn: BigNumber.from(positionInfos[i].output[1])
  }))

  return encodedPositions
}

export const withDebt = async (debtParams: IGetDebtParams[]) => {
  const debts = await getDebt(debtParams)

  const res = debts.map(debt => {
    return {
      positionId: debt.positionId,
      vaultAddress: debt.vaultAddress,
      positionValueUSD: stringToFloat(debt.positionValueUSDbn.toString()),
      debtValueUSD: stringToFloat(debt.debtValueUSDbn.toString()),
    }
  })

  return res
}