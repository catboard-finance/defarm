require('dotenv').config()
import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";
import alpacaInfo from '../info.mainnet.json'
import { stringToFloat } from '../utils/converter';
import { DirectionType, ITransfer, ITransferInfo, ITransferUSD } from '../../type';
import _ from 'lodash'
import { IUserPositionUSD } from '..';
import { getSymbolsFromAddresses } from '../core';
import { getPositionIds } from '../utils/events';
import { fetchTokenUSDPricesBySymbols } from '../../pancakeswap';

const ALPACA_URI = 'https://api.alpacafinance.org/v1/positions'

export const getPositions = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const result = await fetch(`${ALPACA_URI}?owner=${account}`)
  const { data } = await result.json()

  if (!data) return null

  return data.positions
}

// TODO list all supported address

// Interest Bearing BUSD
const ALPACA_BUSD_VAULT_ADDRESSES = [
  "0x3fC149995021f1d7AEc54D015Dad3c7Abc952bf0", // Pancakeswap
  "0x61e58dE669d842C2d77288Df629af031b3283c81", // Waultswap
  "0x38912684b1d20Fe9D725e8B39c39458Fac5A4833", // PancakeswapSingleAsset
].map(vault => vault.toLowerCase())

// Interest Bearing USDT
const ALPACA_USDT_VAULT_ADDRESSES = [
  "0x5f94f61095731b669b30ed1f3f4586BBb51f4001", // Pancakeswap
  "0xcE37fD1Ff0A6cb4A6A59cd46CCf55D5Dc70ec585", // Waultswap
  "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90", // PancakeswapSingleAsset
].map(vault => vault.toLowerCase())

const ALPACA_VAULT_ADDRESSES = [
  ...ALPACA_BUSD_VAULT_ADDRESSES,
  ...ALPACA_USDT_VAULT_ADDRESSES,
  ...alpacaInfo.Vaults.map(vault => vault.address.toLowerCase())
]

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

export const filterInvestmentTransfers = (transfers: ITransfer[]) => filterNoZeroTransfer(filterVaults(transfers))

export const withPriceUSD = async (transfers: ITransfer[]): Promise<ITransferUSD[]> => {
  // Get all unique address
  const tokenAddresses: string[] = [...Array.from(new Set(transfers.map(tx => tx.address)))]
  const tokenSymbols = getSymbolsFromAddresses(tokenAddresses)

  // TODO: Move to external
  // Get current usd price
  const tokenPriceUSDs = await fetchTokenUSDPricesBySymbols(tokenSymbols)
  const symbolPriceUSDMap = {}
  tokenPriceUSDs.forEach((e, i) => symbolPriceUSDMap[tokenAddresses[i]] = e)

  // Attach usd price and return
  return transfers.map(tx => {
    const tokenPriceUSD = parseFloat(symbolPriceUSDMap[tx.address].busdPrice)
    const tokenAmount = stringToFloat(tx.value)
    return ({
      ...tx,
      symbol: symbolPriceUSDMap[tx.address].symbol,
      tokenPriceUSD,
      tokenAmount,
      tokenAmountUSD: tokenPriceUSD * tokenAmount,
    })
  })
}

export const withDirection = (transfers: ITransferUSD[]): ITransferInfo[] => {
  return transfers.map(tx => {
    const _tx = { ...tx, ...{ direction: DirectionType.UNKNOWN } }
    if (ALPACA_VAULT_ADDRESSES.includes(tx.to_address.toLowerCase())) {
      // User → 💎 → Pool
      _tx.direction = DirectionType.DEPOSIT
    }
    else if (ALPACA_VAULT_ADDRESSES.includes(tx.from_address.toLowerCase())) {
      // User ← 💎 ← Pool
      _tx.direction = DirectionType.WITHDRAW
    }

    return _tx
  })
}

interface ITransferPositionInfo extends ITransferInfo {
  positionId: string
}

