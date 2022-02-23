import { Chain } from '@defillama/sdk/build/general'
import { getERC20Balance, getEVMNativeBalance, getSPLBalance, getSPLNativeBalance } from '.'
import { getSolanaSymbolInfoByAddress } from '../solana/tokens'
import { stringToFloat } from '../utils/converter'
import { getSymbolByChain, IAccountBalance, SolanaCluster, WhiteListChain } from './type'

export const fetchERC20AccountBalance = async (chain: WhiteListChain, account: string): Promise<IAccountBalance[]> => {
  const [native, erc20] = await Promise.all([getEVMNativeBalance(account, chain as Chain), getERC20Balance(account, chain as Chain)])

  const parsedERC20s = erc20
    ? erc20
        .map((e) => {
          // Ignore null from API
          if (e.decimals === null || e.balance === null) {
            return null
          }

          return {
            symbol: e.symbol,
            name: e.name,
            address: e.token_address,
            amount: stringToFloat(e.balance, parseInt(e.decimals), parseInt(e.decimals))
          }
        })
        .filter((e) => e)
    : []

  return [
    {
      symbol: getSymbolByChain(chain),
      amount: stringToFloat(native.balance)
    },
    ...parsedERC20s
  ]
}

export const fetchSolanaAccountBalance = async (chain: WhiteListChain, account: string, cluster: SolanaCluster = SolanaCluster.mainnet): Promise<IAccountBalance[]> => {
  const [native, spl] = await Promise.all([getSPLNativeBalance(account, cluster), getSPLBalance(account, cluster)])

  const parsedSPLs = spl
    ? spl
        .map((e) => {
          // Ignore null from API
          if (e.decimals === null || e.amount === null) {
            return null
          }

          const symbolInfo = getSolanaSymbolInfoByAddress(e.mint)

          return {
            symbol: symbolInfo?.symbol || 'UNKNOWN',
            address: e.mint,
            amount: parseFloat(e.amount)
          }
        })
        .filter((e) => e)
    : []

  return [
    {
      symbol: getSymbolByChain(chain),
      amount: parseFloat(native.solana),
      address: 'So11111111111111111111111111111111111111112'
    },
    ...parsedSPLs
  ]
}

export const fetchAccountBalance = async (chain: WhiteListChain, account: string): Promise<IAccountBalance[]> => {
  switch (chain) {
    case WhiteListChain.bsc:
      return fetchERC20AccountBalance(chain, account)
    case WhiteListChain.solana:
      return fetchSolanaAccountBalance(chain, account)
  }
}
