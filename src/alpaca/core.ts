import POOLS from './pools.json'
import TOKENS from './tokens.json'

import pools_abi from './abi/pools.abi.json'
import { api } from '@defillama/sdk'
import { Chain } from '@defillama/sdk/build/general'
import { ITransfer } from '../type'

export const VAULT_ADDRESS = '0x7C9e73d4C71dae564d41F78d56439bB4ba87592f';
export const FAIR_LAUNCH_ADDRESS = '0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F';

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
  rewardToken: string
}

const IB_ONLY_POOLS = POOLS.filter(pool => pool.stakingToken.startsWith('ib'))
export const IB_POOLS: IIbPool[] = IB_ONLY_POOLS.map((pool) => {
  return {
    id: pool.id,
    address: pool.address,
    stakingToken: pool.stakingToken,
    rewardToken: pool.stakingToken.slice(2),
  }
})

const _TOKEN_POOLS_LOWER_MAP = Object.assign({}, ...Object.keys(POOLS).map(k => ({ [`${POOLS[k].address.toLowerCase()}`]: POOLS[k].stakingToken })))
const _TOKEN_LOWER_MAP = Object.assign({}, ...Object.keys(TOKENS).map(k => ({ [`${TOKENS[k].toLowerCase()}`]: k })))

const TRANSFER_TOKEN_LOWER_MAP = {
  ..._TOKEN_POOLS_LOWER_MAP,
  ..._TOKEN_LOWER_MAP,
  FAIR_LAUNCH_ADDRESS: 'ALPACA',
}

export const getAddressFromSymbol = (symbol: string): string => TOKENS[symbol]

export const getSymbolFromAddress = (address: string): string => TRANSFER_TOKEN_LOWER_MAP[address.toLowerCase()]

export const getSymbolsFromAddresses = (addresses: string[]): string[] => addresses.map(e => getSymbolFromAddress(e))

export const getPoolByPoolAddress = (address: string) => IB_POOLS.find(pool => pool.address.toLowerCase() === address.toLowerCase())

export const getPoolByPoolId = (id: number) => IB_POOLS.find(pool => pool.id === id)

export const getPoolByStakingTokenSymbol = (symbol: string) => IB_POOLS.find(pool => pool.stakingToken.toUpperCase() === symbol.toUpperCase())

export const getPoolByIBSymbol = (symbol: string) => IB_POOLS.find(pool => pool.stakingToken.toUpperCase() === symbol.toUpperCase())

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

// Transfers

export const getUniqueAddressesFromTransfers = (transfers: ITransfer[]) => [...Array.from(new Set(transfers.map(e => e.address)))]

export const getUniqueSymbolsFromTransfers = (transfers: ITransfer[]) => {
  const tokenAddresses = getUniqueAddressesFromTransfers(transfers)
  const tokenSymbols = getSymbolsFromAddresses(tokenAddresses)
  return tokenSymbols
}

export const getSymbolsFromTransfers = (transfers: ITransfer[]) => {
  const tokenAddresses = transfers.map(e => e.address)
  const tokenSymbols = getSymbolsFromAddresses(tokenAddresses)
  return tokenSymbols
}
