require('dotenv').config()
import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";
import alpacaInfo from '../info.mainnet.json'
import { stringToFixed, stringToFloat } from '../utils/converter';
import { ITransfer } from '../../type';
import _ from 'lodash'
import { getTokenPrices } from '../../account';

const ALPACA_URI = 'https://api.alpacafinance.org/v1/positions'

export const getPositions = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const result = await fetch(`${ALPACA_URI}?owner=${account}`)
  const { data } = await result.json()

  if (!data) return null

  return data.positions
}

const ALPACA_VAULT_ADDRESSES = [
  "0x5f94f61095731b669b30ed1f3f4586BBb51f4001", // Pancakeswap
  "0xcE37fD1Ff0A6cb4A6A59cd46CCf55D5Dc70ec585", // Waultswap
  "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90", // PancakeswapSingleAsset
  ...alpacaInfo.Vaults.map(vault => vault.address)
].map(vault => vault.toLowerCase())

export const filterVaults = (txList: ITransfer[]) => txList.filter(tx =>
  ALPACA_VAULT_ADDRESSES.includes(tx.from_address.toLowerCase()) ||
  ALPACA_VAULT_ADDRESSES.includes(tx.to_address.toLowerCase())
)

export const filterDepositVaults = (txList: ITransfer[]) => txList.filter(tx =>
  ALPACA_VAULT_ADDRESSES.includes(tx.to_address.toLowerCase())
)

export const filterNoZeroTransfer = (txList: ITransfer[]) => txList.filter(tx =>
  stringToFloat(tx.value) > 0
)

const getNewSummaryObject = () => ({
  withdraws: [],
  deposits: [],
  totalDeposit: 0,
  totalWithdraw: 0,
})

interface ISummaryMapValue {
  withdraws: ITransfer[],
  deposits: ITransfer[],
  totalDeposit: number,
  totalWithdraw: number,
}

interface ISummaryMap {
  [vaultAddress: string]: ISummaryMapValue
}

interface ISummaryUSDMapValue extends ISummaryMapValue {
  totalDepositUSD: number,
  totalWithdrawUSD: number,
  tokenPriceUSD: number,
}

interface ISummaryUSDMap {
  [vaultAddress: string]: ISummaryUSDMapValue
}

export const sumInvestedVaults = (txList: ITransfer[]): ISummaryMap => {
  const summaryMap: ISummaryMap = {}
  const filteredVaults = filterNoZeroTransfer(filterVaults(txList))

  filteredVaults.forEach(tx => {
    if (ALPACA_VAULT_ADDRESSES.includes(tx.to_address.toLowerCase())) {
      // User → 💎 → Pool
      summaryMap[tx.to_address] = summaryMap[tx.to_address] || getNewSummaryObject()
      summaryMap[tx.to_address].deposits.push(tx)
    }
    else if (ALPACA_VAULT_ADDRESSES.includes(tx.from_address.toLowerCase())) {
      // User ← 💎 ← Pool
      summaryMap[tx.from_address] = summaryMap[tx.from_address] || getNewSummaryObject()
      summaryMap[tx.from_address].withdraws.push(tx)
    }
  })

  // Sum withdraw
  for (let [k, v] of Object.entries(summaryMap)) {
    summaryMap[k].totalDeposit = _.sumBy(v.deposits, (e) => parseFloat(stringToFixed(e.value)))
    summaryMap[k].totalWithdraw = _.sumBy(v.withdraws, (e) => parseFloat(stringToFixed(e.value)))
  }

  return summaryMap
}

export const withPriceUSD = async (summaryMap: ISummaryMap): Promise<ISummaryUSDMap> => {
  const _tokenAddresses = []
  for (let [k] of Object.entries(summaryMap)) {
    _tokenAddresses.concat(summaryMap[k].deposits.map(e => e.address))
  }

  const tokenAddresses: string[] = Array.from(new Set(..._tokenAddresses))
  const tokenPriceUSDMap = await getTokenPrices(tokenAddresses)

  const summaryUSDMap: ISummaryUSDMap = {}
  for (let [k] of Object.entries(summaryMap)) {
    summaryUSDMap[k] = {
      ...summaryMap[k],
      tokenPriceUSD: tokenPriceUSDMap[summaryMap[k].deposits[0].address],
      totalDepositUSD: summaryMap[k].totalDeposit * summaryUSDMap[k].tokenPriceUSD,
      totalWithdrawUSD: summaryMap[k].totalWithdraw * summaryUSDMap[k].tokenPriceUSD,
    }
  }

  return summaryUSDMap
}