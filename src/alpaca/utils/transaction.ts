import { BigNumber } from "ethers";
import _ from "lodash";
import { IToken, ITransaction, MethodType } from "../../type";
import { getPoolByPoolAddress, getAddressFromSymbol, getIBPoolByStakingSymbol, getDebtPoolBySymbol } from "../core";
import { getUserEarnsByPoolIds } from "../users/earn";
import { getUserStakesByPoolIds } from "../users/stake";
import { IUserStake } from "../users/type";
import { parseVaultInput } from "../vaults/worker";
import { stringToFloat } from "./converter";
import { getPositionIdFromGetBlock } from "./events";

export interface ITransactionInfo extends ITransaction {
  method: MethodType
  investmentType: InvestmentTypeObject
  name: string
  positionId: number
  vaultAddress: string // "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",

  principalSymbol: string // "ALPACA",
  principalAddress: string // "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
  principalAmount: number //695.245603609934955053,

  block_timestamp: string // Date "2021-08-07T14:45:51.000Z",
  block_number: string // "10277278",
  block_hash: string // "0x9673166f4eb5e5f7a224d40ec2d3572777f51badf2e6ce7ed5bfb373b6325e06"

  stratType: string // "deposit" | "withdraw"
  stratName: string // "StrategyPartialCloseMinimizeTrading"
}

export enum InvestmentTypeObject {
  farm = 'farm',
  lend = 'lend',
  stake = 'stake',
  none = 'none',
  harvest = 'harvest',
}

export const withMethod = async (transactions: ITransaction[]): Promise<ITransactionInfo[]> => {
  const res = transactions.map(e => {
    const parsed = parseVaultInput(e.input)
    return { ...e, ...parsed }
  }).filter(e => e)
  return res
}

