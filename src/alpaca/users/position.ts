import { api } from "@defillama/sdk"
import { Chain } from "@defillama/sdk/build/general"
import { BigNumber } from "ethers"
import _ from "lodash"
import { getPoolByPoolAddress } from ".."
import { fetchRecordedPriceUSD } from "../../coingecko"
import { stringToFloat } from "../utils/converter"
import { IPositionSummary } from "./summary"
import abi from './userPosition.abi.json'

export interface IGetPositionParams {
  vaultAddress: string,
  farmName: string,
  positionId: number,
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

export enum PositionStatusType {
  open = 'open',
  close = 'close',
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
  status: PositionStatusType

  stratSymbol: string
  stratValue: number
  stratValueUSD: number

  principalSymbol: string
  principalValue: number
  principalValueUSD: number

  tradeValue: number
  tradeValueUSD: number
}

export const withCurrentPosition = async (positionParams: IPositionSummary[]): Promise<ICurrentPosition[]> => {
  const positions = await getCurrentPositions(positionParams)
  const today = new Date().toISOString().slice(0, 10)

  // Prepare symbol
  const symbolKeys = [...new Set(positions.map((position, i) => {
    const pool = getPoolByPoolAddress(position.vaultAddress)
    const stratSymbol = positionParams[i].stratSymbol
    return [`BSC:${pool.unstakeToken}:${today}`, `BSC:${stratSymbol}:${today}`]
  }).flat())]

  // Prepare price
  const symbolPriceUSDMap = await fetchRecordedPriceUSD(symbolKeys)

  const res = positions.map((position, i) => {
    const pool = getPoolByPoolAddress(position.vaultAddress)
    const positionValue = stringToFloat(position.positionValueBN.toString())
    const debtValue = stringToFloat(position.debtValueBN.toString())
    const symbolKey = `BSC:${pool.unstakeToken}:${today}`
    const priceUSD = symbolPriceUSDMap[symbolKey]
    const positionValueUSD = positionValue * priceUSD
    const debtValueUSD = debtValue * priceUSD
    const equityValueUSD = positionValueUSD - debtValueUSD
    const status = equityValueUSD === 0 ? PositionStatusType.close : PositionStatusType.open
    const positionAt = new Date().toISOString()

    const stratSymbol = positionParams[i].stratSymbol
    const stratSymbolKey = `BSC:${stratSymbol}:${today}`
    const stratPriceUSD = symbolPriceUSDMap[stratSymbolKey]
    const stratValue = equityValueUSD / stratPriceUSD
    const stratValueUSD = stratValue * stratPriceUSD

    const principalSymbol = positionParams[i].principalSymbol
    const principalSymbolKey = `BSC:${principalSymbol}:${today}`
    const principalPriceUSD = symbolPriceUSDMap[principalSymbolKey]
    const principalValue = equityValueUSD / principalPriceUSD
    const principalValueUSD = principalValue * principalPriceUSD

    // debt
    const tradeValueUSD = (positionValueUSD / 2) - debtValueUSD
    const tradeValue = tradeValueUSD / stratPriceUSD

    // receive
    const receiveValueUSD = principalValueUSD - tradeValueUSD

    return {
      positionId: position.positionId,
      farmName: position.farmName,
      vaultAddress: position.vaultAddress,
      positionValue,
      debtValue,
      positionValueUSD,
      debtValueUSD,
      equityValueUSD,

      stratSymbol,
      stratValue,
      stratValueUSD,

      principalSymbol,
      principalValue,
      principalValueUSD,

      tradeValue,
      tradeValueUSD,

      receiveValueUSD,

      status,
      positionAt,
    } as ICurrentPosition
  })

  return res
}
