import _ from "lodash"
import { withPosition } from "../vaults/debt";
import { IFarmInvestmentInfo, IUserInvestmentInfo } from "./investment";

// farms
export const getInvestmentSummary = async (userFarmInfos: IUserInvestmentInfo[]) => {
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

  const aggregatedFarms = await withPosition(farmPositions)

  const res = {
    history: {
      farms: transferPositionInfoMap.farm,
      lends: transferPositionInfoMap.lend,
      stakes: transferPositionInfoMap.stake,
    },
    total: {
      farms: aggregatedFarms,
      lends: null, // TODO: fetch lend
      stakes: null, // TODO: fetch stake
    }
  }

  return res
}
