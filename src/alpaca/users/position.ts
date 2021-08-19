import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "ethers";
import abi from './positionValue.abi.json'

interface ICall {
  target: string;
  params?: any[];
}

interface IPosition {
  id: number // 811867,
  vault: string // Address // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  owner: string // Address // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  positionId: number // 18308,
  worker: string // Address // "0xe8084d7ded35e2840386f04d609cdb49c7e36d88",
  checkedAt: string // Date // "02021-08-12T14:30:25.412Z",
  adjustNote: string // null,
  debtShare: string // BigNumber // "4641020177806889684795"
}

interface IEncodedPosition extends Omit<IPosition, 'debtShare'> {
  debtShare: number
  balance: number
}

/**
 * Method to format the display of wei given an ethers.BigNumber object with toFixed
 * Note: rounds
 */
export const formatBigNumberToFixed = (number: BigNumber, displayDecimals = 18, decimals = 18) => {
  const formattedString = formatUnits(number, decimals)
  return (+formattedString).toFixed(displayDecimals)
}

export const getPositionsInfo = async (positions: IPosition[], block = 'latest', chain: Chain = 'bsc'): Promise<IEncodedPosition[]> => {
  // Call shares(positionId) for shareAmount
  let calls: ICall[] = positions.map(position => ({
    target: position.worker,
    params: [position.positionId],
  }))

  const shareAmounts = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.shares,
      chain,
    })
  ).output

  // Call shareToBalance(shareAmount) for balance
  calls = shareAmounts.map((shareAmount, i) => ({
    target: positions[i].worker,
    params: [shareAmount.output],
  }))

  const balances = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.shareToBalance,
      chain,
    })
  ).output;

  const balanceOutputs = balances.map(balance => parseFloat(formatBigNumberToFixed(balance.output)))

  const encodedPositions: IEncodedPosition[] = positions.map((position, i) => ({
    ...position,
    debtShare: parseFloat(formatBigNumberToFixed(BigNumber.from(position.debtShare))),
    balance: balanceOutputs[i]
  }))

  return encodedPositions
}
