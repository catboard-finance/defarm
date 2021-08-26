import { ethers } from 'ethers';
import ALPACA_VAULT_ABI from '../abi/Vault.abi.json'
import { parseEther } from 'ethers/lib/utils';
import { stringToFloat } from '../utils/converter';

const WORKER_ADDRESS_MAP = {
  "0xe8084D7Ded35E2840386f04d609cdb49C7E36d88": "USDT CakeMaxiWorker",
  "0xECb008F4741465F9F169EC11A50Aa8871E423F33": "CAKE-USDT PancakeswapWorker",
  "0x41c1D9544ED9fa6b604ecAf7430b4CfDf883c46F": "BUSD CakeMaxiWorker",
  "0x4BfE9489937d6C0d7cD6911F1102c25c7CBc1B5A": "ALPACA-BUSD PancakeswapWorker",
}

export const parseVaultInput = (data: string) => {
  const iface = new ethers.utils.Interface(ALPACA_VAULT_ABI);
  const value = parseEther("1.0");
  try {
    const parsedTransaction = iface.parseTransaction({ data, value });

    if (!parsedTransaction.args['worker']) return null

    const worker = WORKER_ADDRESS_MAP[parsedTransaction.args['worker']]
    const workerAddress = parsedTransaction.args['worker']
    const principalAmount = stringToFloat(parsedTransaction.args['principalAmount'])
    const borrowAmount = stringToFloat(parsedTransaction.args['borrowAmount'])
    const maxReturn = stringToFloat(parsedTransaction.args['maxReturn'])
    const id = ethers.BigNumber.from(parsedTransaction.args['id']).toString()

    return { id, worker, workerAddress, principalAmount, borrowAmount, maxReturn }
  } catch (e) {
    return null
  }

  // console.log('parsed:', { id, worker, principalAmount, borrowAmount, maxReturn })

  return null
}
