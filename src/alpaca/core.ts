import POOLS from './pools.json'
import TOKENS from './tokens.json'
import INFO from './info.mainnet.json'

import { ITransfer } from '../type'
import { ITransactionInfo } from './utils/transaction';

export const FAIR_LAUNCH_ADDRESS = INFO.FairLaunch.address;
export const REWARD_TOKEN_SYMBOL = 'ALPACA';

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
  unstakeToken: string
  rewardToken: string
}

export const ALL_POOLS: IIbPool[] = POOLS.map((pool) => {
  return {
    id: pool.id,
    address: pool.address,
    stakingToken: pool.stakingToken,
    unstakeToken: pool.stakingToken.slice(2),
    rewardToken: REWARD_TOKEN_SYMBOL,
  }
}).reverse()

export const IB_POOLS = ALL_POOLS.filter(pool => pool.stakingToken.startsWith('ib'))
export const DEBT_POOLS = ALL_POOLS.filter(pool => pool.stakingToken.startsWith('debt'))

const _TOKEN_POOLS_LOWER_MAP = Object.assign({}, ...Object.keys(POOLS).map(k => ({ [`${POOLS[k].address.toLowerCase()}`]: POOLS[k].stakingToken })))
const _TOKEN_LOWER_MAP = Object.assign({}, ...Object.keys(TOKENS).map(k => ({ [`${TOKENS[k].toLowerCase()}`]: k })))

const TRANSFER_TOKEN_LOWER_MAP = {
  ..._TOKEN_POOLS_LOWER_MAP,
  ..._TOKEN_LOWER_MAP,
  [FAIR_LAUNCH_ADDRESS.toLowerCase()]: REWARD_TOKEN_SYMBOL,
}

export const getAddressFromSymbol = (symbol: string): string => TOKENS[symbol]

export const getSymbolFromAddress = (address: string): string => TRANSFER_TOKEN_LOWER_MAP[address.toLowerCase()]

export const getSymbolsFromAddresses = (addresses: string[]): string[] => addresses.map(e => getSymbolFromAddress(e))

export const getPoolByPoolAddress = (address: string) => ALL_POOLS.find(pool => pool.address.toLowerCase() === address.toLowerCase())

export const getPoolByPoolId = (id: number) => ALL_POOLS.find(pool => pool.id === id)

export const getIBPoolByStakingSymbol = (symbol: string) => IB_POOLS.find(pool => pool.stakingToken.toUpperCase() === symbol.toUpperCase())

export const getDebtPoolBySymbol = (symbol: string) => ALL_POOLS.find(pool => pool.stakingToken.toUpperCase().startsWith(`debtib${symbol}`.toUpperCase()))

export const getIBPoolByIBSymbol = (symbol: string) => IB_POOLS.find(pool => pool.stakingToken.toUpperCase() === symbol.toUpperCase())

export const getSupportedUSDSymbols = () => IB_POOLS.map(pool => pool.stakingToken)

export const filterSupportedSymbols = (symbols: string[] = null) => {
  return symbols ? POOLS.filter(pool => symbols.includes(pool.stakingToken.slice(2))) : POOLS
}

// Transfers

export const getUniqueAddressesFromTransfers = (transfers: ITransfer[]) => [...Array.from(new Set(transfers.map(e => e.address)))]

export const getUniqueSymbolsFromTransfers = (transfers: ITransfer[], chain = 'bsc') => {
  const tokenAddresses = getUniqueAddressesFromTransfers(transfers)
  const ymds = transfers.map(e => new Date(e.block_timestamp).toISOString().slice(0, 10))
  const symbols = getSymbolsFromAddresses(tokenAddresses)
  const symbolSlugYMDs = transfers.map((tf, i) => `${chain.toUpperCase()}:${getSymbolFromAddress(tf.address)}:${ymds[i]}`)
  return { symbols, symbolSlugYMDs }
}

export const getSymbolsFromTransfers = (transfers: ITransfer[]) => {
  const tokenAddresses = transfers.map(e => e.address)
  const tokenSymbols = getSymbolsFromAddresses(tokenAddresses)
  return tokenSymbols
}

export const getSymbolSlugsFromTransfers = (transfers: ITransfer[], chain = 'bsc') => {
  const tokenAddresses = transfers.map(e => e.address)
  const ymds = transfers.map(e => new Date(e.block_timestamp).toISOString().slice(0, 10))
  const symbols = getSymbolsFromAddresses(tokenAddresses).filter(e => e)
  const symbolSlugYMDs = symbols.map((symbol, i) => `${chain.toUpperCase()}:${symbol}:${ymds[i]}`)
  return { symbols, symbolSlugYMDs }
}

export const getUniqueSymbolsFromTransactions = (transactions: ITransactionInfo[], chain = 'bsc') => {
  const ymds = transactions.map(e => new Date(e.block_timestamp).toISOString().slice(0, 10))
  const symbols = Array.from(new Set([
    // TODO: move principalSymbol to IFarmTransactionInfo
    ...transactions.map(e => e['principalSymbol']),
    ...transactions.map(e => e['stratSymbol']),
  ])).filter(e => e)

  let symbolSlugYMDs = []
  transactions.forEach((tf, i) => {
    tf['principalSymbol'] && symbolSlugYMDs.push(`${chain.toUpperCase()}:${tf['principalSymbol']}:${ymds[i]}`)
    tf['stratSymbol'] && symbolSlugYMDs.push(`${chain.toUpperCase()}:${tf['stratSymbol']}:${ymds[i]}`)
  })
  symbolSlugYMDs = Array.from(new Set(symbolSlugYMDs))

  return { symbols, symbolSlugYMDs }
}
