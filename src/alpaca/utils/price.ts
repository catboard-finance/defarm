import { fetchTokenUSDPricesBySymbols } from "../../pancakeswap"
import { ITransfer } from "../../type"
import { getSymbolsFromAddresses } from "../core"

export const getSymbolPriceUSDMapByAddresses = async (transfers: ITransfer[]) => {
  const tokenAddresses: string[] = [...Array.from(new Set(transfers.map(tx => tx.address)))]
  const tokenSymbols = getSymbolsFromAddresses(tokenAddresses)

  // Get current usd price
  const tokenPriceUSDs = await fetchTokenUSDPricesBySymbols(tokenSymbols)
  const symbolPriceUSDMap = {}
  tokenPriceUSDs.forEach((e, i) => symbolPriceUSDMap[tokenAddresses[i]] = e)
  return symbolPriceUSDMap
}
