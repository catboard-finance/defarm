import { BigNumber } from "ethers";
import _ from "lodash";
import { IToken, ITransaction, MethodType } from "../../type";
import { getPoolByPoolAddress, getAddressFromSymbol, getPoolByStakingTokenSymbol } from "../core";
import { getUserStakesByPoolIds } from "../users/stake";
import { IUserStake } from "../users/type";
import { ALPACA_BUSD_VAULT_ADDRESSES, ALPACA_USDT_VAULT_ADDRESSES } from "../vaults";
import { getWorkEvent } from "../vaults/vaultEvent";
import { parseVaultInput } from "../vaults/worker";
import { stringToFloat } from "./converter";

export interface ITransactionInfo extends ITransaction {
  method: MethodType
  investmentType: InvestmentTypeObject
  name: string
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
  farm = 'farm',
  lend = 'lend',
  stake = 'stake',
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
        const ibSymbol = getPoolByPoolAddress(e.to_address)?.stakingToken
        return {
          ...e,
          investmentType: ibSymbol ? InvestmentTypeObject.lend : InvestmentTypeObject.stake,
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
          investmentType: InvestmentTypeObject.farm,
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
  farmName: string
  positionId: string
  workerAddress: string

  vaultAddress: string
  principalSymbol: string
  principalAmount: number
  principalValueUSD: number

  stratAddress: string // 
  stratSymbol: string
  stratAmount: number
  stratValueUSD: number

  borrowAmount: number
  borrowValueUSD: number
  maxReturn: number
}

export interface ILendTransaction extends ITransactionInfo {
  ibPoolAddress: string

  depositTokenSymbol: string
  depositAmount?: number
  depositValueUSD?: number

  withdrawTokenSymbol: string
}

export interface IStakeTransaction extends ITransactionInfo {
  fairLaunchAddress: string

  poolId: number

  stakeTokenSymbol: string
  stakeAmount?: number
  stakeValueUSD?: number

  rewardTokenAddress: string
  rewardTokenSymbol: string
  rewardAmount: number
  rewardValueUSD: number
}

export const withSymbol = (transactionInfos: ITransactionInfo[], tokenInfoFromTransferAddressMap: { [address: string]: IToken })
  : IFarmTransaction[] | IStakeTransaction[] | ILendTransaction[] => {
  const res = transactionInfos.map(e => {
    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        // const farmTx = e as IFarmTransaction
        const token = getPoolByPoolAddress(e.to_address)
        // Can't get token from stratAddress  e.g. SharedStrategies
        // const stratToken = tokenInfoFromTransferAddressMap[farmTx.to_address.toLowerCase()]
        return {
          ...e,
          // stratSymbol: stratToken?.symbol,
          principalSymbol: token.rewardToken,
          vaultAddress: e.to_address,
        }
      case InvestmentTypeObject.lend:
        var pool = getPoolByPoolAddress(e.to_address)
        return {
          ...e,
          ibPoolAddress: e.to_address,
          depositTokenSymbol: pool.rewardToken,
          withdrawTokenSymbol: pool.stakingToken,
        } as ILendTransaction
      case InvestmentTypeObject.stake:
        const stakeToken = tokenInfoFromTransferAddressMap[e.to_address.toLowerCase()]
        var pool = getPoolByStakingTokenSymbol(stakeToken.symbol)
        return {
          ...e,
          fairLaunchAddress: e.to_address,
          stakeTokenSymbol: stakeToken.symbol,

          poolId: pool.id,

          rewardTokenSymbol: pool.rewardToken,
          rewardTokenAddress: getAddressFromSymbol(pool.rewardToken), // TODO: reward as ib?
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
      case InvestmentTypeObject.farm:
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

// TODO: move to somewhere this belongs
export const withReward = async (account: string, transactionInfos: ITransactionInfo[]) => {
  // Find stake pools from transaction
  const poolIds = transactionInfos
    .filter(e => e.investmentType === InvestmentTypeObject.stake)
    .map(e => (e as IStakeTransaction).poolId)

  const userStakes = await getUserStakesByPoolIds(account, poolIds)
  const userStakeMap = _.groupBy(userStakes, 'poolId')

  const res = transactionInfos.map(e => {

    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        // TODO: rewards from farm
        return e
      case InvestmentTypeObject.lend:
        // TODO: rewards from lend
        return e
      case InvestmentTypeObject.stake:
        const stakeTx = e as IStakeTransaction
        const poolId = getPoolByStakingTokenSymbol(stakeTx.stakeTokenSymbol).id
        const stakeInfo = userStakeMap[poolId][0] as IUserStake
        return {
          ...e,
          // rewardTokenAddress: getAddressFromSymbol(stakeInfo.rewardToken), // TODO: reward as ib?
          // rewardTokenSymbol: stakeInfo.rewardToken,
          rewardAmount: stringToFloat(BigNumber.from(stakeInfo.pendingAlpaca).toString()),
        }
      default:
        return e
    }
  })

  return res
}

export const withRewardPriceUSD = (transactionInfos: ITransactionInfo[], symbolPriceUSDMap: { [symbol: string]: string }) => {
  const res = transactionInfos.map(e => {
    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as unknown as IFarmTransaction
        return {
          ...e,
          // TOFIX: We can't get correct stratSymbol yet
          stratValueUSD: farmTx.stratAmount * parseFloat(symbolPriceUSDMap[farmTx.stratSymbol]),
          principalValueUSD: farmTx.principalAmount * parseFloat(symbolPriceUSDMap[farmTx.principalSymbol]),
        }
      case InvestmentTypeObject.lend:
        // TODO
        return e
      case InvestmentTypeObject.stake:
        const stakeTx = e as unknown as IStakeTransaction
        return {
          ...e,
          rewardValueUSD: stakeTx.rewardAmount * parseFloat(symbolPriceUSDMap[stakeTx.rewardTokenSymbol]),
        }
      default:
        return e
    }
  })

  return res
}
