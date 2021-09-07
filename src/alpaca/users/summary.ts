import _ from "lodash"
import { withPosition } from "./position";
import { IFarmInvestmentInfo, ILendInvestmentInfo, IStakeInvestmentInfo, IUserInvestmentInfo } from "./investment";
import { InvestmentTypeObject } from "../utils/transaction";

const sumLendEarning = (lends: ILendInvestmentInfo[]) => {
  return {
    depositValueUSD: _.sumBy(lends, "depositValueUSD"),
    rewardValueUSD: _.sumBy(lends, "rewardValueUSD"),
  }
}

const sumStakeEarning = (stakes: IStakeInvestmentInfo[]) => {
  return {
    stakeValueUSD: _.sumBy(stakes, "stakeValueUSD"),
    rewardValueUSD: _.sumBy(stakes, "rewardValueUSD"),
  }
}

export const getInvestmentSummary = async (userFarmInfos: IUserInvestmentInfo[]) => {

  ///////// FARM /////////

  const farms = userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as ILendInvestmentInfo[]
  const recordedFarmGroup = _.groupBy(farms, 'positionId') as unknown as IFarmInvestmentInfo[]
  const farmPositions = Object.values(recordedFarmGroup).map(farmInfos => ({
    vaultAddress: farmInfos[0].vaultAddress,
    positionId: farmInfos[0].positionId,
  }))

  const farmSummaries = await withPosition(farmPositions)

  ///////// LEND /////////

  const lends = userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.lend) as ILendInvestmentInfo[]
  const lendSummaries = sumLendEarning(lends)

  ///////// POOL /////////

  const stakes = userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.stake) as IStakeInvestmentInfo[]
  const stakeSummaries = sumStakeEarning(stakes)

  // Get total summary
  const res = {
    record: {
      farms,
      lends,
      stakes,
    },
    total: {
      farms: farmSummaries,
      lends: lendSummaries,
      stakes: stakeSummaries,
    }
  }

  return res
}
