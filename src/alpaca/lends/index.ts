
import { Chain } from "@defillama/sdk/build/general";
import { getLendsBySymbols, IBSCAlpacaLends, getTokenFromIBSymbol, Token } from "../core";
import BigNumber from "bignumber.js";
import { fetchTokenUSDPricesBySymbols as pancakeswap_fetchTokenUSDPricesBySymbols } from "../../pancakeswap";

export const fetchLendsBySymbols = async (symbols: string[] = null, digit: number = 18, block = 'latest', chain: Chain = 'bsc'): Promise<IBSCAlpacaLends[]> => {
  // Convert to symbol if get ibSymbol as input e.g. ibALPACA → ALPACA
  const notIBSymbols = [...Array.from(new Set(symbols.map(symbol => getTokenFromIBSymbol(symbol)?.rewardToken || symbol)))]

  const lendsAndPrices = Promise.all([
    getLendsBySymbols(notIBSymbols, block, chain),
    pancakeswap_fetchTokenUSDPricesBySymbols(notIBSymbols)
  ])

  const [lends, prices] = await lendsAndPrices

  const results = lends.map((lend) => {
    const price = prices.find(price => price.symbol.toUpperCase() === lend.inputToken.symbol.toUpperCase())
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

export const fetchTokenUSDPricesBySymbols = async (symbols: string[]): Promise<Token[]> => {
  const lends = await fetchLendsBySymbols(symbols)
  const tokens = lends.map(lend => lend.inputToken).concat(lends.map(lend => lend.outputToken))
  const prices = symbols.map(symbol => {
    const token = tokens.find(token => symbol.toUpperCase() === token.symbol.toUpperCase())
    if (!token) return {
      symbol,
      address: null,
      busdPrice: null,
      decimals: null,
    }

    return token
  })

  return prices
}