import _ from "lodash"
import { withDebt } from "../vaults/debt";
import { IFarmInvestmentInfo, IUserInvestmentInfo } from "./investment";

// farms
export const getInvestmentSummary = async (userFarmInfos: IUserInvestmentInfo[]) => {

  ////////////////// SUMMARY //////////////////

  // Add historical price at contract time

  // Separate by position and pool
  const transferPositionInfoMap = _.groupBy(userFarmInfos, 'investmentType') as any
  const recordedFarmGroup = _.groupBy(transferPositionInfoMap.farm, 'positionId') as unknown as IFarmInvestmentInfo[]
  // const lendPoolGroup = _.groupBy(transferPositionInfoMap.lend, 'poolName');
  // const stakePoolGroup = _.groupBy(transferPositionInfoMap.stake, 'poolName');

  // Get current position info
  const farms = Object.values(recordedFarmGroup)
  const farmPositions = farms.map(farmInfos => ({
    vaultAddress: farmInfos[0].vaultAddress,
    positionId: farmInfos[0].positionId,
  }))

  const aggregatedFarms = await withDebt(farmPositions)
  // const aggregatedFarmGroup = _.groupBy(transferPositionInfoMap.farm, 'positionId')
  const res = {
    userFarmInfos,
    recordedFarms: transferPositionInfoMap.farm,
    aggregatedFarms,
  }

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

  return res
}
