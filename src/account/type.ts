export interface IAccountBalance {
  symbol: string
  name?: string
  address?: string
  amount: number
}

export enum WhiteListChain {
  bsc = 'bsc',
  solana = 'solana'
}

export const getSymbolByChain = (chain: WhiteListChain): string => {
  switch (chain) {
    case WhiteListChain.bsc:
      return 'BSC'
    case WhiteListChain.solana:
      return 'SOL'
    default:
      throw new Error(`Not supported chain: ${chain}`)
  }
}

export enum SolanaCluster {
  mainnet = 'mainnet',
  devnet = 'devnet'
}
