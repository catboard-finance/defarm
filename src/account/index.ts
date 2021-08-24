require('dotenv').config()

import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";
import { ITransaction, ITransfer } from '../type';

const MORALIS_API_URI = `https://deep-index.moralis.io/api/v2`

const _caller = async (account: string, target: string = '', body: any = null, chain: Chain = 'bsc'): Promise<any[]> => {
  const method = body ? 'POST' : 'GET'
  let requestInit = {
    headers: { 'x-api-key': process.env.MORALIS_API_KEY },
    method
  }

  // body?
  if (body) {
    requestInit['body'] = body
  }

  let _error: Error
  const result = await fetch(`${MORALIS_API_URI}/${account}${target}?chain=${chain}`, requestInit).catch(error => _error = error)
  if (_error) {
    console.error(_error)
    return null
  }

  const { result: data } = await result.json()
  if (!data) return null

  return data
}

export const getTransactions = async (account: string, chain: Chain = 'bsc'): Promise<ITransaction[]> => {
  return _caller(account, '', null, chain)
}

export const getTransfers = async (account: string, chain: Chain = 'bsc'): Promise<ITransfer[]> => {
  return _caller(account, '/erc20/transfers', null, chain)
}

export const getEventsByBlockNumber = async (account: string, topic: string, blocknumber: number = null, chain: Chain = 'bsc'): Promise<ITransfer[]> => {
  return _caller(account, '/events', {
    from_block: blocknumber,
    to_block: blocknumber,
    topic,
  }, chain)
}
