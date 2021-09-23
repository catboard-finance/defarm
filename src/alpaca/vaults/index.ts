require('dotenv').config()
import alpacaInfo from '../info.mainnet.json'
import { ITransfer } from '../../type';
import _ from 'lodash'
import { FAIR_LAUNCH_ADDRESS } from '../core';
import { ALL_STRATEGY_LOWER_ADDRESSES } from './config';

const ALPACA_VAULT_ADDRESSES = [
  FAIR_LAUNCH_ADDRESS,
  ...ALL_STRATEGY_LOWER_ADDRESSES,
  ...alpacaInfo.Vaults.map(vault => vault.address.toLowerCase())
].map(vault => vault.toLowerCase())

export const filterRelated = (whiteList: string[], txList: ITransfer[]) => txList.filter(tx =>
  whiteList.includes(tx.from_address.toLowerCase()) ||
  whiteList.includes(tx.to_address.toLowerCase())
)

export const filterInvestmentTransfers = (account: string, transfers: ITransfer[]) => {
  return filterRelated(ALPACA_VAULT_ADDRESSES.concat([account]), transfers)
}
