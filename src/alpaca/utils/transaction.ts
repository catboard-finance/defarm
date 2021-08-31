import { IToken, ITransaction, MethodType } from "../../type";
import { getPoolInfoFromPoolAddress } from "../core";
import { ALPACA_BUSD_VAULT_ADDRESSES, ALPACA_USDT_VAULT_ADDRESSES } from "../vaults";
import { getWorkEvent } from "../vaults/vaultEvent";
import { parseVaultInput } from "../vaults/worker";

export interface ITransactionInfo extends ITransaction {
  method: MethodType
  investmentType: InvestmentTypeObject
  positionId: string
  vaultAddress: string // "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",
  principalSymbol: string // "ALPACA",
  principalAddress: string // "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
  principalAmount: number //695.245603609934955053,
  priceUSD: number // 1042.8684054149,
  block_timestamp: string // Date "2021-08-07T14:45:51.000Z",
  block_number: string // "10277278",
  block_hash: string // "0x9673166f4eb5e5f7a224d40ec2d3572777f51badf2e6ce7ed5bfb373b6325e06"
}

export enum InvestmentTypeObject {
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
        const ibSymbol = getPoolInfoFromPoolAddress(e.to_address)?.stakingToken
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

export interface IFarmTransaction extends ITransactionInfo {
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

export interface ILendTransaction extends ITransactionInfo {
  ibPoolAddress: string

  depositTokenSymbol: string
  depositAmount?: number
  depositValueUSD?: number
}

export interface IStakeTransaction extends ITransactionInfo {
  fairLaunchAddress: string

  depositTokenSymbol: string
  depositAmount?: number
  depositValueUSD?: number
}

export const withSymbol = (transactionInfos: ITransactionInfo[], stratAddressTokenAddressMap: { [address: string]: IToken })
  : IFarmTransaction[] | IStakeTransaction[] | ILendTransaction[] => {
  const res = transactionInfos.map(e => {

    switch (e.investmentType) {
      case InvestmentTypeObject.farms:
        const farmTx = e as IFarmTransaction
        const token = getPoolInfoFromPoolAddress(e.to_address)
        const stratToken = stratAddressTokenAddressMap[farmTx.stratAddress.toLowerCase()]
        return {
          ...e,
          stratSymbol: stratToken?.symbol,
          principalSymbol: token.unstakingToken,
          vaultAddress: e.to_address,
        }
      case InvestmentTypeObject.lends:
        const lendToken = getPoolInfoFromPoolAddress(e.to_address).unstakingToken
        return {
          ...e,
          ibPoolAddress: e.to_address,
          depositTokenSymbol: lendToken,
        } as ILendTransaction
      case InvestmentTypeObject.stakes:
        var stakeToken = stratAddressTokenAddressMap[e.to_address.toLowerCase()]
        return {
          ...e,
          fairLaunchAddress: e.to_address,
          depositTokenSymbol: stakeToken.symbol,
        } as IStakeTransaction
      default:
        return e as IFarmTransaction
    }
  })

  return res as unknown as IFarmTransaction[]
}

export const withPosition = async (transactionInfos: ITransactionInfo[]): Promise<IFarmTransaction[]> => {
  const promises = transactionInfos.map(e => {
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
  const res = transactionInfos.map((e, i) => {
    const positionId = results[i] ? results[i].uid : null
    return {
      ...e,
      positionId,
    } as IFarmTransaction
  })

  return res
}
