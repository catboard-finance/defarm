import { ethers } from 'ethers';

import ALPACA_VAULT_ABI from '../abi/Vault.abi.json'
import ALPACA_FAIRLAUNCH_ABI from '../abi/FairLaunch.abi.json'
import ALPACA_DEBT_ABI from '../abi/DebtToken.abi.json'
import PANCAKESWAP_ROUTER_V2_ABI from '../abi/PancakeSwap_Router_v2.abi.json'

import { parseEther } from 'ethers/lib/utils';
import { stringToFloat } from '../utils/converter';
import { MethodType } from '../../type';

const WORKER_ADDRESS_MAP = {
  "0xe8084D7Ded35E2840386f04d609cdb49C7E36d88": "USDT CakeMaxiWorker",
  "0xECb008F4741465F9F169EC11A50Aa8871E423F33": "CAKE-USDT PancakeswapWorker",
  "0x41c1D9544ED9fa6b604ecAf7430b4CfDf883c46F": "BUSD CakeMaxiWorker",
  "0x4BfE9489937d6C0d7cD6911F1102c25c7CBc1B5A": "ALPACA-BUSD PancakeswapWorker",
}

export const parseVaultInput = (data: string) => {
  const iface = new ethers.utils.Interface([
    ...ALPACA_VAULT_ABI,
    ...ALPACA_FAIRLAUNCH_ABI,
    ...ALPACA_DEBT_ABI,
    ...PANCAKESWAP_ROUTER_V2_ABI,
  ]);

  const value = parseEther("1.0");
  try {
    const parsedTransaction = iface.parseTransaction({ data, value });

    const { name, args } = parsedTransaction

    let parsed: any = {
      method: name,
      name,
    }

    switch (name) {
      case MethodType.transfer:
      case MethodType.approve:
        var [to, amount] = args
        parsed = {
          ...parsed,
          to,
          amount: stringToFloat(amount),
        }
        break;

      case MethodType.deposit:
        const { _for, _amount, _pid } = args
        if (_for) {
          parsed = {
            ...parsed,
            for: _for,
            amount: stringToFloat(_amount),
            positionId: ethers.BigNumber.from(_pid).toString(),
          }
        } else {
          const { amountToken } = args
          parsed = {
            ...parsed,
            amount: stringToFloat(amountToken),
          }
        }
        break;

      case MethodType.work:
        const { id, worker, principalAmount, borrowAmount, maxReturn } = args
        parsed = {
          ...parsed,
          name: WORKER_ADDRESS_MAP[worker],
          positionId: ethers.BigNumber.from(id).toString(),
          to: worker,
          principalAmount: stringToFloat(principalAmount),
          borrowAmount: stringToFloat(borrowAmount),
          maxReturn: stringToFloat(maxReturn),
        }
        break;
      // Special case for pancake
      case MethodType.swapExactTokensForTokens:
        var { amountIn, amountOutMin, deadline, path, to } = args
        parsed = {
          ...parsed,
          name,
          amountIn,
          amountOutMin,
          deadline,
          tokenAddressIn: path[0],
          tokenAddressOut: path[1],
          to,
        }
        break;
    }

    return parsed
  } catch (e) {
    // Transfer between account
    return {
      method: MethodType.transfer,
    }
  }
}
