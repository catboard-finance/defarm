import { fetchTokenUSDPricesBySymbols } from "../../pancakeswap"
import { ITransfer } from "../../type"
import { getSymbolsFromAddresses } from "../core"


export const getSymbolPriceUSDMapByAddresses = async (transfers: ITransfer[]) => {
  const tokenAddresses: string[] = [...Array.from(new Set(transfers.map(tx => tx.address)))]
  return getSymbolPriceUSDMap(tokenAddresses)
}

export const getSymbolPriceUSDMap = async (tokenAddresses: string[]) => {
  const tokenSymbols = getSymbolsFromAddresses(tokenAddresses)

  // Get current usd price
  const tokenPriceUSDs = await fetchTokenUSDPricesBySymbols(tokenSymbols)
  const symbolPriceUSDMap = {}
  tokenPriceUSDs.forEach((e, i) => symbolPriceUSDMap[tokenAddresses[i]] = e)
  return symbolPriceUSDMap
}