
import { Chain } from "@defillama/sdk/build/general";
import { IBSCAlpacaLends, getIBPoolByIBSymbol, Token, filterSupportedSymbols, IPoolAddress } from "../core";
import BigNumber from "bignumber.js";
import { fetchTokenUSDPricesBySymbols as pancakeswap_fetchTokenUSDPricesBySymbols } from "../../pancakeswap";
import { api } from "@defillama/sdk";

import pools_abi from '../abi/pools.abi.json'

export const getLendsBySymbols = async (symbols: string[] = null, block = 'latest', chain: Chain = 'bsc'): Promise<IBSCAlpacaLends[]> => {
  const pools = filterSupportedSymbols(symbols)
  const lends = await getLendsByPoolAddresses(block, chain, pools)
  if (!lends || lends.length <= 0) return []
  return lends
}

export const getLendsByPoolAddresses = async (block = 'latest', chain: Chain = 'bsc', pools: IPoolAddress[]): Promise<IBSCAlpacaLends[]> => {
  const abi = {}
  pools_abi.forEach(pool => abi[`${pool.name}`] = pool)

  const calls = pools.map((pool) => ({ target: pool.address }))

  const tokens = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi["token"],
      chain,
    })
  ).output;

  const symbols = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi["symbol"],
      chain,
    })
  ).output;

  const totalSupplies = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi["totalSupply"],
      chain,
    })
  ).output;

  const totalTokens = (
    await api.abi.multiCall({
      // @ts-ignore
      block,
      calls,
      abi: abi["totalToken"],
      chain,
    })
  ).output;

  // only ib
  const result = pools.map((pool, i) => {
    const token: string = tokens[i].output
    const symbol: string = symbols[i].output
    if (!symbol.startsWith('ib')) return null

    const symbolA = symbol.split('ib')[1]

    const totalSupply: number = totalSupplies[i].output
    const totalToken: number = totalTokens[i].output
    if (!totalSupply || !totalToken) return null

    const ibTokenPrice = totalSupply ? (totalToken / totalSupply) : null

    return {
      address: pool.address,
      inputToken: {
        symbol: symbolA,
        address: token,
        decimals: 18,
      },
      outputToken: {
        symbol,
        address: pool.address,
        decimals: 18,
      },
      ibTokenPrice: ibTokenPrice.toString(),
    }
  })
    // no null
    .filter(pool => pool)

  return result
}

export const fetchLendsBySymbols = async (symbols: string[] = null, digit: number = 18, block = 'latest', chain: Chain = 'bsc'): Promise<IBSCAlpacaLends[]> => {
  // Convert to symbol if get ibSymbol as input e.g. ibALPACA → ALPACA
  const notIBSymbols = [...Array.from(new Set(symbols.map(symbol => getIBPoolByIBSymbol(symbol)?.unstakingToken || symbol)))]

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