import { withDirection, filterInvestmentTransfers, getSymbolsFromTransfers, withPriceUSD } from ".."
import { getTransactions, getTransfers } from "../../account"
import { fetchPriceUSD } from "../../coingecko"
import { ITransferInfo } from "../../type"
import { ITransactionInfo, withMethods, withType, withPosition, withSymbol } from "../utils/transaction"
import { getStratAddressTokenAddressMap } from "../utils/transfer"

export const getTransactionInfos = async (account: string): Promise<ITransactionInfo[]> => {
  // Get transactions
  const transactions = await getTransactions(account)

  // Decode methods
  let transactionInfos = await withMethods(transactions)

  // Separate actions lend/stake/farm by vault address and method
  transactionInfos = await withType(transactionInfos)

  ////////////////// POSITIONS //////////////////

  // Get position from event by block number
  transactionInfos = await withPosition(transactionInfos)

  return transactionInfos
}

export const getTransferInfos = async (account: string): Promise<ITransferInfo[]> => {
  // Get transfer and gathering symbol
  const transfers = await getTransfers(account)
  let transferInfos = withDirection(account, transfers)
  transferInfos = filterInvestmentTransfers(transferInfos) as ITransferInfo[]

  return transferInfos as ITransferInfo[]
}

export interface IInvestmentInfo extends ITransactionInfo {

}

export const getInvestmentInfos = async (transactionInfos: ITransactionInfo[], transferInfos: ITransferInfo[]): Promise<IInvestmentInfo[]> => {
  // Prepare symbol map from transfer
  const stratAddressTokenAddressMap = getStratAddressTokenAddressMap(transferInfos)

  // Add token info by tokens address
  transactionInfos = withSymbol(transactionInfos, stratAddressTokenAddressMap)

  ////////////////// PRICES //////////////////

  const symbols = getSymbolsFromTransfers(transferInfos)
  const symbolPriceUSDMap = await fetchPriceUSD(symbols)

  // Apply price in USD
  transferInfos = withPriceUSD(transferInfos, symbolPriceUSDMap) as ITransferInfo[]

  return transactionInfos
}
