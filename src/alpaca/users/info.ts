import _ from "lodash"
import { filterInvestmentTransfers, getUniqueSymbolsFromTransactions, getUniqueSymbolsFromTransfers } from ".."
import { getTransactions, getTransfers } from "../../account"
import { fetchPriceUSD, fetchRecordedPriceUSD } from "../../coingecko"
import { ITransferInfo } from "../../type"
import { ITransactionInfo, withMethod, withType, withRecordedPosition, withSymbol, withTransactionFlatPriceUSD, withRecordedTransactionPriceUSD } from "../utils/transaction"
import { withDirection, withPriceUSD, withRecordedPriceUSD } from "../utils/transfer"
import { ITransactionTransferInfo } from "./investment"

export const getTransactionInfos = async (account: string): Promise<ITransactionInfo[]> => {
  // Get transactions
  const transactions = await getTransactions(account)

  // Decode methods
  let transactionInfos = await withMethod(transactions)

  // Separate actions lend/stake/farm by vault address and method
  transactionInfos = await withType(transactionInfos)

  ////////////////// POSITIONS //////////////////

  // Get position/debt from event by block number
  transactionInfos = await withRecordedPosition(transactionInfos)

  return transactionInfos
}

export const getTransferInfos = async (account: string): Promise<ITransferInfo[]> => {
  // Get transfer and gathering symbol
  const transfers = await getTransfers(account)
  let transferInfos = withDirection(account, transfers)
  transferInfos = filterInvestmentTransfers(account, transferInfos).map(e => ({
    ...e,
    tokenAddress: e.address,
  }) as ITransferInfo)

  return transferInfos as ITransferInfo[]
}

export const getTransactionTransferInfos = async (transactionInfos: ITransactionInfo[], transferInfos: ITransferInfo[]) => {

  // Add token info by tokens address
  transactionInfos = withSymbol(transactionInfos, transferInfos)

  // TODO: use withSymbol with transferInfos

  ////////////////// PRICES //////////////////

  const { symbols: tf_symbols, symbolSlugYMDs: tf_symbolSlugYMDs } = getUniqueSymbolsFromTransfers(transferInfos)
  const { symbols: tx_symbols, symbolSlugYMDs: tx_symbolSlugYMDs } = getUniqueSymbolsFromTransactions(transactionInfos)

  const symbols = _.uniq([...tf_symbols, ...tx_symbols])
  const symbolSlugYMDs = _.uniq([...tf_symbolSlugYMDs, ...tx_symbolSlugYMDs])

  // ib?
  const noib_symbolSlugYMDs = symbolSlugYMDs.map(symbol => symbol.startsWith('BSC:ib') ? symbol.replace('BSC:ib', 'BSC:') : symbol)

  // Get historical price by symbol and date
  let _error
  const symbolSlugYMDPriceUSDMap = await fetchRecordedPriceUSD(noib_symbolSlugYMDs).catch(e => _error = e)

  // Fallback to current price
  if (_error) {
    console.error(_error)

    // ib?
    const ibSymbols = symbols.filter(symbol => symbol.startsWith('ib'))
    const ibPairedSymbols = ibSymbols.map(symbol => symbol.slice(2))
    const otherSymbols = symbols.filter(symbol => !symbol.startsWith('ib'))
    const mixedSymbols = [...Array.from(new Set([...otherSymbols, ...ibPairedSymbols]))]

    const symbolPriceUSDMap = await fetchPriceUSD(mixedSymbols)

    transferInfos = withPriceUSD(transferInfos, symbolPriceUSDMap)

    // Hotfix ib price
    if (ibSymbols.length > 0) {
      // Just use base price for now, TODO : multiply with ib price
      ibSymbols.forEach((symbol, i) => {
        symbolPriceUSDMap[symbol] = symbolPriceUSDMap[ibPairedSymbols[i]]
      })
    }

    // Apply price in USD to transactions
    transactionInfos = withTransactionFlatPriceUSD(transactionInfos, symbolPriceUSDMap)
  } else {
    // Apply historical price in USD to transfers
    transferInfos = withRecordedPriceUSD(transferInfos, symbolSlugYMDPriceUSDMap)

    // Apply price in USD to transactions
    transactionInfos = withRecordedTransactionPriceUSD(transactionInfos, symbolSlugYMDPriceUSDMap)
  }

  // Group transfers by block number
  const transferGroup = _.groupBy(transferInfos, 'block_number')
  let transactionTransferInfos = transactionInfos.map(e => ({
    ...e,
    transferInfos: transferGroup[e.block_number]
  })) as unknown as ITransactionTransferInfo[]

  return transactionTransferInfos
}
