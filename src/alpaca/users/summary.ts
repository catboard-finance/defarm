import _ from "lodash"
import { withCurrentPosition } from "./position";
import { IFarmInvestmentInfo, ILendInvestmentInfo, IStakeInvestmentInfo, IUserInvestmentInfo } from "./investment";
import { InvestmentTypeObject } from "../utils/transaction";

// const sumFarmEarning = (farms: IFarmInvestmentInfo[]) => {
//   return {
//     spendValueUSD: _.sumBy(farms, "principalValueUSD"),
//     returnValueUSD: _.sumBy(farms, "rewardValueUSD"),
//   }
// }

// const sumLendEarning = (lends: ILendInvestmentInfo[]) => {
//   return {
//     depositValueUSD: _.sumBy(lends, "depositValueUSD"),
//     rewardValueUSD: _.sumBy(lends, "rewardValueUSD"),
//   }
// }

// const sumStakeEarning = (stakes: IStakeInvestmentInfo[]) => {
//   return {
//     stakeValueUSD: _.sumBy(stakes, "stakeValueUSD"),
//     rewardValueUSD: _.sumBy(stakes, "rewardValueUSD"),
//   }
// }

const getInvestedPositions = (farmHistories: IFarmInvestmentInfo[]) => {
  const recordedFarmGroup = _.groupBy(farmHistories, 'positionId') as unknown as IFarmInvestmentInfo[]
  const farmPositions = Object.values(recordedFarmGroup).map(farmInfos => ({
    vaultAddress: farmInfos[0].vaultAddress,
    positionId: farmInfos[0].positionId,
  }))

  return farmPositions
}

export const getInvestmentSummary = async (userInvestmentInfos: IUserInvestmentInfo[], userCurrentBalances: any[]) => {

  ///////// FARM /////////

  const farmHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as IFarmInvestmentInfo[]
  const farmCurrents = await withCurrentPosition(getInvestedPositions(farmHistories))

  ///////// EARN /////////

  // TODO: Gathering from claim history?
  // const earnHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as IFarmInvestmentInfo[]
  const earnCurrents = userCurrentBalances.filter(e => e.investmentType === InvestmentTypeObject.farm)

  ///////// LEND /////////

  const lendHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.lend) as ILendInvestmentInfo[]
  const lendCurrents = userCurrentBalances.filter(e => e.investmentType === InvestmentTypeObject.lend)

  ///////// POOL /////////

  const stakeHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.stake) as IStakeInvestmentInfo[]
  const stakeCurrents = userCurrentBalances.filter(e => e.investmentType === InvestmentTypeObject.stake)

  ///////// SUMMARY /////////

  const res = {
    history: {
      farms: farmHistories,
      lends: lendHistories,
      stakes: stakeHistories,
    },
    current: {
      farms: farmCurrents,
      earns: earnCurrents,
      lends: lendCurrents,
      stakes: stakeCurrents,
    }
  }

  return res
}
