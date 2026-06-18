import { z } from "zod";

const nullableStringSchema = z.string().nullable();

const optionalNullableUrlSchema = z.url().nullish();

export const personSchema = z.object({
  name: z.string().min(1),
  link: optionalNullableUrlSchema,
  id: z.string().optional().nullable(),
});

export const localizedPropertiesSchema = z.object({
  name: nullableStringSchema,
  link: optionalNullableUrlSchema,
  details: nullableStringSchema,
  type: nullableStringSchema,
});

export const companySchema = z.object({
  name: nullableStringSchema,
  link: optionalNullableUrlSchema,
});

export const coordinatesSchema = z.tuple([
  z.number().min(-90).max(90), // latitude
  z.number().min(-180).max(180), // longitude
]);

export const geometrySchema = z.object({
  type: z.literal("Point"),
  coordinates: coordinatesSchema,
});

export const placePropertiesSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/),
  address: nullableStringSchema,
  company: companySchema,
  name: z.string().min(1),
  city: nullableStringSchema,
  type: z.string().min(1),
  link: optionalNullableUrlSchema,

  mainOligarch: z.array(personSchema),
  mainCEO: z.array(personSchema),
  oligarchs: z.array(personSchema),
  ceos: z.array(personSchema),

  date: z.string().min(1),
  details: nullableStringSchema,

  en: localizedPropertiesSchema,
  de: localizedPropertiesSchema,

  picture: optionalNullableUrlSchema,
});

export const placeSchema = z.object({
  type: z.literal("Feature"),
  properties: placePropertiesSchema,
  geometry: geometrySchema,
});

export const placesSchema = z.array(placeSchema);
