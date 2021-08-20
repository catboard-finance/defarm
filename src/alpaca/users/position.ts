import { api } from "@defillama/sdk";
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber } from "ethers";
import abi from './activePosition.abi.json'

interface ICall {
  target: string;
  params?: any[];
}

interface IPosition {
  id: number // 811867,
  vault: string // address // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  owner: string // address // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  positionId: number // 18308,
  worker: string // address // "0xe8084d7ded35e2840386f04d609cdb49c7e36d88",
  checkedAt: string // Date // "02021-08-12T14:30:25.412Z",
  adjustNote: string // null,
  debtShare: BigNumber // BigNumber // "4641020177806889684795"
}

interface IEncodedPosition extends Omit<IPosition, 'debtShare'> {
  positionValue: BigNumber // BigNumber
}

interface IEncodedVault {
  totalDebt: BigNumber // BigNumber
}

interface PositionsInfo extends IEncodedPosition, IEncodedVault {
  vaultSymbol: string // symbol
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

  let encodedPositions: IEncodedPosition[] = positions.map((position, i) => ({
    ...position,
    positionValue: BigNumber.from(balances[i].output)
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
    totalDebt: BigNumber.from(totalDebt.output)
  }))

  // Call debtToken
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

  let positionsInfo: PositionsInfo[] = encodedPositions.map((encodedPosition, i) => ({
    ...encodedPosition,
    totalDebt: BigNumber.from(encodedVaults[i].totalDebt),
    vaultSymbol: symbols[i].output,
  }))

  // Call equityValue


  return positionsInfo
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
