import { IToken, ITransaction, MethodType } from "../../type";
import { getTokenFromIBSymbol, getTokenFromPoolAddress } from "../core";
import { ALPACA_BUSD_VAULT_ADDRESSES, ALPACA_USDT_VAULT_ADDRESSES } from "../vaults";
import { getWorkEvent } from "../vaults/vaultEvent";
import { parseVaultInput } from "../vaults/worker";

export interface ITransactionInfo extends ITransaction {
  method: MethodType
  investmentType: InvestmentTypeObject
  vaultAddress: string // "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",
  principalSymbol: string // "ALPACA",
  principalAddress: string // "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
  principalAmount: number //695.245603609934955053,
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
          investmentType: InvestmentTypeObject.none,
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

  principalSymbol: string
  principalAmount: number

  stratAddress: string
  stratSymbol: string
  stratAmount: number

  borrowAmount: number
  maxReturn: number
}

export const withSymbol = (transactions: ITransactionInfo[], startAddressTokenAddressMap: { [address: string]: IToken }): IFarmTransaction[] => {
  const res = transactions.map(e => {
    const farmTx = e as IFarmTransaction
    switch (farmTx.investmentType) {
      case InvestmentTypeObject.farms:
        const stratToken = startAddressTokenAddressMap[farmTx.stratAddress.toLowerCase()]
        const token = getTokenFromPoolAddress(farmTx.to_address)
        return {
          ...farmTx,
          stratSymbol: stratToken?.symbol,
          principalSymbol: token.unstakingToken,
        }

      case InvestmentTypeObject.lends:
      case InvestmentTypeObject.stakes:
      default:
        return farmTx as IFarmTransaction
    }
  })

  return res as unknown as IFarmTransaction[]
}

export const withPosition = async (transactions: ITransactionInfo[]): Promise<IFarmTransaction[]> => {
  const promises = transactions.map(e => {
    const farmTx = e as IFarmTransaction
    let targetAddress = e.to_address

    // poc mapping to vault address
    if (ALPACA_USDT_VAULT_ADDRESSES.includes(targetAddress.toLowerCase())) {
      targetAddress = '0x158Da805682BdC8ee32d52833aD41E74bb951E59'.toLowerCase()
    }

    if (ALPACA_BUSD_VAULT_ADDRESSES.includes(targetAddress.toLowerCase())) {
      targetAddress = '0x7C9e73d4C71dae564d41F78d56439bB4ba87592f'.toLowerCase()
    }

    switch (farmTx.investmentType) {
      case InvestmentTypeObject.farms:
        return getWorkEvent(targetAddress, farmTx.block_number, farmTx.hash)
      default:
        return null
    }
  })

  const results = await Promise.all(promises)
  const res = transactions.map((e, i) => {
    const positionId = results[i] ? results[i].uid : null
    return {
      ...e,
      positionId,
    } as IFarmTransaction
  })

  return res
}
