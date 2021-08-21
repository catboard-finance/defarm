import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import { tokensAddressMap } from "../../pancakeswap/config/constants/mapper";
import abi from './userPosition.abi.json'

interface ICall {
  target: string;
  params?: any[];
}

interface IApiPosition {
  id: number // 811867,
  vault: string // address // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  owner: string // address // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  positionId: number // 18308,
  worker: string // address // "0xe8084d7ded35e2840386f04d609cdb49c7e36d88",
  checkedAt: string // Date // "02021-08-12T14:30:25.412Z",
  adjustNote: string // null,
  debtShare: BigNumber // BigNumber // "4641020177806889684795"
}

interface IEncodedUserPosition extends IApiPosition {
  positionValueUSD: BigNumber // BigNumber
  debtValueUSD: BigNumber // BigNumber
}

interface UserPosition extends IEncodedUserPosition {
  farmSymbol: string // symbol
  vaultSymbol: string // symbol
}

export const getUserPositions = async (positions: IApiPosition[], block = 'latest', chain: Chain = 'bsc'): Promise<UserPosition[]> => {
  // Call shares(positionId) for shareAmount
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

  // Call positionInfo for positionValue, debtValue
  calls = positionInfos.map((positionInfo, i) => ({
    target: positions[i].vault,
    params: [positionInfo.positionId],
  }))

  let encodedPositions: IEncodedUserPosition[] = positions.map((position, i) => ({
    ...position,
    positionValueUSD: BigNumber.from(positionInfos[i].output[0]),
    debtValueUSD: BigNumber.from(positionInfos[i].output[1])
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
  let positionsInfo: UserPosition[] = encodedPositions.map((encodedPosition, i) => {
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
