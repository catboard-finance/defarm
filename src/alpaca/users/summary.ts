import _ from "lodash"
import { IUserInvestmentInfo } from "./investment";

// farms
export const getInvestmentPerFarms = (userFarmInfos: IUserInvestmentInfo[]) => {

  ////////////////// SUMMARY //////////////////

  // Add historical price at contract time

  // Define token ratio (for estimate each token amounts) by tokens numbers in vault

  // Summary deposits/withdraws

  // Summary token each lend/stake/farm

  ///////////////////////////////////////////////////////////////////

  // Get equity from chain (or API)

  // Divide current token from equity by farm ratio

  // Summary from lend/stake/farm

  // Summary token from lend/stake/farm

  // Group by position
  // const transferPositionInfoMap = {
  //   farms: Object.values(_.groupBy(userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.farm), 'positionId')),
  //   lend: Object.values(_.groupBy(userFarmInfos.filter(e => e.investmentType === InvestmentTypeObject.lend), 'poolId')),
  // }

  const transferPositionInfoMap = _.groupBy(userFarmInfos, 'investmentType') as any
  transferPositionInfoMap.farm = _.groupBy(transferPositionInfoMap.farm, 'positionId');
  transferPositionInfoMap.lend = _.groupBy(transferPositionInfoMap.lend, 'poolName');
  transferPositionInfoMap.stake = _.groupBy(transferPositionInfoMap.stake, 'poolName');

  return transferPositionInfoMap
}
