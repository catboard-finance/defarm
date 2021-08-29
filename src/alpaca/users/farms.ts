import _ from "lodash"
import { ITransferInfo } from "../../type"
import { IFarmTransaction, InvestmentTypeObject } from "../utils/transaction"

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

export interface IUserInvestmentInfo {
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

  transfers: IUserInvestmentTransfers[],

  positionedAt: string // "2021-08-07T14:45:51.000Z",
}

export interface ITransactionTransferInfo extends IFarmTransaction {
  transferInfos: ITransferInfo[]
}

export const getUserInvestmentInfos = async (transactionTransferInfo: ITransactionTransferInfo[]): Promise<IUserInvestmentInfo[]> => {

  const userInvestmentInfo = transactionTransferInfo.map(e => {
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

    switch (e.investmentType) {
      case InvestmentTypeObject.farms:
        const farmTx = e as IFarmTransaction

        return {
          positionId: farmTx.positionId,

          depositValueUSD: _.sumBy(e.transferInfos, 'tokenPriceUSD'),
          equityValueUSD: _.sumBy(e.transferInfos, 'equityValueUSD'),
          debtValueUSD: _.sumBy(e.transferInfos, 'debtValueUSD'),
          profitValueUSD: _.sumBy(e.transferInfos, 'profitValueUSD'),

          vaultAddress: farmTx.vaultAddress,
          vaultTokenSymbol: farmTx.principalSymbol,
          principalAmount: farmTx.principalAmount,

          stratAddress: farmTx.stratAddress,
          stratTokenSymbol: farmTx.stratSymbol,
          stratAmount: farmTx.stratAmount,

          borrowAmount: farmTx.borrowAmount,

          positionedAt: farmTx.block_timestamp,

          transfers,
        }
      case InvestmentTypeObject.lends:
      // TODO
      case InvestmentTypeObject.stakes:
      // TODO
      default:
        return null
    }
  })

  return userInvestmentInfo
}
