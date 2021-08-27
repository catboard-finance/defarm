import { ITransaction, MethodType } from "../../type";
import { getTokenFromIBSymbol, getTokenFromPoolAddress } from "../core";
import { parseVaultInput } from "../vaults/worker";

export interface ITransactionInfo extends ITransaction {
  method: MethodType
  investmentType: InvestmentTypeObject
  vaultAddress: string // "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",
  tokenSymbol: string // "ALPACA",
  tokenAddress: string // "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
  tokenAmount: number //695.245603609934955053,
  priceUSD: number // 1042.8684054149,
  block_timestamp: string // Date "2021-08-07T14:45:51.000Z",
  block_number: string // "10277278",
  block_hash: string // "0x9673166f4eb5e5f7a224d40ec2d3572777f51badf2e6ce7ed5bfb373b6325e06"
}

enum InvestmentTypeObject {
  farms = 'farms',
  lends = 'lends',
  stakes = 'stakes',
  none = 'none',
}

export const withMethods = async (transactions: ITransaction[]): Promise<ITransactionInfo[]> => {
  const res = transactions.map(e => {
    const parsed = parseVaultInput(e.input)
    return { ...e, ...parsed }
  }).filter(e => e)
  return res
}

export const withType = async (transactions: ITransactionInfo[]): Promise<ITransactionInfo[]> => {
  const res = transactions.map(e => {
    switch (e.method) {
      case MethodType.approve:
        return {
          ...e,
          investmentType: null,
        }
      case MethodType.deposit:
        // lends or stake
        const ibSymbol = getTokenFromIBSymbol(e.to_address)
        return {
          ...e,
          investmentType: ibSymbol ? InvestmentTypeObject.lends : InvestmentTypeObject.stakes,
        }
      case MethodType.transfer:
        return {
          ...e,
          investmentType: InvestmentTypeObject.none,
        }
      case MethodType.work:
        // farms
        return {
          ...e,
          investmentType: InvestmentTypeObject.farms,
        }
      default:
        return {
          ...e,
          investmentType: InvestmentTypeObject.none,
        }
    }
  })

  return res
}

interface IFarmTransaction extends ITransactionInfo {
  name: string
  positionId: string
  workerAddress: string
  principalAmount: number
  borrowAmount: number
  maxReturn: number
}

export const withSymbol = (transactions: ITransactionInfo[]): IFarmTransaction[] => {
  const res = transactions.map(e => {
    const farmTx = e as IFarmTransaction
    switch (farmTx.investmentType) {
      case InvestmentTypeObject.farms:
        const tokenAddress = farmTx.workerAddress
        const token = getTokenFromPoolAddress(farmTx.to_address)
        return {
          ...farmTx,
          tokenSymbol: token.unstakingToken,
          tokenAddress,
          tokenAmount: farmTx.principalAmount
        }

      case InvestmentTypeObject.lends:
      case InvestmentTypeObject.stakes:
        return farmTx as IFarmTransaction
      default:
        return farmTx as IFarmTransaction
    }
  })

  return res
}