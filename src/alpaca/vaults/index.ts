require('dotenv').config()
import fetch from 'node-fetch';
import { Chain } from "@defillama/sdk/build/general";
import { ITransaction } from '../../users';
import { BigNumber, ethers } from 'ethers';
import ALPACA_VAULT_ABI from '../abi/Vault.abi.json'
import { parseEther } from 'ethers/lib/utils';
import { formatBigNumberToFixed } from '..';

const ALPACA_URI = 'https://api.alpacafinance.org/v1/positions'

export const getPositions = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const result = await fetch(`${ALPACA_URI}?owner=${account}`)
  const { data } = await result.json()

  if (!data) return null

  return data.positions
}

const ALPACA_VAULTS = ["0x158da805682bdc8ee32d52833ad41e74bb951e59"]

export const filterVaults = (txList: ITransaction[]) => {
  return txList.filter(tx => ALPACA_VAULTS.includes(tx.to_address))
}

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
