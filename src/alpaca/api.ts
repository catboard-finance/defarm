require('dotenv').config()
import fetch from 'node-fetch';

const ALPACA_URI = 'https://api.alpacafinance.org/v1/positions'

export const _fetchUserPositionWithAPIs = async (account: string): Promise<any> => {
  const result = await fetch(`${ALPACA_URI}?owner=${account}`)
  const { data } = await result.json()

  if (!data) return null

  return data.positions
}