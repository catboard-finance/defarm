import { BigNumber } from "ethers";

export interface ICall {
  target: string;
  params?: any[];
}

export interface IUserLend {
  poolAddress: string;
  balance: BigNumber;
}

export interface IUserStake {
  poolAddress: string; // address;
  amount: BigNumber;
  rewardDebt: BigNumber;
  bonusDebt: BigNumber;
  fundedBy: string // address;
}
