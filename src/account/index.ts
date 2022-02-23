require('dotenv').config()

import fetch from 'node-fetch'
import { Chain } from '@defillama/sdk/build/general'
import { ITransaction, ITransfer, IBlockEvent, IBalance, IERC20 } from '../type'
import { SolanaCluster } from './type'
import { ISPLBalance, ISPLTokens } from '../solana/type'

const MORALIS_EVM_API_URI = `https://deep-index.moralis.io/api/v2`
const MORALIS_SOLANA_API_URI = `https://solana-gateway.moralis.io`

const _evm_caller = async (address: string, target: string = '', body: any = null, params: URLSearchParams, chain: Chain = 'bsc'): Promise<any> => {
  let uri = `${MORALIS_EVM_API_URI}/${address}/${target}?chain=${chain}`
  if (params) {
    uri = `${uri}&${params}`
  }

  return _caller(uri, body)
}

const _solana_caller = async (address: string, target: string = '', body: any = null, params: URLSearchParams, network: SolanaCluster): Promise<any> => {
  let uri = `${MORALIS_SOLANA_API_URI}/account/${network}/${address}/${target}`
  if (params) {
    uri = `${uri}&${params}`
  }

  return _caller(uri, body)
}

const _caller = async (uri: string, body: any = null): Promise<any> => {
  const method = body ? 'POST' : 'GET'
  let requestInit = {
    headers: {
      'X-API-Key': process.env.MORALIS_API_KEY,
      accept: 'application/json',
      'Content-Type': 'application/json'
    },
    method
  }

  // body?
  if (body) {
    requestInit['body'] = body
  }

  let _error: Error
  const result = await fetch(uri, requestInit).catch((error) => (_error = error))
  if (_error) {
    console.error(_error)
    return null
  }

  const data = await result.json()
  if (!data) return null

  return data.result || data
}

export const getEVMNativeBalance = async (address: string, chain: Chain = 'bsc'): Promise<IBalance> => {
  return _evm_caller(address, 'balance', null, null, chain)
}

export const getERC20Balance = async (address: string, chain: Chain = 'bsc'): Promise<IERC20[]> => {
  return _evm_caller(address, 'erc20', null, null, chain)
}

export const getTransactions = async (address: string, chain: Chain = 'bsc'): Promise<ITransaction[]> => {
  return _evm_caller(address, '', null, null, chain)
}

export const getTransfers = async (address: string, chain: Chain = 'bsc'): Promise<ITransfer[]> => {
  return _evm_caller(address, `erc20/transfers`, null, null, chain)
}

export const getTokenPrice = async (address: string, chain: Chain = 'bsc') => {
  return _evm_caller(address, `erc20/${address}/price`, null, null, chain)
}

export const getTokenPrices = async (addresses: string[], chain: Chain = 'bsc') => {
  const pricePromises = addresses.map((e) => getTokenPrice(e, chain))
  const prices = await Promise.all(pricePromises)
  const pricesMap = {}
  addresses.forEach((e, i) => {
    pricesMap[`${e}`] = prices[i]
  })

  return pricesMap
}

export const getEventsByBlockNumber = async (address: string, abi: string, topic: string, blocknumber: string | number = null, chain: Chain = 'bsc'): Promise<IBlockEvent[]> => {
  const params = {
    from_block: blocknumber,
    to_block: blocknumber,
    topic: topic
  }

  // @ts-ignore
  const searchParams = new URLSearchParams(params)
  return _evm_caller(address, 'events', abi, searchParams, chain)
}

// Solana

export const getSPLNativeBalance = async (address: string, cluster: SolanaCluster): Promise<ISPLBalance> => {
  return _solana_caller(address, 'balance', null, null, cluster)
}

export const getSPLBalance = async (address: string, cluster: SolanaCluster): Promise<ISPLTokens[]> => {
  return _solana_caller(address, 'tokens', null, null, cluster)
}

// Rich func
export { fetchAccountBalance as fetchAccountBalance } from './read'
