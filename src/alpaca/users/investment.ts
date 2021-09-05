import _ from "lodash"
import { ITransferInfo } from "../../type"
import { getPoolByPoolAddress, getPoolByPoolId } from "../core"
import { IFarmTransaction, ILendTransaction, InvestmentTypeObject, IStakeTransaction, ITransactionInfo } from "../utils/transaction"

export interface IUserInvestmentTransfers {
  blockNumber: string
  fromAddress: string // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  toAddress: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  direction: string // "out",
  tokenSymbol: string // "CAKE",
  tokenAddress: string // "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
  tokenAmount: number // 1272.6522003096,
  tokenPriceUSD: number // 22.1,
  tokenValueUSD: number // 1527.12000,
}

export interface IFarmInvestmentInfo extends IUserInvestmentInfo {
  farmName: string // "ALPACA-BUSD"
  positionId: number // 9967403,

  depositValueUSD: number // 1000,
  equityValueUSD: number // 1000,
  profitValueUSD: number // 900,

  stratAddress: string // "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90",
  stratSymbol: string // "CAKE",
  stratAmount: number // 128,
  stratValueUSD: number // 2560,

  vaultAddress: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  principalSymbol: string // "USDT",
  principalAmount: number // 0,
  principalValueUSD: number // 0,

  borrowAmount: number // 0,
  borrowValueUSD: number // 0,
}

export interface ILendInvestmentInfo extends IUserInvestmentInfo {
  poolId: number
  poolName: string
  poolAddress: string

  depositTokenSymbol: string
  depositAmount: number
  depositValueUSD: number
}

export interface IStakeInvestmentInfo extends IUserInvestmentInfo {
  fairLaunchAddress: string

  poolId: number
  poolName: string
  poolAddress: string

  stakeTokenSymbol: string
  stakeAmount: number
  stakeValueUSD: number

  rewardTokenAddress: string
  rewardTokenSymbol: string
  rewardAmount: number
  rewardValueUSD: number
}

export interface IUserInvestmentInfo {
  investmentType: InvestmentTypeObject
  transfers: IUserInvestmentTransfers[],

  investedAt: string // "2021-08-07T14:45:51.000Z",
}

export interface ITransactionTransferInfo extends ITransactionInfo {
  transferInfos: ITransferInfo[]
}

export const getUserInvestmentInfos = async (transactionTransferInfo: ITransactionTransferInfo[]): Promise<IUserInvestmentInfo[]> => {
  // only investment related
  transactionTransferInfo = transactionTransferInfo.filter(e => e.investmentType !== InvestmentTypeObject.none)

  // sum each transfers
  const userInvestmentInfos = transactionTransferInfo.map(e => {

    // parse for view
    const transfers = e.transferInfos
      .filter(e => e)
      .map(transfer => ({
        fromAddress: transfer.from_address,
        toAddress: transfer.to_address,
        direction: transfer.direction,
        tokenSymbol: transfer.tokenSymbol,
        tokenAddress: transfer.address,
        tokenAmount: transfer.tokenAmount,
        tokenPriceUSD: transfer.tokenPriceUSD,
        tokenValueUSD: transfer.tokenValueUSD,
      }) as IUserInvestmentTransfers)

    let baseInvestment: IUserInvestmentInfo = {
      investmentType: e.investmentType,
      investedAt: e.block_timestamp,
      transfers,
    }

    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as unknown as IFarmTransaction

        return {
          ...baseInvestment,

          farmName: e.name.split(' ')[0],
          positionId: farmTx.positionId,

          vaultAddress: farmTx.vaultAddress,
          principalSymbol: farmTx.principalSymbol,
          principalAmount: farmTx.principalAmount,

          stratAddress: farmTx.stratAddress,
          stratSymbol: farmTx.stratSymbol,
          stratAmount: farmTx.stratAmount,

          borrowAmount: farmTx.borrowAmount,

          depositValueUSD: _.sumBy(e.transferInfos, 'tokenValueUSD') ?? 0,
          equityValueUSD: _.sumBy(e.transferInfos, 'equityValueUSD') ?? 0,
          profitValueUSD: _.sumBy(e.transferInfos, 'profitValueUSD') ?? 0,
        } as IFarmInvestmentInfo
      case InvestmentTypeObject.lend:
        const lendTx = e as unknown as ILendTransaction
        var pool = getPoolByPoolAddress(lendTx.poolAddress)
        return {
          ...baseInvestment,

          poolId: pool.id,
          poolName: `${pool.stakingToken}-${pool.rewardToken}`,
          poolAddress: lendTx.poolAddress,

          depositTokenSymbol: lendTx.depositTokenSymbol,
          depositAmount: _.sumBy(e.transferInfos, 'tokenAmount') || 0,
          depositValueUSD: _.sumBy(e.transferInfos, 'tokenValueUSD') || 0,
        } as ILendInvestmentInfo
      case InvestmentTypeObject.stake:
        const stakeTx = e as unknown as IStakeTransaction
        var pool = getPoolByPoolId(stakeTx.poolId)
        return {
          ...baseInvestment,

          poolId: pool.id,
          poolName: `${pool.stakingToken}-${pool.rewardToken}`,
          poolAddress: getPoolByPoolId(stakeTx.poolId),

          fairLaunchAddress: stakeTx.fairLaunchAddress,

          stakeTokenSymbol: stakeTx.stakeTokenSymbol,
          stakeAmount: _.sumBy(e.transferInfos, 'tokenAmount') || 0,
          stakeValueUSD: _.sumBy(e.transferInfos, 'tokenValueUSD') || 0,

          rewardTokenAddress: stakeTx.rewardTokenAddress,
          rewardTokenSymbol: stakeTx.rewardTokenSymbol,
          rewardAmount: stakeTx.rewardAmount,
          rewardValueUSD: stakeTx.rewardValueUSD,
        } as unknown as IStakeInvestmentInfo
      default:
        return null
    }
  })

  return userInvestmentInfos.filter(e => e)
}
