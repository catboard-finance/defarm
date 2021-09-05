import _ from "lodash"
import { withDirection, filterInvestmentTransfers, getUniqueSymbolsFromTransfers, withPriceUSD } from ".."
import { getTransactions, getTransfers } from "../../account"
import { fetchPriceUSD } from "../../coingecko"
import { ITransferInfo } from "../../type"
import { ITransactionInfo, withMethods, withType, withPosition, withSymbol, withReward, withRewardPriceUSD } from "../utils/transaction"
import { getTokenInfoFromTransferAddressMap } from "../utils/transfer"
import { withDebt } from "../vaults/debt"
import { ITransactionTransferInfo } from "./investment"

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

  // Get debt/collateral from position
  transactionInfos = await withDebt(transactionInfos)

  return transactionInfos
}

export const getTransferInfos = async (account: string): Promise<ITransferInfo[]> => {
  // Get transfer and gathering symbol
  const transfers = await getTransfers(account)
  let transferInfos = withDirection(account, transfers)
  transferInfos = filterInvestmentTransfers(transferInfos) as ITransferInfo[]

  return transferInfos as ITransferInfo[]
}

export const getTransactionTransferInfo = async (account: string, transactionInfos: ITransactionInfo[], transferInfos: ITransferInfo[]) => {
  // Prepare symbol map from transfer
  const tokenInfoFromTransferAddressMap = getTokenInfoFromTransferAddressMap(transferInfos)

  // Add token info by tokens address
  transactionInfos = withSymbol(transactionInfos, tokenInfoFromTransferAddressMap)

  ////////////////// REWARDS //////////////////

  transactionInfos = await withReward(account, transactionInfos)

  ////////////////// PRICES //////////////////

  const symbols = getUniqueSymbolsFromTransfers(transferInfos)

  // ib?
  const ibSymbols = symbols.filter(symbol => symbol.startsWith('ib'))
  const ibPairedSymbols = ibSymbols.map(symbol => symbol.slice(2))
  const otherSymbols = symbols.filter(symbol => !symbol.startsWith('ib'))
  const mixedSymbols = [...Array.from(new Set([...otherSymbols, ...ibPairedSymbols]))]
  const symbolPriceUSDMap = await fetchPriceUSD(mixedSymbols)

  // Hotfix ib price
  if (ibSymbols.length > 0) {
    // Just use base price for now, TODO : multiply with ib price
    ibSymbols.forEach((symbol, i) => {
      symbolPriceUSDMap[symbol] = symbolPriceUSDMap[ibPairedSymbols[i]]
    })
  }

  // Apply price in USD to transfers
  transferInfos = withPriceUSD(transferInfos, symbolPriceUSDMap) as ITransferInfo[]

  // Apply price in USD to rewards
  transactionInfos = withRewardPriceUSD(transactionInfos, symbolPriceUSDMap)

  // Group transfers by block number
  const transferGroup = _.groupBy(transferInfos, 'block_number')
  let transactionTransferInfo = transactionInfos.map(e => ({
    ...e,
    transferInfos: transferGroup[e.block_number]
  })) as unknown as ITransactionTransferInfo[]

  return transactionTransferInfo
}
