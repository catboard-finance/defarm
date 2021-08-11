
import { Chain } from "@defillama/sdk/build/general";
import { readBlockLendsBySymbols, IBSCAlpacaLends } from "./core";
import BigNumber from "bignumber.js";
import { fetchTokenUSDPricesBySymbols } from "../pancakeswap";

export const fetchLendsBySymbols = async (symbols: string[] = null, digit: number = 18, block = 'latest', chain: Chain = 'bsc'): Promise<IBSCAlpacaLends[]> => {
  const lendsAndPrices = Promise.all([
    readBlockLendsBySymbols(symbols, block, chain),
    fetchTokenUSDPricesBySymbols(symbols)
  ])

  const [lends, prices] = await lendsAndPrices

  const results = lends.map((lend, i) => {
    const busdPrice = new BigNumber(prices[i])
    const inputToken_busdPrice = busdPrice.toFixed(digit)
    const outputToken_busdPrice = busdPrice.times(lend.ibTokenPrice).toFixed(digit)

    return {
      ...lend,
      inputToken: {
        ...lend.inputToken,
        busdPrice: inputToken_busdPrice
      },
      outputToken: {
        ...lend.outputToken,
        busdPrice: outputToken_busdPrice
      }
    }
  })

  return results
}
