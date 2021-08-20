import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import abi from './activePosition.abi.json'

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
  positionValue: string // BigNumber
}

interface IEncodedVault {
  totalDebt: string // BigNumber
}

interface PositionsInfo extends IEncodedPosition, IEncodedVault {

}

export const getPositionsInfo = async (positions: IPosition[], block = 'latest', chain: Chain = 'bsc'): Promise<PositionsInfo[]> => {
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

  // Call shareToBalance(shareAmount) for `positionValue`
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

  const positionValues = balances.map(balance => balance.output)

  let encodedPositions: IEncodedPosition[] = positions.map((position, i) => ({
    ...position,
    positionValue: positionValues[i]
  }))

  // Call debtShareToVal(debtShare) for `totalDebt`
  calls = positions.map((shareAmount, i) => ({
    target: positions[i].vault,
    params: [shareAmount.debtShare],
  }))

  const totalDebts = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi.debtShareToVal,
      chain,
    })
  ).output;

  const encodedVaults: IEncodedVault[] = totalDebts.map(totalDebt => ({
    totalDebt: totalDebt.output
  }))

  const positionInfo: PositionsInfo[] = encodedPositions.map((encodedPosition, i) => ({
    ...encodedPosition,
    totalDebt: encodedVaults[i].totalDebt
  }))

  return positionInfo
}

// const getVaultInfo = async (positions: IPosition[], block = 'latest', chain: Chain = 'bsc'): Promise<IEncodedVault[]> => {
//   // Call debtShareToVal(debtShare) for `totalDebt`
//   const calls = positions.map((shareAmount, i) => ({
//     target: positions[i].worker,
//     params: [shareAmount.debtShare],
//   }))

//   const totalDebts = (
//     await api.abi.multiCall({
//       // @ts-ignore
//       block,
//       calls,
//       abi: abi.debtShareToVal,
//       chain,
//     })
//   ).output;

//   const encodedVaults: IEncodedVault[] = totalDebts.map(totalDebt => ({
//     totalDebt: totalDebt
//   }))

//   return encodedVaults
// }
