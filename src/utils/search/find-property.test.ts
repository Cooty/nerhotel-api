import findProperty from "./find-property";
import removeAccents from "./remove-accents";
import { getUniqueElements } from "../get-unique-elements";

import type { PlaceProperties } from "../../types";

jest.mock("./remove-accents", () => ({
  __esModule: true,
  default: jest.fn((str: string) => str),
}));

jest.mock("../get-unique-elements", () => ({
  getUniqueElements: jest.fn((arr: unknown[]) => [...new Set(arr)]),
}));

const mockedRemoveAccents = jest.mocked(removeAccents);
const mockedGetUniqueElements = jest.mocked(getUniqueElements);

describe("findProperty", () => {
  let mockPlace: PlaceProperties;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlace = {
      id: "434",
      address: "Budapest, Expo tér 2., 1101",
      company: {
        name: "MMG Hotels Kft.",
        link: "",
      },
      name: "Exploré",
      city: "Budapest",
      type: "étterem",
      link: "",
      mainOligarch: [
        { name: "Awad Zuhair Fathi", link: "", id: "5571" },
        { name: "Hamdan Sameer Mahmoud", link: "", id: "6529" },
      ],
      mainCEO: [
        { name: "Awad Zuhair Fathi", link: "", id: "5571" },
        { name: "Hamdan Sameer Mahmoud", link: "", id: "6529" },
      ],
      oligarchs: [
        { name: "Awad Zuhair Fathi", link: "", id: "5571" },
        { name: "Hamdan Sameer Mahmoud", link: "", id: "6529" },
      ],
      ceos: [
        { name: "Awad Zuhair Fathi", link: "", id: "5571" },
        { name: "Hamdan Sameer Mahmoud", link: "", id: "6529" },
      ],
      date: "2026-04-17",
      details: "",
      en: {
        name: null,
        link: null,
        details: null,
        type: "restaurant",
      },
      de: {
        name: null,
        link: null,
        details: null,
        type: "Restaurant",
      },
      picture:
        "https://www.diningcity.hu/media/restaurantwidepictures/49943_explore_restaurant_sky_bar.jpg",
    };
  });

  it("should return true if the phrase matches the place name lowercase", () => {
    expect(findProperty(mockPlace, "exploré")).toBe(true);
  });

  it("should return true if the phrase matches the address", () => {
    expect(findProperty(mockPlace, "expo")).toBe(true);
  });

  it("should return true if the phrase matches a CEO's name", () => {
    expect(findProperty(mockPlace, "Awad")).toBe(true);
  });

  it("should return true if the phrase matches an oligarch's name", () => {
    expect(findProperty(mockPlace, "Mahmoud")).toBe(true);
  });

  it("should return false if the phrase does not match any fields", () => {
    expect(findProperty(mockPlace, "nope")).toBe(false);
  });

  it("should call removeAccents if standard lowercase matching fails", () => {
    mockedRemoveAccents.mockReturnValueOnce("matching-accent-fallback");

    expect(findProperty(mockPlace, "matching-accent-fallback")).toBe(true);
    expect(removeAccents).toHaveBeenCalled();
  });

  it("should handle missing optional properties gracefully without throwing errors", () => {
    const barebonesPlace = {
      id: "some",
      ceos: [],
      oligarchs: [],
      mainOligarch: [],
      mainCEO: [],
    } as unknown as PlaceProperties;

    expect(findProperty(barebonesPlace, "anything")).toBe(false);
  });

  it("should correctly filter duplicates using getUniqueElements", () => {
    mockPlace.ceos = [{ name: "Duplicate" }];
    mockPlace.oligarchs = [{ name: "Duplicate" }];

    findProperty(mockPlace, "duplicate");

    expect(mockedGetUniqueElements).toHaveBeenCalledWith([
      "Duplicate",
      "Duplicate",
    ]);
  });
});
