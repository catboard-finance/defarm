require('dotenv').config()
import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";
import { BigNumber, ethers } from 'ethers';
import ALPACA_VAULT_ABI from '../abi/Vault.abi.json'
import { parseEther } from 'ethers/lib/utils';
import alpacaInfo from '../info.mainnet.json'
import { formatBigNumberToFixed } from '../utils/converter';
import { ITransfer } from '../../type';

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

export const filterVaults = (txList: ITransfer[]) => {
  return txList.filter(tx => {
    return ALPACA_VAULT_ADDRESSES.includes(tx.to_address.toLowerCase())
  })
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
