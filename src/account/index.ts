require('dotenv').config()

import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";
import { ITransaction, ITransfer, IBlockEvent } from '../type';

const MORALIS_API_URI = `https://deep-index.moralis.io/api/v2`

const _caller = async (account: string, target: string = '', body: any = null, params: URLSearchParams, chain: Chain = 'bsc'): Promise<any[]> => {
  const method = body ? 'POST' : 'GET'
  let requestInit = {
    headers: {
      'X-API-Key': process.env.MORALIS_API_KEY,
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method
  }

  // body?
  if (body) {
    requestInit['body'] = body
  }

  let _error: Error
  const uri = `${MORALIS_API_URI}/${account}${target}?chain=${chain}&${params}`
  const result = await fetch(uri, requestInit).catch(error => _error = error)
  if (_error) {
    console.error(_error)
    return null
  }

  const { result: data } = await result.json()
  if (!data) return null

  return data
}

export const getTransactions = async (account: string, chain: Chain = 'bsc'): Promise<ITransaction[]> => {
  return _caller(account, '', null, null, chain)
}

export const getTransfers = async (account: string, chain: Chain = 'bsc'): Promise<ITransfer[]> => {
  return _caller(account, `/erc20/transfers`, null, null, chain)
}

export const getTokenPrice = async (address: string, chain: Chain = 'bsc') => {
  return _caller(address, `/erc20/${address}/price`, null, null, chain)
}

export const getTokenPrices = async (addresses: string[], chain: Chain = 'bsc') => {
  const pricePromises = addresses.map(e => getTokenPrice(e))
  const prices = await Promise.all(pricePromises)
  const pricesMap = {}
  addresses.forEach((e, i) => {
    pricesMap[`${e}`] = prices[i]
  })

  return pricesMap
}

export const getEventsByBlockNumber = async (account: string, abi: string, topic: string, blocknumber: number = null, chain: Chain = 'bsc'): Promise<IBlockEvent[]> => {
  const params = {
    'from_block': blocknumber.toString(),
    'to_block': blocknumber.toString(),
    'topic': topic
  }

  const searchParams = new URLSearchParams(params)
  return _caller(account, '/events', abi, searchParams, chain)
}
