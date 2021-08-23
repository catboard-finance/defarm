require('dotenv').config()

import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";

const MORALIS_API_URI = `https://deep-index.moralis.io/api/v2`

const _caller = async (account: string, target: string = '', chain: Chain = 'bsc'): Promise<any[]> => {
  const result = await fetch(`${MORALIS_API_URI}/${account}${target}?chain=${chain}`, {
    headers: { 'x-api-key': process.env.MORALIS_API_KEY }
  })
  const { result: data } = await result.json() as ITransactionResponse

  if (!data) return null

  return data
}

export const getTransactions = async (account: string, chain: Chain = 'bsc'): Promise<ITransaction[]> => {
  return _caller(account, '', chain)
}

export const getTransfers = async (account: string, chain: Chain = 'bsc'): Promise<ITransfer[]> => {
  return _caller(account, '/erc20/transfers', chain)
}