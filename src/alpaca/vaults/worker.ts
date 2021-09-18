import { ethers } from 'ethers';

import ALPACA_VAULT_ABI from '../abi/Vault.abi.json'
import ALPACA_FAIRLAUNCH_ABI from '../abi/FairLaunch.abi.json'
import ALPACA_DEBT_ABI from '../abi/DebtToken.abi.json'
import PANCAKESWAP_ROUTER_V2_ABI from '../abi/PancakeSwap_Router_v2.abi.json'

import { parseEther } from 'ethers/lib/utils';
import { stringToFloat } from '../utils/converter';
import { MethodType } from '../../type';

import alpacaInfo from '../info.mainnet.json'

export enum STRAT_TYPE {
  withdraw = 'withdraw',
  deposit = 'deposit',
}

const WORKER_ADDRESS_MAP = Object.assign({}, ...alpacaInfo.Vaults.map(
  vault => vault.workers.map(
    worker => ({
      [worker.address]: worker,
    })
  ).flat()
).flat())

const SHARED_STRATEGIES_ADDRESSES = Object.values(alpacaInfo.SharedStrategies).map(e => Object.values(e)).flat()
const SHARED_STRATEGIES_KEYS = Object.keys(alpacaInfo.SharedStrategies)
const SHARED_STRATEGIES_VALUES = Object.values(alpacaInfo.SharedStrategies)
const SHARED_STRATEGIES_MAP = SHARED_STRATEGIES_KEYS.map((e, i) => {
  const stratType = e
  const value = SHARED_STRATEGIES_VALUES[i]
  const kv = []
  for (let [stratName, stratAddress] of Object.entries(value)) {
    kv.push({ stratType, stratName, stratAddress })
  }
  return kv
}).flat()

export const parseVaultInput = (data: string) => {
  const iface = new ethers.utils.Interface(Array.from(new Set([
    ...ALPACA_VAULT_ABI,
    ...ALPACA_FAIRLAUNCH_ABI,
    ...ALPACA_DEBT_ABI,
    ...PANCAKESWAP_ROUTER_V2_ABI,
  ])));

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
          name: WORKER_ADDRESS_MAP[worker].name,
          positionId: ethers.BigNumber.from(id).toString(),
          workerAddress: worker,
          principalAmount: stringToFloat(principalAmount),
          borrowAmount: stringToFloat(borrowAmount),
          maxReturn: stringToFloat(maxReturn),
        }

        // TODO: move to withWorkContext
        // Vault.sol: data = The calldata to pass along to the worker for more working context.
        if (args[5]) {
          const [stratAddress, amountByte] = ethers.utils.defaultAbiCoder.decode(["address", "bytes"], args[5])
          const [stratAmount] = ethers.utils.defaultAbiCoder.decode(["uint256"], amountByte)

          parsed = {
            ...parsed,
            stratAddress,
            stratType: STRAT_TYPE.deposit,
            minLPAmount: 0,
            stratAmount: stringToFloat(stratAmount)
          }

          // TODO: more clarify/test on this
          if (SHARED_STRATEGIES_ADDRESSES.includes(stratAddress)) {
            // Which strategy is this?
            const strat = SHARED_STRATEGIES_MAP.find(e => e.stratAddress === stratAddress)
            parsed = {
              ...parsed,
              ...strat,
            }

            // withdraw?
            if (strat.stratName.toLowerCase().includes('withdraw')) {
              parsed.stratType = STRAT_TYPE.withdraw
            }

            // StrategyAddBaseTokenOnly = adjust position
            parsed.minLPAmount = stringToFloat(stratAmount)
            parsed.stratAmount = 0
          }
        }
        break;
      // Special case for pancake
      case MethodType.swapETHForExactTokens:
        var { amountOut, path, to, deadline, } = args
        parsed = {
          ...parsed,
          name,
          amountOut,
          deadline,
          tokenAddressIn: path[0],
          tokenAddressOut: path[1],
          to,
        }
      case MethodType.swapExactETHForTokens:
      case MethodType.swapExactETHForTokensSupportingFeeOnTransferTokens:
        var { amountOutMin, path, to, deadline, } = args
        parsed = {
          ...parsed,
          name,
          amountOutMin,
          deadline,
          tokenAddressIn: path[0],
          tokenAddressOut: path[1],
          to,
        }
        break;
      case MethodType.swapTokensForExactETH:
        var { amountOut, amountInMax, path, to, deadline, } = args
        parsed = {
          ...parsed,
          name,
          amountOut,
          amountInMax,
          deadline,
          tokenAddressIn: path[0],
          tokenAddressOut: path[1],
          to,
        }
        break;
      case MethodType.swapExactTokensForTokensSupportingFeeOnTransferTokens:
      case MethodType.swapExactTokensForETHSupportingFeeOnTransferTokens:
      case MethodType.swapExactTokensForETH:
      case MethodType.swapExactTokensForTokens:
        var { amountIn, amountOutMin, path, to, deadline, } = args
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
