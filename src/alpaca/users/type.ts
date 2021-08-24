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
  unstakingToken: string

  amount: BigNumber;
  rewardDebt: BigNumber;
  bonusDebt: BigNumber;
  fundedBy: string // address;
}
