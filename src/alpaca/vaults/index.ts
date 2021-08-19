require('dotenv').config()
import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";

const ALPACA_URI = 'https://api.alpacafinance.org/v1/positions'

export const getPositions = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const result = await fetch(`${ALPACA_URI}?owner=${account}`)
  const { data } = await result.json()

  if (!data) return null

  return data.positions
}
