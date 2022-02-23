// Blockchain Scope

export interface IERC20Balance {
  balance: string // "1234567890"
}

export interface IERC20 {
  token_address: string // "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  name: string // "BUSD Token",
  symbol: string // "BUSD",
  logo: string // null,
  thumbnail: string // null,
  decimals: string // "18",
  balance: string // "40000000000000000000"
}

export interface ITransaction {
  hash: string // "0x5590f91d196f06f8ad23ae26ae11f918805264735550b377fb8c6078d312bc6a",
  nonce: string // "19",
  transaction_index: string // "494",
  from_address: string // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  to_address: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  value: string // "0",
  gas: string // "2200000",
  gas_price: string // "5000000000",
  input: string // "0xd72ef7710000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e8084d7ded35e2840386f04d609cdb49c7e36d8800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000050380ac8da73d73719785f0a4433192f4e0e6c9000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000000000000000000000",
  receipt_cumulative_gas_used: string // "73396504",
  receipt_gas_used: string // "743092",
  receipt_contract_address: string | null
  receipt_root: string | null
  receipt_status: string // "1",
  block_timestamp: string // "2021-08-12T14:29:54.000Z",
  block_number: string // "9967403",
  block_hash: string // "0x9673166f4eb5e5f7a224d40ec2d3572777f51badf2e6ce7ed5bfb373b6325e06"
}

export interface ITransactionResponse {
  total: number // 22,
  page: number // 0,
  page_size: number // 500,
  result: ITransaction[]
}

export interface ITransfer {
  transaction_hash: string // "0xc007bdeadc18d4c9effef31fad9a174e3605a849f3a6862c4c948b0802a1d12f",
  address: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  block_timestamp: string // "2021-08-12T07:24:13.000Z",
  block_number: string // "9959085",
  block_hash: string // "0x83325835b79c92edd86b660ae66756ae719ce30fac97295a866ad4a3a7ba4784",
  to_address: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  from_address: string // "0x8155430e4860e791aeddb43e4764d15de7e0def1",
  value: string // "800000000000000000000000"
}

export interface IBlockEvent {
  transaction_hash: string // "0xc007bdeadc18d4c9effef31fad9a174e3605a849f3a6862c4c948b0802a1d12f",
  address: string // "0x158da805682bdc8ee32d52833ad41e74bb951e59",
  block_timestamp: string // "2021-08-12T07:24:13.000Z",
  block_number: string // "9959085",
  block_hash: string // "0x83325835b79c92edd86b660ae66756ae719ce30fac97295a866ad4a3a7ba4784",
  data: any //{"uid":"18243","loan":"0"}
}

export interface IToken {
  address: string
  symbol: string
  amount: number
}

// Database Scope

export enum MethodType {
  deposit = 'deposit',
  approve = 'approve',
  work = 'work',
  transfer = 'transfer',
  reinvest = 'reinvest',
  claim = 'claim',
  harvest = 'harvest',
  kill = 'kill',
  addCollateral = 'addCollateral',

  // Pancake
  swapETHForExactTokens = 'swapETHForExactTokens',
  swapExactETHForTokens = 'swapExactETHForTokens',
  swapExactETHForTokensSupportingFeeOnTransferTokens = 'swapExactETHForTokensSupportingFeeOnTransferTokens',
  swapExactTokensForETH = 'swapExactTokensForETH',
  swapExactTokensForETHSupportingFeeOnTransferTokens = 'swapExactTokensForETHSupportingFeeOnTransferTokens',
  swapExactTokensForTokensSupportingFeeOnTransferTokens = 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
  swapTokensForExactETH = 'swapTokensForExactETH',
  swapExactTokensForTokens = 'swapExactTokensForTokens'
}

export enum DirectionType {
  OUT = 'out',
  IN = 'in'
}

export interface ITransferInfo extends ITransfer {
  direction: DirectionType
  stratType: string
  stratName: string

  tokenSymbol: string
  tokenAddress: string
  tokenPriceUSD: number
  tokenAmount: number
  tokenValueUSD: number
  positionId: number
}
