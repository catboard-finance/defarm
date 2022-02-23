import fetch from 'node-fetch'
import { IPriceUSDMap } from '../../alpaca/utils/price'
import PRICE_SYMBOL_MAP from './tokens.id.json'

export const fetchPriceUSD = async (symbols?: string[]) => {
  symbols = symbols.map((id) => PRICE_SYMBOL_MAP[id]) || Object.values(PRICE_SYMBOL_MAP)
  const PRICE_URI = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${symbols}`
  const priceList: [] = await (await fetch(PRICE_URI)).json()
  const _priceUSDMap: any[] = priceList.map((e) => ({ [`${(e['symbol'] as string).toUpperCase()}`]: e['current_price'] }))
  const priceUSDMap = Object.assign({}, ..._priceUSDMap)

  return priceUSDMap
}

export const fetchRecordedPriceUSD = async (keys?: string[]): Promise<IPriceUSDMap> => {
  const PRICE_URI = `https://api.undefi.org/v1/price`
  const res = await fetch(PRICE_URI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.UNDEFI_API_KEY
    },
    body: JSON.stringify({ keys })
  })
  const priceList = await res.json()
  const { success, result } = priceList
  if (!success) throw new Error(result)

  return result
}
