require('dotenv').config()
import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber, ethers } from 'ethers';
import ALPACA_VAULT_ABI from '../abi/Vault.abi.json'
import { parseEther } from 'ethers/lib/utils';
import alpacaInfo from '../info.mainnet.json'
import { formatBigNumberToFixed, stringToFixed } from '../utils/converter';
import { ITransfer } from '../../type';
import _ from 'lodash'

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

export const sumInvestedVaults = (txList: ITransfer[]) => {
  const summaryMap: { [vaultAddress: string]: { withdraws: ITransfer[], deposits: ITransfer[], totalWithdraw: any } } = {}
  const filteredVaults = filterVaults(txList)

  // const filtered: { withdraw: ITransfer[], deposit: ITransfer[] } = { withdraws: null, deposits: null }
  filteredVaults.forEach(tx => {
    if (ALPACA_VAULT_ADDRESSES.includes(tx.to_address.toLowerCase())) {
      // User → 💎 → Pool
      summaryMap[tx.to_address] = summaryMap[tx.to_address] || { withdraws: null, deposits: null, totalWithdraw: null }

      summaryMap[tx.to_address].deposits = summaryMap[tx.to_address] ? summaryMap[tx.to_address].deposits || [] : []
      summaryMap[tx.to_address].deposits.push(tx)
    }
    else if (ALPACA_VAULT_ADDRESSES.includes(tx.from_address.toLowerCase())) {
      // User ← 💎 ← Pool
      summaryMap[tx.from_address] = summaryMap[tx.from_address] || { withdraws: null, deposits: null, totalWithdraw: null }

      summaryMap[tx.from_address].withdraws = summaryMap[tx.from_address].withdraws ? summaryMap[tx.from_address].withdraws || [] : []
      summaryMap[tx.from_address].withdraws.push(tx)
    }
  })

  // Sum 
  for (let [k, v] of Object.entries(summaryMap)) {
    summaryMap[k].totalWithdraw = _.sumBy(v.withdraws, (e) => parseFloat(stringToFixed(e.value)))
  }

  console.log(summaryMap)

  // for(let [k,v] of Object.entries(summaryMap)) {
  //   summaryMap[k].totalWithdraw = BigNumber.from(0)

  //   summaryMap[k].totalWithdraw = v.withdraws.reduce((sum, x) => {
  //     return BigNumber.from(sum.value).add(BigNumber.from(x.value))
  //   });
  // }

  // filteredVaults.forEach(tx => {
  //   // Retrieve of init
  //   summaryMap[tx.from_address] = summaryMap[tx.from_address] || BigNumber.from(0)

  //   if (tx.from_address) {
  //     // User ← 💎 ← Pool
  //     summaryMap[tx.from_address] = summaryMap[tx.from_address].add(BigNumber.from(tx.value))
  //   } else if (tx.to_address) {
  //     // User → 💎 → Pool
  //     summaryMap[tx.from_address] = summaryMap[tx.from_address].sub(BigNumber.from(tx.value))
  //   }
  // })

  // const filtered: { from: ITransfer[], to: ITransfer[] } = { from: null, to: null }
  // txList.forEach(tx => {
  //   ALPACA_VAULT_ADDRESSES.includes(tx.from_address.toLowerCase()) && filtered.from.push(tx)
  //   ALPACA_VAULT_ADDRESSES.includes(tx.to_address.toLowerCase()) && filtered.to.push(tx)
  // })

  return summaryMap
}

// POC ////////////////////////////////////////

const WORKER_ADDRESS_MAP = {
  "0xe8084D7Ded35E2840386f04d609cdb49C7E36d88": "USDT CakeMaxiWorker",
  "0xECb008F4741465F9F169EC11A50Aa8871E423F33": "CAKE-USDT PancakeswapWorker",
}

export const parseVaultInput = (data: string) => {
  const iface = new ethers.utils.Interface(ALPACA_VAULT_ABI);
  const value = parseEther("1.0");
  const parsedTransaction = iface.parseTransaction({ data, value });
  const worker = WORKER_ADDRESS_MAP[parsedTransaction.args['worker']]
  const principalAmount = formatBigNumberToFixed(parsedTransaction.args['principalAmount'] as BigNumber).toString()
  const borrowAmount = formatBigNumberToFixed(parsedTransaction.args['borrowAmount'] as BigNumber).toString()

  console.log('parsed:', { worker, principalAmount, borrowAmount })

  return parsedTransaction
}