export const withPositionInfo = async (transfers: ITransferInfo[]): Promise<ITransferPositionInfo[]> => {
  const promises = transfers.map(tx => {
    let targetAddress = (tx.direction === DirectionType.DEPOSIT) ? tx.to_address : tx.from_address

    // poc mapping to vault address
    if (ALPACA_USDT_VAULT_ADDRESSES.includes(targetAddress.toLowerCase())) {
      targetAddress = '0x158Da805682BdC8ee32d52833aD41E74bb951E59'.toLowerCase()
    }

    if (ALPACA_BUSD_VAULT_ADDRESSES.includes(targetAddress.toLowerCase())) {
      targetAddress = '0x7C9e73d4C71dae564d41F78d56439bB4ba87592f'.toLowerCase()
    }

    return getPositionIds(targetAddress, parseInt(tx.block_number))
  })

  const results = await Promise.all(promises)

  return results.map((e, i) => {
    return {
      ...transfers[i],
      positionId: e
    }
  })
}

// interface IPositionSummary {
//   totalDeposit: number
//   totalWithdraw: number
//   totalDepositUSD: number
//   totalWithdrawUSD: number
// }

/*
[
  {
    positionId: 10121,

    deposits: [
      {
        vault: "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",
        symbol: "ALPACA",
        amount: 695.245603609934955053,
        priceUSD: 1042.8684054149,
        transferredAt: "2021-08-07T14:45:51.000Z",
      },
      {
        vault: "0x7c9e73d4c71dae564d41f78d56439bb4ba87592f",
        symbol: "BUSD",
        amount: 504.503765091159716219,
        priceUSD: 504.503765091159716219,
        transferredAt: "2021-08-07T14:45:51.000Z",
      },
      {
        vault: "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",
        symbol: "ALPACA",
        amount: 577.406596699668932514,
        priceUSD: 519.6659370297,
        transferredAt: "2021-08-11T06:37:01.000Z",
      },
    ],
    depositSummary: [
      {
        symbol: "CAKE"
        totalDepositAmount: 123,
        totalDepositUSD: 1230,
      },
      {
        symbol: "BUSD"
        totalDepositAmount: 456,
        totalDepositUSD: 4560,
      }
    ]

    withdraws: {...},

    totalDepositUSD,
    totalWithdrawUSD,

    totalEquityUSD,
    totalProfit,
  }
]
*/
export const summaryPositionInfo = (activePositions: IUserPositionUSD[], transferInfos: ITransferPositionInfo[]) => {
  // 1. Remove null
  const _transferInfos = transferInfos.filter(e => e)

  // 3. Group by position
  const transferPositionInfoMap = _.groupBy(_transferInfos, 'positionId')

  // for (let [k, v] of Object.entries(transferPositionInfoMap)) {
  //   const e = transferPositionInfoMap[k]
  //   transferPositionInfoMap
  // }

  return transferPositionInfoMap

  // return activePositions.map(pos => {
  //   // 1. Group by position
  //   const transferPositionInfos: ITransferPositionInfo[] = transferInfos.filter(e => parseInt(e.positionId) === pos.positionId)
  //   if (!transferPositionInfos || transferPositionInfos.length <= 0) {
  //     console.warn(`Position not found: ${pos.positionId}`)
  //     return null
  //   }

  //   // 2. Sum by direction
  //   const deposits = transferPositionInfos.filter(e => e.direction === DirectionType.DEPOSIT)
  //   const withdraws = transferPositionInfos.filter(e => e.direction === DirectionType.WITHDRAW)

  //   const positionSummary: IPositionSummary = {
  //     totalDepositUSD: _.sumBy(_.filter(deposits, 'symbol'), 'tokenAmountUSD'),
  //     totalWithdrawUSD: _.sumBy(_.filter(withdraws, 'symbol'), 'tokenAmountUSD'),
  //     totalDeposit: _.sumBy(_.filter(deposits, 'symbol'), 'tokenAmount'),
  //     totalWithdraw: _.sumBy(_.filter(withdraws, 'symbol'), 'tokenAmount'),
  //   }

  //   const investedPositionSummaryUSD = positionSummary.totalDepositUSD - positionSummary.totalWithdrawUSD

  //   delete pos.positionValueUSDbn
  //   delete pos.debtValueUSDbn

  //   return {
  //     ...pos,
  //     ...positionSummary,
  //     deposits,
  //     withdraws,
  //     investedUSD: positionSummary.totalDepositUSD - positionSummary.totalWithdrawUSD,
  //     profitUSD: pos.equityValueUSD - investedPositionSummaryUSD,
  //   }
  // })
}