export const withType = async (transactions: ITransactionInfo[]): Promise<ITransactionInfo[]> => {
  const res = transactions.map(e => {
    switch (e.method) {
      case MethodType.deposit:
        // lends or stake
        const ibSymbol = getPoolByPoolAddress(e.to_address)?.stakingToken
        return {
          ...e,
          investmentType: ibSymbol ? InvestmentTypeObject.lend : InvestmentTypeObject.stake,
        }
      case MethodType.work:
        // farms
        return {
          ...e,
          investmentType: InvestmentTypeObject.farm,
        }
      case MethodType.harvest:
        return {
          ...e,
          investmentType: InvestmentTypeObject.harvest,
        }
      case MethodType.approve:
      case MethodType.transfer:
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
  positionId: number
  loanAmount: number
  workerAddress: string

  vaultAddress: string
  principalSymbol: string
  principalAmount: number
  principalValueUSD: number

  stratAddress: string
  stratSymbol: string
  stratAmount: number
  stratValueUSD: number

  borrowAmount: number
  borrowValueUSD: number
  maxReturn: number

  rewardPoolName: string
  rewardPoolAddress: string
  rewardSymbol: string
  rewardAmount: number
  rewardValueUSD: number
}

export interface ILendTransaction extends ITransactionInfo {
  poolId: number
  poolName: string
  poolAddress: string

  depositSymbol: string

  depositAmount?: number
  depositValueUSD?: number

  withdrawSymbol: string
}

export interface IStakeTransaction extends ITransactionInfo {
  fairLaunchAddress: string

  poolId: number
  poolName: string
  poolAddress: string

  stakeSymbol: string

  totalStakeAmount?: number
  totalStakeValueUSD?: number

  unstakeSymbol: string

  rewardPoolName: string
  rewardPoolAddress: string
  rewardTokenAddress: string
  rewardSymbol: string
  rewardAmount: number
  rewardValueUSD: number
}

export const withSymbol = (transactionInfos: ITransactionInfo[], tokenInfoFromTransferAddressMap: { [address: string]: IToken })
  : IFarmTransaction[] | IStakeTransaction[] | ILendTransaction[] => {
  const res = transactionInfos.map(e => {
    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as IFarmTransaction
        var pool = getPoolByPoolAddress(e.to_address)
        const stratToken = tokenInfoFromTransferAddressMap[farmTx.stratAddress.toLowerCase()]

        // Try again with worker address
        const stratSymbol = stratToken ? stratToken.symbol : farmTx.name.split(' ')[0].split('-')[0]

        return {
          ...e,

          stratSymbol,
          principalSymbol: pool.unstakeToken,
          vaultAddress: e.to_address,

          rewardPoolName: `${pool.stakingToken}-${pool.unstakeToken}`,
          rewardSymbol: pool.rewardToken,
          rewardTokenAddress: getAddressFromSymbol(pool.rewardToken),
        }
      case InvestmentTypeObject.lend:
        var pool = getPoolByPoolAddress(e.to_address)
        return {
          ...e,

          poolId: pool.id,
          poolAddress: e.to_address,
          poolName: `${pool.stakingToken}-${pool.unstakeToken}`,

          depositSymbol: pool.unstakeToken,
          withdrawSymbol: pool.stakingToken,
        } as ILendTransaction
      case InvestmentTypeObject.stake:
        const stakeToken = tokenInfoFromTransferAddressMap[e.to_address.toLowerCase()]
        var pool = getIBPoolByStakingSymbol(stakeToken.symbol)
        return {
          ...e,

          fairLaunchAddress: e.to_address,
          stakeSymbol: stakeToken.symbol,
          unstakeSymbol: pool.unstakeToken,

          poolId: pool.id,
          poolAddress: pool.address,
          poolName: `${pool.stakingToken}-${pool.unstakeToken}`,

          rewardPoolName: `${pool.stakingToken}-${pool.unstakeToken}`,
          rewardSymbol: pool.unstakeToken,
          rewardTokenAddress: getAddressFromSymbol(pool.unstakeToken),
        } as IStakeTransaction
      default:
        return e as IFarmTransaction
    }
  })

  return res as unknown as IFarmTransaction[]
}

export const withRecordedPosition = async (transactionInfos: ITransactionInfo[]): Promise<ITransactionInfo[]> => {
  const promises = transactionInfos.map(e => {
    if (e.investmentType !== InvestmentTypeObject.farm) return null
    return getPositionIdFromGetBlock(e.to_address, e.block_number, e.hash)
  })

  const results = await Promise.all(promises)
  const res = transactionInfos.map((e, i) => {
    const result = results[i]
    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const positionId = result ? result.id : null
        const loanAmount = result ? stringToFloat(result.loan?.toString() ?? '0') : null
        return {
          ...e,
          positionId,
          loanAmount,
        } as IFarmTransaction
      default:
        return e
    }
  })

  return res
}

// export const withRecordedClosePosition = async (transactionInfos: ITransactionInfo[]): Promise<ITransactionInfo[]> => {
//   const promises = transactionInfos.map(e => {
//     if (e.investmentType !== InvestmentTypeObject.farm || e.stratType !== STRAT_TYPE.withdraw) return null
//     return getPositionInfoFromGetBlock(e.to_address, e.block_number, e.hash)
//   })

//   const results = await Promise.all(promises)
//   const res = transactionInfos.map((e, i) => {
//     const result = results[i]
//     switch (e.investmentType) {
//       case InvestmentTypeObject.farm:
//         result

//         return {
//           ...e
//         } as IFarmTransaction
//       default:
//         return e
//     }
//   })

//   return res
// }

const getFarmDebtPools = (transactionInfos: ITransactionInfo[]) => {
  const poolIds = transactionInfos
    .filter(e => e.investmentType === InvestmentTypeObject.farm)
    .map(e => {
      const principalSymbol = (e as IFarmTransaction).principalSymbol
      return {
        ...getDebtPoolBySymbol(principalSymbol),
        principalSymbol,
      }
    })
    .filter(e => e)

  return poolIds
}

const getStakePoolIDs = (transactionInfos: ITransactionInfo[]) => {
  const poolIds = transactionInfos
    .filter(e => e.investmentType === InvestmentTypeObject.stake)
    .map(e => (e as IStakeTransaction).poolId)
    .filter(e => e)

  return poolIds
}

export const withCurrentReward = async (account: string, transactionInfos: ITransactionInfo[]) => {
  // Farm
  const farmDebtPools = getFarmDebtPools(transactionInfos)
  const farmDebtPoolIds = [...new Set(farmDebtPools.map(e => e.id))]
  const userFarmEarnings = await getUserEarnsByPoolIds(account, farmDebtPoolIds)
  const userFarmEarningSymbolMaps = farmDebtPools.map(e => ({
    ...e,
    pendingAlpaca: userFarmEarnings.find(f => f.poolId === e.id)?.pendingAlpaca,
  }))

  // Stake
  const stakePoolIds = [...new Set(getStakePoolIDs(transactionInfos))]
  const userStakes = await getUserStakesByPoolIds(account, stakePoolIds)
  const userStakeMap = _.groupBy(userStakes, 'poolId')

  const res = transactionInfos.map(e => {

    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        // Reward from leveraged position
        const farmTx = e as IFarmTransaction
        const farmEarning = userFarmEarningSymbolMaps.find(f => f.principalSymbol.toLowerCase() === farmTx.principalSymbol.toLowerCase())
        return {
          ...e,
          // rewardSymbol: REWARD_TOKEN_SYMBOL,
          rewardPoolAddress: farmEarning.address,
          rewardAmount: stringToFloat(BigNumber.from(farmEarning?.pendingAlpaca || 0).toString()),
        }
      case InvestmentTypeObject.lend:
        // TODO: rewards from lend?
        return e
      case InvestmentTypeObject.stake:
        const stakeTx = e as IStakeTransaction
        const poolId = getIBPoolByStakingSymbol(stakeTx.stakeSymbol)?.id
        const stakeInfo = (userStakeMap[poolId] || [])[0] as IUserStake
        return {
          ...e,
          // rewardTokenAddress: getAddressFromSymbol(stakeInfo.rewardToken), // TODO: reward as ib?
          rewardSymbol: stakeInfo?.rewardToken,
          rewardPoolAddress: stakeInfo?.poolAddress,
          rewardAmount: stringToFloat(BigNumber.from(stakeInfo?.pendingAlpaca || 0).toString()),
        }
      default:
        return e
    }
  })

  return res
}

