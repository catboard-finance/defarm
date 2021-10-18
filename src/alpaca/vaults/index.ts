require('dotenv').config()
import alpacaInfo from '../info.mainnet.json'
import { ITransaction, ITransfer } from '../../type';
import _ from 'lodash'
import { FAIR_LAUNCH_ADDRESS } from '../core';
import { ALL_STRATEGY_LOWER_ADDRESSES } from './config';
import { getPoolByPoolAddress } from '..';

const ALL_VAULT_ADDRESSES = alpacaInfo.Vaults.map(vault => vault.address.toLowerCase())

const ALPACA_VAULT_ADDRESSES = [
  FAIR_LAUNCH_ADDRESS,
  ...ALL_STRATEGY_LOWER_ADDRESSES,
  ...ALL_VAULT_ADDRESSES,
].map(vault => vault.toLowerCase())

interface IFromTo {
  from_address: string // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  to_address: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
}

export const filterRelated = (whiteList: string[], txList: IFromTo[]) => txList.filter(tx =>
  whiteList.includes(tx.from_address.toLowerCase()) ||
  whiteList.includes(tx.to_address.toLowerCase())
)

export const filterInvestmentTransfers = (account: string, transfers: ITransfer[]) => {
  return filterRelated(ALPACA_VAULT_ADDRESSES.concat([account]), transfers) as ITransfer[]
}

export const filterRelatedPool = (txList: IFromTo[]) => txList.filter(tx =>
  getPoolByPoolAddress(tx.from_address.toLowerCase()) ||
  getPoolByPoolAddress(tx.to_address.toLowerCase())
)

export const filterInvestmentTransaction = (account: string, transaction: ITransaction[]) => {
  const relatedTransactions = filterRelated(ALPACA_VAULT_ADDRESSES.concat([account]), transaction) as ITransaction[]
  const relatedPools = filterRelatedPool(relatedTransactions)
  return relatedPools as ITransaction[]
}
