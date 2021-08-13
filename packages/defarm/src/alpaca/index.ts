
import { Chain } from "@defillama/sdk/build/general";
import { readBlockLendsBySymbols, IBSCAlpacaLends, getTokenFormIBSymbol } from "./core";
import BigNumber from "bignumber.js";
import { fetchTokenUSDPricesBySymbols as pancakeswap_fetchTokenUSDPricesBySymbols } from "../pancakeswap";

export { getSupportedSymbols } from './core'

export const fetchLendsBySymbols = async (symbols: string[] = null, digit: number = 18, block = 'latest', chain: Chain = 'bsc'): Promise<IBSCAlpacaLends[]> => {
  // Convert to symbol if get ibSymbol as input e.g. ibALPACA → ALPACA
  const notIBSymbols = Array.from(new Set(symbols.map(symbol => getTokenFormIBSymbol(symbol)?.unstakingToken || symbol)))

  const lendsAndPrices = Promise.all([
    readBlockLendsBySymbols(notIBSymbols, block, chain),
    pancakeswap_fetchTokenUSDPricesBySymbols(notIBSymbols)
  ])

  const [lends, prices] = await lendsAndPrices

  const results = lends.map((lend) => {
    const price = prices.find(price => price.symbol === lend.inputToken.symbol)
    const busdPrice = new BigNumber(price.busdPrice)
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

export const fetchTokenUSDPricesBySymbols = async (symbols: string[]) => {
  const lends = await fetchLendsBySymbols(symbols)
  const tokens = lends.map(lend => lend.inputToken).concat(lends.map(lend => lend.outputToken))
  const prices = symbols.map(symbol => {
    const token = tokens.find(token => symbol === token.symbol)
    if (!token) return {
      symbol,
    }

    return {
      symbol: token.symbol,
      address: null,
      busdPrice: token.busdPrice,
    }
  })

  return prices
}