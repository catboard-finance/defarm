import { fetchTokenUSDPricesBySymbols } from "../../pancakeswap"
import { ITransfer } from "../../type"
import { getAddressesFromTransfers, getSymbolsFromAddresses } from "../core"

export const getSymbolPriceUSDMapByAddresses = async (transfers: ITransfer[]) => {
  const tokenAddresses = getAddressesFromTransfers(transfers)
  const tokenSymbols = getSymbolsFromAddresses(tokenAddresses)

  // Get current usd price
  const tokenPriceUSDs = await fetchTokenUSDPricesBySymbols(tokenSymbols)
  const symbolPriceUSDMap = {}
  tokenPriceUSDs.forEach((e, i) => symbolPriceUSDMap[tokenAddresses[i]] = e)
  return symbolPriceUSDMap
}
