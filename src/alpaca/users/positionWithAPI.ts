import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import { tokensAddressMap } from "../../pancakeswap/config/constants/mapper";
import { ICall } from "./type";
import abi from './userPosition.abi.json'

interface IPositionWithAPI {
  id: number // 811867,
  vault: string // address // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  owner: string // address // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  positionId: number // 18308,
  worker: string // address // "0xe8084d7ded35e2840386f04d609cdb49c7e36d88",
  checkedAt: string // Date // "02021-08-12T14:30:25.412Z",
  adjustNote: string // null,
  debtShare: BigNumber // BigNumber // "4641020177806889684795"
}

export interface IEncodedUserPositionWithAPI extends IPositionWithAPI {
  positionValueBN: BigNumber // BigNumber
  debtValueBN: BigNumber // BigNumber
}

export interface IUserPositionWithAPI extends IEncodedUserPositionWithAPI {
  farmSymbol: string // symbol
  vaultSymbol: string // symbol
}

export const getUserPositionWithAPIs = async (positions: IPositionWithAPI[], block = 'latest', chain: Chain = 'bsc'): Promise<IUserPositionWithAPI[]> => {
  // Call positionInfo for positionValue, debtValue
  let calls: ICall[] = positions.map(position => ({
    target: position.vault,
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

  let encodedPositions: IEncodedUserPositionWithAPI[] = positions.map((position, i) => ({
    ...position,
    positionValueBN: BigNumber.from(positionInfos[i].output[0]),
    debtValueBN: BigNumber.from(positionInfos[i].output[1])
  }))

  // Get quote symbol
  calls = positions.map((_, i) => ({
    target: positions[i].vault
  }))

  const symbols = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.symbol,
      chain,
    })
  ).output;

  // Get base symbol as `farmingToken`
  calls = positions.map((_, i) => ({
    target: positions[i].worker
  }))

  const farmingTokens = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.farmingToken,
      chain,
    })
  ).output

  // Merge
  let positionsInfo: IUserPositionWithAPI[] = encodedPositions.map((encodedPosition, i) => {
    const tokenAddress = farmingTokens[i].output
    const mapped = tokensAddressMap[tokenAddress]
    const farmSymbol = mapped.symbol

    return ({
      ...encodedPosition,
      farmSymbol,
      vaultSymbol: symbols[i].output,
    })
  })

  return positionsInfo
}
