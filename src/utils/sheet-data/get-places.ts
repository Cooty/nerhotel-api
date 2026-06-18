import type { Person, Places, Place } from "../../types";
import { placeSchema } from "../../schemas";

function cleanPersonData(person: Person) {
  return {
    name: person.name.replace(/!/g, "").trim(),
    link: person.link,
    id: person.id,
  };
}

function getMainOligarchs(people: Person[]) {
  return people
    .filter((person) => person.name && person.name.startsWith("!!!"))
    .map(cleanPersonData);
}

function getAllOligarchs(people: Person[]) {
  return people.filter((person) => person.name).map(cleanPersonData);
}

function makeAddress(city: string, address: string, zip: string) {
  const addressParts = [city];

  if (address) {
    addressParts.push(address);
  }

  if (zip) {
    addressParts.push(zip);
  }

  return addressParts.join(", ");
}

function getNullableCellValue(value: string): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }
  const normalizedValue = value.trim();
  const noDataCellValue = "#N/A";
  return !normalizedValue || normalizedValue === noDataCellValue
    ? null
    : normalizedValue;
}

export function getPlaces(csvRowsAsObjects: Record<string, string>[]): Places {
  const places: Places = [];
  csvRowsAsObjects.forEach((csvRow) => {
    const oligarchs = [
      {
        name: csvRow["T1 OL"],
        link: getNullableCellValue(csvRow["T1_link"]),
        id: getNullableCellValue(csvRow["T1_ID"]) ?? crypto.randomUUID(),
      },
      {
        name: csvRow["T2 OL"],
        link: getNullableCellValue(csvRow["T2_link"]),
        id: getNullableCellValue(csvRow["T2_ID"]) ?? crypto.randomUUID(),
      },
      {
        name: csvRow["T3 OL"],
        link: getNullableCellValue(csvRow["T3_link"]),
        id: getNullableCellValue(csvRow["T3_ID"]) ?? crypto.randomUUID(),
      },
    ];
    /** @type {{name: string, link: string}[]} */
    const ceos = [
      {
        name: csvRow["IT1"],
        link: getNullableCellValue(csvRow["IT1_link"]),
        id: getNullableCellValue(csvRow["IT1_ID"]) ?? crypto.randomUUID(),
      },
      {
        name: csvRow["IT2"],
        link: getNullableCellValue(csvRow["IT2_link"]),
        id: getNullableCellValue(csvRow["IT2_ID"]) ?? crypto.randomUUID(),
      },
      {
        name: csvRow["IT3"],
        link: getNullableCellValue(csvRow["IT3_link"]),
        id: getNullableCellValue(csvRow["IT3_ID"]) ?? crypto.randomUUID(),
      },
      {
        name: csvRow["IT4"],
        link: getNullableCellValue(csvRow["IT4_link"]),
        id: getNullableCellValue(csvRow["IT4_ID"]) ?? crypto.randomUUID(),
      },
      {
        name: csvRow["IT5"],
        link: getNullableCellValue(csvRow["IT5_link"]),
        id: getNullableCellValue(csvRow["IT5_ID"]) ?? crypto.randomUUID(),
      },
    ];
    const place = {
      type: "Feature",
      properties: {
        id: csvRow["pl_id"],
        address: makeAddress(
          csvRow["city"],
          csvRow["loc_address"],
          csvRow["zip"],
        ),
        company: {
          name: getNullableCellValue(csvRow["company"]),
          link: getNullableCellValue(csvRow["company_link"]),
        },
        name: csvRow["loc_name"],
        city: csvRow["city"],
        type: csvRow["type"],
        link: getNullableCellValue(csvRow["news"]),
        mainOligarch: getMainOligarchs(oligarchs),
        mainCEO: getMainOligarchs(ceos),
        oligarchs: getAllOligarchs(oligarchs),
        ceos: getAllOligarchs(ceos),
        date: csvRow["date"],
        details: getNullableCellValue(csvRow["details"]),
        en: {
          name: getNullableCellValue(csvRow["name_en"]),
          link: getNullableCellValue(csvRow["news_en"]),
          details: getNullableCellValue(csvRow["details_en"]),
          type: csvRow["category"],
        },
        de: {
          name: getNullableCellValue(csvRow["name_de"]),
          link: getNullableCellValue(csvRow["news_de"]),
          details: getNullableCellValue(csvRow["details_de"]),
          type: csvRow["category_de"],
        },
        picture: getNullableCellValue(csvRow["picture"]),
      },
      geometry: {
        type: "Point",
        coordinates: [parseFloat(csvRow["lat"]), parseFloat(csvRow["lng"])],
      },
    };
    const validation = placeSchema.safeParse(place);

    if (validation.success) {
      places.push(validation.data);
    }
  });

  return places;
}
