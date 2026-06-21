import type { Places } from "../../types";

export function getAllPlacesAffiliatedWithPerson(
  places: Places,
  personName: string,
): Places {
  return places.filter(
    (place) =>
      place.properties.ceos.find((ceo) => ceo.name === personName) ||
      place.properties.oligarchs.find(
        (oligarch) => oligarch.name === personName,
      ),
  );
}
