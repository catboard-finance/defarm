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

interface IFarmPair {
  stratAmount: number
  principalAmount: number
}

export interface ICurrentPosition {
  positionId: number
  farmName: string
  farmStatus: PositionStatusType

  vaultAddress: string
  positionValue: number
  debtValue: number

  positionValueUSD: number
  debtValueUSD: number
  equityValueUSD: number

  stratSymbol: string
  stratValue: number
  stratValueUSD: number
  stratAmount: number

  principalSymbol: string
  principalValue: number
  principalValueUSD: number
  principalAmount: number

  tradeValue: number
  tradeValueUSD: number
  tradeAmount: number

  positionValueAsset: IFarmPair
  convertedPositionValueAsset: IFarmPair
  receiveValueAsset: IFarmPair

  positionAt: string // Date,
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

    // Raw value
    const positionValue = stringToFloat(position.positionValueBN.toString())
    const debtValue = stringToFloat(position.debtValueBN.toString())
    const halfPosition = positionValue / 2
    const principalValue = halfPosition
    const stratValue = halfPosition
    const equityValue = positionValue - debtValue

    // Debt (principal) USD value
    const debtSymbolKey = `BSC:${pool.unstakeToken}:${today}`
    const debtPriceUSD = symbolPriceUSDMap[debtSymbolKey]

    // Principal
    const principalSymbol = positionParams[i].principalSymbol
    const principalSymbolKey = `BSC:${principalSymbol}:${today}`
    const principalPriceUSD = symbolPriceUSDMap[principalSymbolKey]
    const principalValueUSD = principalValue * debtPriceUSD
    const principalAmount = principalValueUSD / principalPriceUSD

    // Strategy
    const stratSymbol = positionParams[i].stratSymbol
    const stratSymbolKey = `BSC:${stratSymbol}:${today}`
    const stratPriceUSD = symbolPriceUSDMap[stratSymbolKey]
    const stratValueUSD = stratValue * debtPriceUSD
    const stratAmount = stratValueUSD / stratPriceUSD

    // Position
    const positionValueUSD = positionValue * debtPriceUSD
    const debtValueUSD = debtValue * debtPriceUSD
    const equityValueUSD = equityValue * debtPriceUSD

    // Trade
    const tradeValue = debtValue > 0 ? halfPosition - debtValue : 0
    const tradeValueUSD = tradeValue * debtPriceUSD
    const tradeStratAmount = tradeValueUSD / stratPriceUSD

    const tradeAmount = tradeStratAmount
    const debtPrincipalAmount = debtValueUSD / principalPriceUSD

    // Position value
    const positionValueAsset = {
      stratAmount,
      principalAmount,
    }

    // Converted position value
    const convertedPositionValueAsset = {
      stratAmount: stratAmount + tradeStratAmount,
      principalAmount: principalAmount - tradeValue,
    }

    // Receive
    const receiveValueAsset = {
      stratAmount: convertedPositionValueAsset.stratAmount,
      principalAmount: convertedPositionValueAsset.principalAmount - debtPrincipalAmount,
    }

    // Status
    const farmStatus = equityValueUSD === 0 ? PositionStatusType.close : PositionStatusType.open
    const positionAt = new Date().toISOString()

    return {
      positionId: position.positionId,
      farmName: position.farmName,
      farmStatus,

      vaultAddress: position.vaultAddress,
      positionValue,
      debtValue,

      positionValueUSD,
      debtValueUSD,
      equityValueUSD,

      stratSymbol,
      stratValue,
      stratAmount,
      stratValueUSD,

      principalSymbol,
      principalAmount,
      principalValue,
      principalValueUSD,

      tradeValue,
      tradeValueUSD,
      tradeAmount,

      positionValueAsset,
      convertedPositionValueAsset,
      receiveValueAsset,

      positionAt,
    } as ICurrentPosition
  })

  return res
}
