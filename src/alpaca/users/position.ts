import { api } from "@defillama/sdk"
import { Chain } from "@defillama/sdk/build/general"
import { BigNumber } from "ethers"
import _ from "lodash"
import { getPoolByPoolAddress } from ".."
import { fetchRecordedPriceUSD } from "../../coingecko"
import { stringToFloat } from "../utils/converter"
import abi from './userPosition.abi.json'

export interface IGetPositionParams {
  vaultAddress: string,
  farmName: string,
  positionId: number
}

interface IEncodedUserPosition extends IGetPositionParams {
  positionValueBN: BigNumber // BigNumber
  debtValueBN: BigNumber // BigNumber
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
    positionValueBN: BigNumber.from(positionInfos[i].output[0]),
    debtValueBN: BigNumber.from(positionInfos[i].output[1])
  }))

  return encodedPositions
}

export interface ICurrentPosition {
  positionId: number
  farmName: string
  vaultAddress: string
  positionValue: number
  debtValue: number
  positionValueUSD: number
  debtValueUSD: number
  equityValueUSD: number
}

export const withCurrentPosition = async (positionParams: IGetPositionParams[]): Promise<ICurrentPosition[]> => {
  const positions = await getCurrentPositions(positionParams)
  const today = new Date().toISOString().slice(0, 10)

  // Prepare symbol
  const symbolKeys = positions.map(position => {
    const pool = getPoolByPoolAddress(position.vaultAddress)
    return `BSC:${pool.unstakeToken}:${today}`
  })

  // Prepare price
  const symbolPriceUSDMap = await fetchRecordedPriceUSD(symbolKeys)

  const res = positions.map(position => {
    const pool = getPoolByPoolAddress(position.vaultAddress)
    const positionValue = stringToFloat(position.positionValueBN.toString())
    const debtValue = stringToFloat(position.debtValueBN.toString())
    const symbolKey = `BSC:${pool.unstakeToken}:${today}`
    const priceUSD = symbolPriceUSDMap[symbolKey]
    const positionValueUSD = positionValue * priceUSD
    const debtValueUSD = debtValue * priceUSD
    const equityValueUSD = positionValueUSD - debtValueUSD

    return {
      positionId: position.positionId,
      farmName: position.farmName,
      vaultAddress: position.vaultAddress,
      positionValue,
      debtValue,
      positionValueUSD,
      debtValueUSD,
      equityValueUSD,
    } as ICurrentPosition
  })

  return res
}
