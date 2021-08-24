import { BigNumber, ethers } from 'ethers';
import ALPACA_VAULT_ABI from '../src/alpaca/abi/Vault.abi.json'
import { parseEther } from 'ethers/lib/utils';
import { formatBigNumberToFixed } from '../src/alpaca/utils/converter';

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
