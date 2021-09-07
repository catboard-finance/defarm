import { BigNumber } from "ethers";

export interface ICall {
  target: string;
  params?: any[];
}

export interface IUserLend {
  poolAddress: string;
  amount: BigNumber;
}

export interface IUserStake {
  fairLaunchPoolAddress: string
  poolId: number
  poolAddress: string; // address;
  stakingToken: string
  rewardToken: string

  amount: BigNumber;
  rewardDebt: BigNumber; // pending reward = (user.amount * pool.accAlpacaPerShare) - user.rewardDebt
  bonusDebt: BigNumber;
  fundedBy: string // address;

  pendingAlpaca: BigNumber;
}

export interface IUserEarn {
  fairLaunchPoolAddress: string
  poolId: number
  poolAddress: string; // address;

  pendingAlpaca: BigNumber;
}

export interface IUserBalance {
  symbol: string,
  name?: string,
  address?: string,
  amount: number,
}

export interface IUserPositionUSD {
  positionValueUSD: number;
  debtValueUSD: number;
  vaultSymbol: string;
  equityValueUSD: number;
  debtRatio: number;
  safetyBuffer: number;

  farmSymbol: string // symbol
  // farmTokenAmount: number;
  // quoteTokenAmount: number;
}