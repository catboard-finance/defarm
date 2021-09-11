require('dotenv').config()
import alpacaInfo from '../info.mainnet.json'
import { stringToFloat } from '../utils/converter';
import { ITransfer } from '../../type';
import _ from 'lodash'
import { FAIR_LAUNCH_ADDRESS } from '../core';
import { ALL_STRATEGY_LOWER_ADDRESSES } from './config';

const ALPACA_VAULT_ADDRESSES = [
  FAIR_LAUNCH_ADDRESS,
  ...ALL_STRATEGY_LOWER_ADDRESSES,
  ...alpacaInfo.Vaults.map(vault => vault.address.toLowerCase())
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

export const filterInvestmentTransfers = (transfers: ITransfer[]) => filterNoZeroTransfer(filterVaults(transfers))