export const withCurrentRewardPriceUSD = (transactionInfos: ITransactionInfo[], symbolPriceUSDMap: { [symbol: string]: string }) => {
  const res = transactionInfos.map(e => {
    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as unknown as IFarmTransaction
        return {
          ...e,
          rewardValueUSD: farmTx.rewardAmount * parseFloat(symbolPriceUSDMap[farmTx.rewardSymbol]),
        }
      case InvestmentTypeObject.lend:
        // TODO: reward from lend?
        return e
      case InvestmentTypeObject.stake:
        const stakeTx = e as unknown as IStakeTransaction
        return {
          ...e,
          rewardValueUSD: stakeTx.rewardAmount * parseFloat(symbolPriceUSDMap[stakeTx.rewardSymbol]),
        }
      default:
        return e
    }
  })

  return res
}

export const withTransactionFlatPriceUSD = (transactionInfos: ITransactionInfo[], symbolPriceUSDMap: { [symbol: string]: string }) => {
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
      default:
        return e
    }
  })

  return res
}

export const withRecordedTransactionPriceUSD = (transactionInfos: ITransactionInfo[], symbolSlugYMDPriceUSDMap: { [symbolSlugYMD: string]: string }, chain = 'bsc') => {
  const res = transactionInfos.map(e => {
    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as unknown as IFarmTransaction
        const ymds = new Date(e.block_timestamp).toISOString().slice(0, 10)
        const stratPriceUSD = parseFloat(symbolSlugYMDPriceUSDMap[`${chain.toUpperCase()}:${farmTx.stratSymbol}:${ymds}`]) || 0
        const principalPriceUSD = parseFloat(symbolSlugYMDPriceUSDMap[`${chain.toUpperCase()}:${farmTx.principalSymbol}:${ymds}`]) || 0

        return {
          ...e,
          // TOFIX: We can't get correct stratSymbol yet
          stratValueUSD: farmTx.stratAmount * stratPriceUSD,
          principalValueUSD: farmTx.principalAmount * principalPriceUSD,
          borrowValueUSD: farmTx.borrowAmount * principalPriceUSD,
        }
      default:
        return e
    }
  })

  return res
}
