import _ from "lodash"
import { filterInvestmentTransfers, getUniqueSymbolsFromTransfers } from ".."
import { getTransactions, getTransfers } from "../../account"
import { fetchPriceUSD, fetchRecordedPriceUSD } from "../../coingecko"
import { ITransferInfo } from "../../type"
import { ITransactionInfo, withMethod, withType, withRecordedPosition, withSymbol, withTransactionPriceUSD } from "../utils/transaction"
import { getTokenInfoFromTransferAddressMap, withDirection, withPriceUSD, withRecordedPriceUSD } from "../utils/transfer"
import { ITransactionTransferInfo } from "./investment"

export const cachedPrice = {
  symbolPriceUSDMap: {},
  symbolSlugYMDPriceUSDMap: {},
}

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
  transferInfos = filterInvestmentTransfers(transferInfos) as ITransferInfo[]

  return transferInfos as ITransferInfo[]
}

export const getTransactionTransferInfos = async (transactionInfos: ITransactionInfo[], transferInfos: ITransferInfo[]) => {

  // Prepare symbol map from transfer
  const tokenInfoFromTransferAddressMap = getTokenInfoFromTransferAddressMap(transferInfos)

  // Add token info by tokens address
  transactionInfos = withSymbol(transactionInfos, tokenInfoFromTransferAddressMap)

  ////////////////// PRICES //////////////////

  const { symbols, symbolSlugYMDs } = getUniqueSymbolsFromTransfers(transferInfos)

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

    cachedPrice.symbolPriceUSDMap = await fetchPriceUSD(mixedSymbols)

    transferInfos = withPriceUSD(transferInfos, cachedPrice.symbolPriceUSDMap)

    // Hotfix ib price
    if (ibSymbols.length > 0) {
      // Just use base price for now, TODO : multiply with ib price
      ibSymbols.forEach((symbol, i) => {
        cachedPrice.symbolPriceUSDMap[symbol] = cachedPrice.symbolPriceUSDMap[ibPairedSymbols[i]]
      })
    }

    // Apply price in USD to transactions
    transactionInfos = withTransactionPriceUSD(transactionInfos, cachedPrice.symbolPriceUSDMap)
  } else {
    cachedPrice.symbolSlugYMDPriceUSDMap = symbolSlugYMDPriceUSDMap

    // Apply historical price in USD to transfers
    transferInfos = withRecordedPriceUSD(transferInfos, cachedPrice.symbolSlugYMDPriceUSDMap)

    // TODO: Hotfix ib price


    // TODO: Apply price in USD to transactions
  }

  // Group transfers by block number
  const transferGroup = _.groupBy(transferInfos, 'block_number')
  let transactionTransferInfos = transactionInfos.map(e => ({
    ...e,
    transferInfos: transferGroup[e.block_number]
  })) as unknown as ITransactionTransferInfo[]

  return transactionTransferInfos
}
