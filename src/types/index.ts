import { z } from "zod";
import {
  personSchema,
  localizedPropertiesSchema,
  companySchema,
  geometrySchema,
  placePropertiesSchema,
  placeSchema,
  placesSchema,
} from "../schemas/index";

export type Person = z.infer<typeof personSchema>;
export type LocalizedProperties = z.infer<typeof localizedPropertiesSchema>;
export type Company = z.infer<typeof companySchema>;
export type PlaceProperties = z.infer<typeof placePropertiesSchema>;
export type PlaceGeometry = z.infer<typeof geometrySchema>;
export type Place = z.infer<typeof placeSchema>;
export type Places = z.infer<typeof placesSchema>;
