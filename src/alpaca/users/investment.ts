import _ from "lodash"
import { ITransferInfo } from "../../type"
import { getPoolByPoolAddress, getPoolByPoolId } from "../core"
import { IFarmTransaction, ILendTransaction, InvestmentTypeObject, IStakeTransaction, ITransactionInfo } from "../utils/transaction"

export interface IUserInvestmentTransfer {
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

  // depositValueUSD: number // 1000,
  totalInvestValueUSD: number // 1000,

  stratAddress: string // "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90",
  stratSymbol: string // "CAKE",
  stratAmount: number // 128,
  stratValueUSD: number // 2560,

  vaultAddress: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  principalSymbol: string // "USDT",
  principalAmount: number // 0,
  principalValueUSD: number // 0,

  borrowValueUSD: number // 0,
}

export interface ILendInvestmentInfo extends IUserInvestmentInfo {
  poolId: number
  poolName: string
  poolAddress: string

  depositSymbol: string

  totalDepositAmount?: number
  totalDepositValueUSD?: number
}

export interface IStakeInvestmentInfo extends IUserInvestmentInfo {
  fairLaunchAddress: string

  poolId: number
  poolName: string
  poolAddress: string

  stakeSymbol: string
  stakeAmount: number
  stakeValueUSD: number

  unstakeSymbol: string

  totalStakeAmount: number
  totalStakeValueUSD: number

  rewardTokenAddress: string
  rewardSymbol: string
  rewardAmount: number
  rewardValueUSD: number
}

export interface IUserInvestmentInfo {
  investmentType: InvestmentTypeObject
  transfers: IUserInvestmentTransfer[],

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
      }) as IUserInvestmentTransfer)

    const baseInvestment: IUserInvestmentInfo = {
      investmentType: e.investmentType,
      investedAt: e.block_timestamp,
      transfers,
    }

    const spendingTransfers = e.transferInfos.filter(e => e.direction === 'out')

    switch (e.investmentType) {
      case InvestmentTypeObject.farm:
        const farmTx = e as unknown as IFarmTransaction

        const farmNames = e.name.split(' ')
        const farmName = farmNames[1] === 'CakeMaxiWorker' ? `CAKE^${farmNames[0]}` : farmNames[0]

        return {
          ...baseInvestment,

          farmName,
          positionId: farmTx.positionId,

          vaultAddress: farmTx.vaultAddress,
          principalSymbol: farmTx.principalSymbol,
          principalAmount: farmTx.principalAmount,
          principalValueUSD: farmTx.principalValueUSD,

          stratAddress: farmTx.stratAddress,
          stratSymbol: farmTx.stratSymbol,
          stratAmount: farmTx.stratAmount,
          stratValueUSD: farmTx.stratValueUSD,

          borrowValueUSD: farmTx.borrowAmount,

          totalInvestValueUSD: _.sumBy(spendingTransfers, 'tokenValueUSD') ?? 0,
          totalDebtValueUSD: farmTx.borrowValueUSD,
        } as IFarmInvestmentInfo
      case InvestmentTypeObject.lend:
        const lendTx = e as unknown as ILendTransaction
        var pool = getPoolByPoolAddress(lendTx.poolAddress)

        return {
          ...baseInvestment,

          poolId: pool.id,
          poolName: `${pool.stakingToken}-${pool.unstakeToken}`,
          poolAddress: lendTx.poolAddress,

          depositSymbol: lendTx.depositSymbol,

          totalDepositAmount: _.sumBy(spendingTransfers, 'tokenAmount') ?? 0,
          totalDepositValueUSD: _.sumBy(spendingTransfers, 'tokenValueUSD') ?? 0,
        } as ILendInvestmentInfo
      case InvestmentTypeObject.stake:
        const stakeTx = e as unknown as IStakeTransaction
        var pool = getPoolByPoolId(stakeTx.poolId)

        return {
          ...baseInvestment,

          poolId: pool.id,
          poolName: `${pool.stakingToken}-${pool.unstakeToken}`,
          poolAddress: stakeTx.poolAddress,

          fairLaunchAddress: stakeTx.fairLaunchAddress,

          stakeSymbol: stakeTx.stakeSymbol,

          totalStakeAmount: _.sumBy(spendingTransfers, 'tokenAmount') ?? 0,
          totalStakeValueUSD: _.sumBy(spendingTransfers, 'tokenValueUSD') ?? 0,

          unstakeSymbol: stakeTx.stakeSymbol,
        } as IStakeInvestmentInfo
      default:
        return null
    }
  })

  return userInvestmentInfos.filter(e => e)
}
