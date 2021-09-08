require('dotenv').config()
import alpacaInfo from '../info.mainnet.json'
import { stringToFloat } from '../utils/converter';
import { ITransfer } from '../../type';
import _ from 'lodash'
import { FAIR_LAUNCH_ADDRESS, VAULT_ADDRESS } from '../core';

// TODO list all supported address

// Interest Bearing BUSD
export const ALPACA_BUSD_VAULT_ADDRESSES = [
  "0x3fC149995021f1d7AEc54D015Dad3c7Abc952bf0", // Pancakeswap
  "0x61e58dE669d842C2d77288Df629af031b3283c81", // Waultswap
  "0x38912684b1d20Fe9D725e8B39c39458Fac5A4833", // PancakeswapSingleAsset
].map(vault => vault.toLowerCase())

// Interest Bearing USDT
export const ALPACA_USDT_VAULT_ADDRESSES = [
  "0x5f94f61095731b669b30ed1f3f4586BBb51f4001", // Pancakeswap
  "0xcE37fD1Ff0A6cb4A6A59cd46CCf55D5Dc70ec585", // Waultswap
  "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90", // PancakeswapSingleAsset
].map(vault => vault.toLowerCase())

const ALPACA_VAULT_ADDRESSES = [
  FAIR_LAUNCH_ADDRESS,
  VAULT_ADDRESS,
  ...ALPACA_BUSD_VAULT_ADDRESSES,
  ...ALPACA_USDT_VAULT_ADDRESSES,
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
