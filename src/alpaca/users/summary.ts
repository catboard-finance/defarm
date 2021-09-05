import _ from "lodash"
import { IUserInvestmentInfo } from "./investment";

// farms
export const getInvestmentSummary = (userFarmInfos: IUserInvestmentInfo[]) => {

  ////////////////// SUMMARY //////////////////

  // Add historical price at contract time

  // Separate by position and pool
  const transferPositionInfoMap = _.groupBy(userFarmInfos, 'investmentType') as any
  transferPositionInfoMap.farm = _.groupBy(transferPositionInfoMap.farm, 'positionId');
  transferPositionInfoMap.lend = _.groupBy(transferPositionInfoMap.lend, 'poolName');
  transferPositionInfoMap.stake = _.groupBy(transferPositionInfoMap.stake, 'poolName');

  // Summary lend/stake/farm
  // const summary = {
  //   farms: Object.keys(transferPositionInfoMap.farm).map(e => {
  //     const farm = transferPositionInfoMap.farm[e]
  //     const symbolGroup = _.groupBy(farm.transfers, 'tokenSymbol')
  //     return {
  //       positionId: e,
  //       symbolGroup,
  //     }
  //   }),
  // }

  return transferPositionInfoMap
}
