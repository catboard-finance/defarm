import _ from "lodash"
import { ITransferInfo } from "../../type"
import { IFarmTransaction, InvestmentTypeObject, IStakeTransaction } from "../utils/transaction"

export interface IUserInvestmentTransfers {
  blockNumber: string
  fromAddress: string // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  toAddress: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  direction: string // "out",
  tokenSymbol: string // "CAKE",
  tokenAddress: string // "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
  tokenAmount: number // 1272.6522003096,
  tokenPriceUSD: number // 1527.12000,
}

export interface IFarmInvestmentInfo extends IUserInvestmentInfo {
  positionId: string // "9967403",

  depositValueUSD: number // 1000,
  equityValueUSD: number // 1000,
  debtValueUSD: number // 100,
  profitValueUSD: number // 900,

  vaultAddress: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  vaultTokenSymbol: string // "USDT",
  principalAmount: number // 0,

  stratAddress: string // "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90",
  stratTokenSymbol: string // "CAKE",
  stratAmount: number // 128,

  borrowAmount: number // 0,
}

export interface ILendInvestmentInfo extends IUserInvestmentInfo {

}

export interface IStakeInvestmentInfo extends IUserInvestmentInfo {

}

export interface IUserInvestmentInfo {
  investmentType: InvestmentTypeObject
  transfers: IUserInvestmentTransfers[],

  positionedAt: string // "2021-08-07T14:45:51.000Z",
}

export interface ITransactionTransferInfo extends IFarmTransaction {
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
      }) as IUserInvestmentTransfers)

    let baseInvestment: IUserInvestmentInfo = {
      investmentType: e.investmentType,
      positionedAt: e.block_timestamp,
      transfers,
    }

    switch (e.investmentType) {
      case InvestmentTypeObject.farms:
        const farmTx = e as IFarmTransaction

        return {
          ...baseInvestment,

          investmentType: farmTx.investmentType,
          positionId: farmTx.positionId,

          depositValueUSD: _.sumBy(e.transferInfos, 'tokenValueUSD') || 0,
          equityValueUSD: _.sumBy(e.transferInfos, 'equityValueUSD') || 0,
          debtValueUSD: _.sumBy(e.transferInfos, 'debtValueUSD') || 0,
          profitValueUSD: _.sumBy(e.transferInfos, 'profitValueUSD') || 0,

          vaultAddress: farmTx.vaultAddress,
          vaultTokenSymbol: farmTx.principalSymbol,
          principalAmount: farmTx.principalAmount,

          stratAddress: farmTx.stratAddress,
          stratTokenSymbol: farmTx.stratSymbol,
          stratAmount: farmTx.stratAmount,

          borrowAmount: farmTx.borrowAmount,

          positionedAt: farmTx.block_timestamp,
        } as IFarmInvestmentInfo
      case InvestmentTypeObject.lends:
        return {
          ...baseInvestment,
        } as ILendInvestmentInfo
      case InvestmentTypeObject.stakes:
        const stakeTx = e as unknown as IStakeTransaction
        return {
          ...baseInvestment,

          fairLaunchAddress: stakeTx.fairLaunchAddress,

          depositTokenSymbol: stakeTx.depositTokenSymbol,
          depositAmount: _.sumBy(e.transferInfos, 'tokenAmount') || 0,
          depositValueUSD: _.sumBy(e.transferInfos, 'tokenValueUSD') || 0,
        } as IStakeInvestmentInfo
      default:
        return null
    }
  })

  return userInvestmentInfos.filter(e => e)
}
