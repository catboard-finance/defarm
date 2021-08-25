import POOLS from './pools.json'
import TOKENS from './tokens.json'

import pools_abi from './abi/pools.abi.json'
import { api } from '@defillama/sdk'
import { Chain } from '@defillama/sdk/build/general'

export type Token = {
  symbol: string
  decimals: number
  busdPrice?: string
  address: string
}

export interface IBSCAlpacaLends {
  // lpSymbol: string
  address: string
  inputToken: Token,
  outputToken: Token,
  ibTokenPrice: string
}

export interface IPoolAddress {
  address: string
}

export interface IIbPool {
  id: number
  address: string
  stakingToken: string
  unstakingToken: string
}

const IB_ONLY_POOLS = POOLS.filter(pool => pool.stakingToken.startsWith('ib'))
export const IB_POOLS: IIbPool[] = IB_ONLY_POOLS.map((pool) => {
  return {
    id: pool.id,
    address: pool.address,
    stakingToken: pool.stakingToken,
    unstakingToken: pool.stakingToken.slice(2),
  }
})

const _TOKEN_LOWER_MAP = Object.assign({}, ...Object.keys(TOKENS).map(k => ({ [`${TOKENS[k].toLowerCase()}`]: k })))
export const getSymbolsFromAddresses = (addresses: string[]) => addresses.map(e => _TOKEN_LOWER_MAP[e])

export const getTokenFromPoolAddress = (address: string) => IB_POOLS.find(pool => pool.address.toLowerCase() === address.toLowerCase())

export const getTokenFromIBSymbol = (symbol: string) => IB_POOLS.find(pool => pool.stakingToken.toUpperCase() === symbol.toUpperCase())

export const getSupportedUSDSymbols = () => IB_ONLY_POOLS.map(pool => pool.stakingToken)

export const filterSupportedSymbols = (symbols: string[] = null) => {
  return symbols ? POOLS.filter(pool => symbols.includes(pool.stakingToken.slice(2))) : POOLS
}

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
