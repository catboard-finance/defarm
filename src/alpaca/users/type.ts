import { BigNumber } from "ethers";

export interface ICall {
  target: string;
  params?: any[];
}

export interface UserLend {
  poolAddress: string;
  balance: BigNumber;
}
