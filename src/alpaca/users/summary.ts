import _ from "lodash"
import { IUserInvestmentInfo } from "./farms";

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
  const transferPositionInfoMap = {
    farms: Object.values(_.groupBy(userFarmInfos.filter(e => e), 'positionId'))
  }
  return transferPositionInfoMap
}
