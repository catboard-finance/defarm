import _ from "lodash"
import { withDirection, filterInvestmentTransfers, getSymbolsFromTransfers, withPriceUSD } from ".."
import { getTransactions, getTransfers } from "../../account"
import { fetchPriceUSD } from "../../coingecko"
import { ITransferInfo } from "../../type"
import { ITransactionInfo, withMethods, withType, withPosition, withSymbol } from "../utils/transaction"
import { getStratAddressTokenAddressMap } from "../utils/transfer"
import { ITransactionTransferInfo } from "./farms"

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

export const getTransactionTransferInfo = async (transactionInfos: ITransactionInfo[], transferInfos: ITransferInfo[]) => {
  // Prepare symbol map from transfer
  const stratAddressTokenAddressMap = getStratAddressTokenAddressMap(transferInfos)

  // Add token info by tokens address
  transactionInfos = withSymbol(transactionInfos, stratAddressTokenAddressMap)

  ////////////////// PRICES //////////////////

  const symbols = getSymbolsFromTransfers(transferInfos)

  // ib?
  const ibSymbols = symbols.filter(symbol => symbol.startsWith('ib'))
  const ibQuoteSymbols = ibSymbols.map(symbol => symbol.slice(2))
  const erc20Symbols = symbols.filter(symbol => !symbol.startsWith('ib'))
  const mixedSymbols = [...Array.from(new Set([...erc20Symbols, ...ibQuoteSymbols]))]
  const symbolPriceUSDMap = await fetchPriceUSD(mixedSymbols)

  // Hotfix ib price
  if (ibSymbols.length > 0) {
    // Just use base price for now, TODO : multiply with ib price
    ibSymbols.forEach((symbol, i) => {
      symbolPriceUSDMap[symbol] = symbolPriceUSDMap[ibQuoteSymbols[i]]
    })
  }

  // Apply price in USD
  transferInfos = withPriceUSD(transferInfos, symbolPriceUSDMap) as ITransferInfo[]

  const transferGroup = _.groupBy(transferInfos, 'block_number')
  const transactionTransferInfo = transactionInfos.map(e => ({
    ...e,
    transferInfos: transferGroup[e.block_number]
  })) as unknown as ITransactionTransferInfo[]

  return transactionTransferInfo
}
