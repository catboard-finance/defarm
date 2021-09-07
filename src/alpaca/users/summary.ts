import _ from "lodash"
import { withCurrentPosition } from "./position";
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

  const farmHistories = userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as ILendInvestmentInfo[]
  const recordedFarmGroup = _.groupBy(farmHistories, 'positionId') as unknown as IFarmInvestmentInfo[]
  const farmPositions = Object.values(recordedFarmGroup).map(farmInfos => ({
    vaultAddress: farmInfos[0].vaultAddress,
    positionId: farmInfos[0].positionId,
  }))

  const farmCurrents = await withCurrentPosition(farmPositions)

  ///////// LEND /////////

  const lendHistories = userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.lend) as ILendInvestmentInfo[]
  const lendCurrents = sumLendEarning(lendHistories)

  ///////// POOL /////////

  const stakeHistories = userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.stake) as IStakeInvestmentInfo[]
  const stakeCurrents = sumStakeEarning(stakeHistories)

  ///////// SUMMARY /////////

  const res = {
    history: {
      farms: farmHistories,
      lends: lendHistories,
      stakes: stakeHistories,
    },
    current: {
      farms: farmCurrents,
      lends: lendCurrents,
      stakes: stakeCurrents,
    }
  }

  return res
}
