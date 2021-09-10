import fetch from 'node-fetch'
import PRICE_SYMBOL_MAP from '../coingecko/tokens.id.json'

export const fetchPriceUSD = async (ids?: string[]) => {
  ids = ids.map(id => PRICE_SYMBOL_MAP[id]) || Object.values(PRICE_SYMBOL_MAP)
  const PRICE_URI = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`
  const priceList: [] = await (await fetch(PRICE_URI)).json()
  const _priceUSDMap: any[] = priceList.map(e => ({ [`${(e['symbol'] as string).toUpperCase()}`]: e['current_price'] }))
  const priceUSDMap = Object.assign({}, ..._priceUSDMap)

  return priceUSDMap
}
