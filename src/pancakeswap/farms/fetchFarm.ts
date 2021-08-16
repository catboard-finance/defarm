import { Farm } from '../types'
import fetchPublicFarmData from './fetchPublicFarmData'

const fetchFarm = async (farm: Farm): Promise<Farm> => {
  const farmPublicData = await fetchPublicFarmData(farm)

  return { ...farm, ...farmPublicData }
}

export default fetchFarm
