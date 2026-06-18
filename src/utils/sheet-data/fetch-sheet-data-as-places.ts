import type { Places } from "../../types";

import { convertCsvToObject } from "../../lib";

import { fetchCSV } from "./fetch-csv";
import { getPlaces } from "./get-places";

export async function fetchSheetDataAsPlaces(
  csvDownloadUrl: string,
): Promise<Places> {
  const csvString = await fetchCSV(csvDownloadUrl);
  const csvObject = convertCsvToObject(csvString);
  return getPlaces(csvObject);
}
