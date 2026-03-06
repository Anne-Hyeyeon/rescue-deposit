import type { Region } from "./types";
import {
  findPeriodStart,
  OVERCROWDED_CITIES,
  OVERCROWDED_ADDITIONAL,
  METROPOLITAN_ADDITIONAL,
  METROPOLITAN_BASE_CITIES,
} from "./constants";

// ===== Region Resolution =====

const extractCity = (address: string): string => {
  if (address.includes("서울") || address.startsWith("서울")) return "서울특별시";
  if (address.includes("세종특별자치시") || address.startsWith("세종")) return "세종특별자치시";

  const metroMatch = address.match(
    /(부산|대구|인천|대전|광주|울산)(?:광역시)?/
  );
  if (metroMatch) {
    return `${metroMatch[1]}광역시`;
  }

  const cityMatch = address.match(/(?:경기도\s+)?(\S+?시)/);
  if (cityMatch) return cityMatch[1];

  return address;
};

const isGunArea = (address: string): boolean => {
  const gunMatch = address.match(/([가-힣]+군)/);
  if (!gunMatch) return false;
  const gunNames = ["기장군", "달성군", "울주군", "강화군", "옹진군"];
  return gunNames.some((g) => address.includes(g));
};

export const resolveRegion = (
  address: string,
  referenceDate: string
): Region => {
  const city = extractCity(address);

  // 1. Seoul
  if (city === "서울특별시" || city.startsWith("서울")) return "seoul";

  // 2. Overcrowded (base list)
  if ((OVERCROWDED_CITIES as ReadonlyArray<string>).includes(city))
    return "overcrowded";

  // 3. Overcrowded (period-specific additions)
  const period = findPeriodStart(referenceDate);
  const overcrowdedAdditional = OVERCROWDED_ADDITIONAL[period];
  if (overcrowdedAdditional && overcrowdedAdditional.includes(city))
    return "overcrowded";

  // 4. Metropolitan base cities (exclude gun areas)
  const matchedMetro = METROPOLITAN_BASE_CITIES.find((m) =>
    city.startsWith(m.replace("광역시", ""))
  );
  if (matchedMetro) {
    return isGunArea(address) ? "others" : "metropolitan";
  }

  // 5. Metropolitan additional cities (period-specific)
  const metropolitanAdditional = METROPOLITAN_ADDITIONAL[period];
  if (metropolitanAdditional && metropolitanAdditional.includes(city))
    return "metropolitan";

  // 6. Others
  return "others";
};
