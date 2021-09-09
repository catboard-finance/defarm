import { api } from "@defillama/sdk"
import { Chain } from "@defillama/sdk/build/general"
import { BigNumber } from "ethers"
import _ from "lodash"
import { stringToFloat } from "../utils/converter"
import abi from './userPosition.abi.json'

export interface IGetPositionParams {
  vaultAddress: string,
  farmName: string,
  positionId: number
}

interface IEncodedUserPosition extends IGetPositionParams {
  positionValueUSDbn: BigNumber // BigNumber
  debtValueUSDbn: BigNumber // BigNumber
}

export const getCurrentPositions = async (positions: IGetPositionParams[], block = 'latest', chain: Chain = 'bsc'): Promise<IEncodedUserPosition[]> => {
  // Call positionInfo for positionValue, debtValue
  const calls = positions.map(position => ({
    target: position.vaultAddress,
    params: [position.positionId],
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

  const encodedPositions: IEncodedUserPosition[] = positions.map((position, i) => ({
    ...position,
    positionValueUSDbn: BigNumber.from(positionInfos[i].output[0]),
    debtValueUSDbn: BigNumber.from(positionInfos[i].output[1])
  }))

  return encodedPositions
}

export const withCurrentPosition = async (positionParams: IGetPositionParams[]) => {
  const positions = await getCurrentPositions(positionParams)

  const res = positions.map(position => {
    return {
      positionId: position.positionId,
      farmName: position.farmName,
      vaultAddress: position.vaultAddress,
      positionValueUSD: stringToFloat(position.positionValueUSDbn.toString()),
      debtValueUSD: stringToFloat(position.debtValueUSDbn.toString()),
    }
  })

  return res
}