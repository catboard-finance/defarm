import POOLS from './pools.json'
import TOKENS from './tokens.json'

import { ITransfer } from '../type'

export const VAULT_ADDRESS = '0x7C9e73d4C71dae564d41F78d56439bB4ba87592f';
export const FAIR_LAUNCH_ADDRESS = '0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F';
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
  rewardToken: string
}

export const ALL_POOLS: IIbPool[] = POOLS.map((pool) => {
  return {
    id: pool.id,
    address: pool.address,
    stakingToken: pool.stakingToken,
    rewardToken: pool.stakingToken.slice(2),
  }
})

export const IB_POOLS = ALL_POOLS.filter(pool => pool.stakingToken.startsWith('ib'))
export const DEBT_POOLS = ALL_POOLS.filter(pool => pool.stakingToken.startsWith('debt'))

const _TOKEN_POOLS_LOWER_MAP = Object.assign({}, ...Object.keys(POOLS).map(k => ({ [`${POOLS[k].address.toLowerCase()}`]: POOLS[k].stakingToken })))
const _TOKEN_LOWER_MAP = Object.assign({}, ...Object.keys(TOKENS).map(k => ({ [`${TOKENS[k].toLowerCase()}`]: k })))

const TRANSFER_TOKEN_LOWER_MAP = {
  ..._TOKEN_POOLS_LOWER_MAP,
  ..._TOKEN_LOWER_MAP,
  [FAIR_LAUNCH_ADDRESS.toLowerCase()]: 'ALPACA',
}

export const getAddressFromSymbol = (symbol: string): string => TOKENS[symbol]

export const getSymbolFromAddress = (address: string): string => TRANSFER_TOKEN_LOWER_MAP[address.toLowerCase()]

export const getSymbolsFromAddresses = (addresses: string[]): string[] => addresses.map(e => getSymbolFromAddress(e))

export const getPoolByPoolAddress = (address: string) => ALL_POOLS.find(pool => pool.address.toLowerCase() === address.toLowerCase())

export const getPoolByPoolId = (id: number) => ALL_POOLS.find(pool => pool.id === id)

export const getIBPoolByStakingTokenSymbol = (symbol: string) => IB_POOLS.find(pool => pool.stakingToken.toUpperCase() === symbol.toUpperCase())

export const getIBPoolByIBSymbol = (symbol: string) => IB_POOLS.find(pool => pool.stakingToken.toUpperCase() === symbol.toUpperCase())

export const getSupportedUSDSymbols = () => IB_POOLS.map(pool => pool.stakingToken)

export const filterSupportedSymbols = (symbols: string[] = null) => {
  return symbols ? POOLS.filter(pool => symbols.includes(pool.stakingToken.slice(2))) : POOLS
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
