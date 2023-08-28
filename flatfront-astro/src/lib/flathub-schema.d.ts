/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

/** OneOf type helpers */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;
type OneOf<T extends any[]> = T extends [infer Only]
  ? Only
  : T extends [infer A, infer B, ...infer Rest]
  ? OneOf<[XOR<A, B>, ...Rest]>
  : never;

export interface paths {
  "/": {
    /** Get the list of available dataset catalogs */
    get: operations["top"];
  };
  "/{catalog}": {
    /** Get full metadata about a specific catalog */
    get: operations["catalog"];
  };
  "/{catalog}/schema.sql": {
    /** Get a SQL representation of the catalog schema (no data) */
    get: operations["schema.sql"];
  };
  "/{catalog}/schema.csv": {
    /** Get a CSV representation of the catalog schema (no data) */
    get: operations["schema.csv"];
  };
  "/{catalog}/data": {
    /** Get a sample of raw data rows */
    get: operations["data"];
    /** Get a sample of raw data rows */
    post: operations["dataPOST"];
  };
  "/{catalog}/data/{format}": {
    /** Download raw data in bulk */
    get: operations["download"];
    /** Download raw data in bulk */
    post: operations["downloadPOST"];
  };
  "/{catalog}/count": {
    /** Get count of matching rows (given some filters) */
    get: operations["count"];
    /** Get count of matching rows (given some filters) */
    post: operations["countPOST"];
  };
  "/{catalog}/stats": {
    /** Get statistics about fields (given some filters) */
    get: operations["stats"];
    /** Get statistics about fields (given some filters) */
    post: operations["statsPOST"];
  };
  "/{catalog}/histogram": {
    /** Get a histogram of data across one or more fields */
    get: operations["histogram"];
    /** Get a histogram of data across one or more fields */
    post: operations["histogramPOST"];
  };
  "/{catalog}/attachment/{field}/{id}": {
    /** Download a row attachment */
    get: operations["attachment"];
  };
  "/{catalog}/attachments/{format}": {
    /** Download attachments in bulk from matching rows for multiple fields */
    get: operations["attachments"];
    /** Download attachments in bulk from matching rows for multiple fields */
    post: operations["attachmentsPOST"];
  };
  "/{catalog}/attachments/{format}/{field}": {
    /** Download attachments in bulk from matching rows for single field */
    get: operations["attachments1"];
    /** Download attachments in bulk from matching rows for single field */
    post: operations["attachments1POST"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    /**
     * catalog metadata
     * @description High-level metadata for a dataset catalog
     */
    CatalogMeta: {
      /** @description long description in html */
      descr?: string;
      /** @description globally unique catalog name used in urls */
      name: string;
      /** @description short description in plain text */
      synopsis?: string;
      /** @description display name */
      title: string;
    };
    /**
     * scalar value
     * @description a scalar value for a field
     */
    FieldValueScalar: number | boolean | string;
    /**
     * field value
     * @description a value for a field, which must match the type of the field
     */
    FieldValue:
      | components["schemas"]["FieldValueScalar"]
      | components["schemas"]["FieldValueScalar"][];
    /**
     * field stats
     * @description stats for the field named by the property, depending on its type
     */
    FieldStats: OneOf<
      [
        {
          /** @description mean value */
          avg: number | null;
          /** @description number of rows with values for this field */
          count: number;
          /** @description maximum value */
          max: number | null;
          /** @description minimum value */
          min: number | null;
        },
        {
          /** @description number of rows with values not included in the top terms */
          others: number;
          /**
           * top terms
           * @description top terms in descending order of count
           */
          terms: {
            /** @description number of rows with this value */
            count: number;
            value: components["schemas"]["FieldValue"];
          }[];
        }
      ]
    >;
    /**
     * field type
     * @description storage type
     * @enum {string}
     */
    Type:
      | "double"
      | "float"
      | "half_float"
      | "long"
      | "unsigned_long"
      | "integer"
      | "short"
      | "byte"
      | "boolean"
      | "keyword"
      | "array double"
      | "array float"
      | "array half_float"
      | "array long"
      | "array unsigned_long"
      | "array integer"
      | "array short"
      | "array byte"
      | "array boolean"
      | "array keyword";
    /**
     * field
     * @description A single field within a catalog, or a hiearchical group of fields
     */
    FieldGroup: {
      /** @description this is a meta field for a downloadable attachment (type boolean, indicating presence) */
      attachment?: boolean;
      /**
       * @description base storage type (floating, integral, boolean, string, void) for base scalar values of this field
       * @enum {string}
       */
      base: "f" | "i" | "b" | "s" | "v";
      /** @description description of field within the group */
      descr?: string;
      /** @description unique key index to global field dictionary (for compare) */
      dict?: string;
      /** @description include field in data display by default */
      disp?: boolean;
      /** @description numpy dtype for base scalar values of this field */
      dtype: string;
      /** @description if present, display values as these keywords instead (integral or boolean: enum[<int>value]) */
      enum?: string[];
      /** @description global unique ("variable") name of field within the catalog */
      name: string;
      /** @description true = required field (field you should filter on first to select data sub-set); false = top-level optional field (field that you likely want to filter on by default); missing = normal */
      required?: boolean;
      /** @description display axes and ranges in reverse (high-low) */
      reversed?: boolean;
      /** @description scale factor to dict-comparable units, display  value*scale (for compare) */
      scale?: number;
      stats?: components["schemas"]["FieldStats"];
      /** @description true if this field is stored but not indexed, so not permitted for filtering or aggregations */
      store?: boolean;
      /**
       * child fields
       * @description if this is present, this is a pseudo grouping field which does not exist itself, but its properties apply to its children
       */
      sub?: components["schemas"]["FieldGroup"][];
      /** @description display dynamically as a dropdown of values */
      terms?: boolean;
      /** @description display name of the field within the group */
      title: string;
      type: components["schemas"]["Type"];
      /** @description display units */
      units?: string;
      /** @description allow wildcard prefix searching on keyword field ("xy*") */
      wildcard?: boolean;
    };
    /** @description filters to apply to a query */
    Filters: {
      /**
       * Format: double
       * @description randomly select a fractional sample
       * @default 1
       */
      sample?: number;
      /**
       * @description seed for random sample selection
       * @default 0
       */
      seed?: number;
      [key: string]:
        | OneOf<
            [
              components["schemas"]["FieldValue"],
              components["schemas"]["FieldValue"][],
              {
                gte?: components["schemas"]["FieldValue"];
                lte?: components["schemas"]["FieldValue"];
              },
              {
                /** @description a pattern containing '*' and/or '?' */
                wildcard: string;
              }
            ]
          >
        | undefined;
    };
    /**
     * field name
     * @description field name in selected catalog
     */
    FieldName: string;
    /** field list */
    FieldList: components["schemas"]["FieldName"][];
    /** sort */
    sort: OneOf<
      [
        components["schemas"]["FieldName"],
        {
          field: components["schemas"]["FieldName"];
          /**
           * sort ordering
           * @description ascending smallest to largest, or descending largest to smallest
           * @default asc
           * @enum {string}
           */
          order?: "asc" | "desc";
        }
      ]
    >[];
    /**
     * data result
     * @description result data in the format requested, representing an array (over rows) of arrays (over values); in some formats the first row may be a list of field names
     */
    data: (components["schemas"]["FieldValue"] | null)[][];
    /** histogram field */
    Histogram: OneOf<
      [
        components["schemas"]["FieldName"],
        {
          field: components["schemas"]["FieldName"];
          /**
           * histogram scale
           * @description whether to calculate the histogram using log-spaced buckets (rather than linear spacing)
           * @default false
           */
          log?: boolean;
          /**
           * histogram size
           * @description number of buckets to include in the histogram
           * @default 16
           */
          size?: number;
        }
      ]
    >;
    /** histogram fields */
    HistogramList:
      | components["schemas"]["Histogram"]
      | components["schemas"]["Histogram"][];
  };
  responses: {
    /** @description top result */
    top: {
      content: {
        "application/json": components["schemas"]["CatalogMeta"][];
      };
    };
    /** @description catalog result */
    catalog: {
      content: {
        "application/json": components["schemas"]["CatalogMeta"] & {
          /** @description total number of rows */
          count: number;
          /** field groups */
          fields: components["schemas"]["FieldGroup"][];
          /** @description default sort fields */
          sort?: string[];
        };
      };
    };
    /** @description schema.sql result */
    "schema.sql": {
      content: {
        "application/sql": unknown;
      };
    };
    /** @description schema.csv result */
    "schema.csv": {
      content: {
        "text/csv": unknown;
      };
    };
    /** @description selected data */
    data: {
      content: {
        "application/json": components["schemas"]["data"];
      };
    };
    /** @description file containing all matching content in the selected format */
    download: {
      content: {
        "application/fits": components["schemas"]["data"];
        "application/x-npy": components["schemas"]["data"];
        "text/x-ecsv": components["schemas"]["data"];
        "application/x-ndjson": components["schemas"]["data"];
        "application/json": components["schemas"]["data"];
        "text/csv": components["schemas"]["data"];
        "application/gzip": components["schemas"]["data"];
      };
    };
    /** @description count result */
    count: {
      content: {
        "application/json": number;
      };
    };
    /** @description stats result */
    stats: {
      content: {
        "application/json": {
          [key: string]: components["schemas"]["FieldStats"];
        };
      };
    };
    /** @description histogram result */
    histogram: {
      content: {
        "application/json": {
          buckets: {
            /** @description the number of rows with values that fall within this bucket */
            count: number;
            /** @description the minimum (left) point of this bucket, such than the bucket includes the range [key,key+size) (or [key,key*size) for log scale) */
            key: components["schemas"]["FieldValue"][];
            /** @description if quartiles of a field were requested, includes the values of that field corresponding to the [0,25,50,75,100] percentiles ([min, first quartile, median, third quartile, max]) for rows within this bucket */
            quartiles?: components["schemas"]["FieldValue"][];
          }[];
          /**
           * bucket dimensions
           * @description field order corresponds to the requested histogram fields and bucket keys
           */
          sizes: number[];
        };
      };
    };
    /** @description attachment result */
    attachment: {
      content: {
        "application/octet-stream": unknown;
      };
    };
    /** @description file containing all matching attachments in the selected format */
    attachments: {
      content: {
        "text/uri-list": unknown;
        "application/zip": unknown;
        "text/x-shellscript": unknown;
      };
    };
    /** @description file containing all matching attachments in the selected format */
    attachments1: {
      content: {
        "text/uri-list": unknown;
        "application/zip": unknown;
        "text/x-shellscript": unknown;
      };
    };
  };
  parameters: {
    /** @description filter in query string (see descriptions for non-standard formatting of range queries) */
    filters?: components["schemas"]["Filters"];
    /** @description list of fields to return */
    fields: components["schemas"]["FieldList"];
    /** @description how to order rows (see descriptions for non-standard formatting of sort order) */
    sort?: components["schemas"]["sort"];
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {
  /** Get the list of available dataset catalogs */
  top: {
    responses: {
      200: components["responses"]["top"];
    };
  };
  /** Get full metadata about a specific catalog */
  catalog: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    responses: {
      200: components["responses"]["catalog"];
    };
  };
  /** Get a SQL representation of the catalog schema (no data) */
  "schema.sql": {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    responses: {
      200: components["responses"]["schema.sql"];
    };
  };
  /** Get a CSV representation of the catalog schema (no data) */
  "schema.csv": {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    responses: {
      200: components["responses"]["schema.csv"];
    };
  };
  /** Get a sample of raw data rows */
  data: {
    parameters: {
      query: {
        filters?: components["parameters"]["filters"];
        fields: components["parameters"]["fields"];
        sort?: components["parameters"]["sort"];
        count: number;
        offset?: number;
        object?: boolean;
      };
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    responses: {
      200: components["responses"]["data"];
    };
  };
  /** Get a sample of raw data rows */
  dataPOST: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["Filters"] & {
          /** @description number of rows to return */
          count: number;
          fields: components["schemas"]["FieldList"];
          /**
           * @description return JSON objects instead of arrays of data
           * @default false
           */
          object?: boolean;
          /**
           * @description start at this row offset (0 means first)
           * @default 0
           */
          offset?: number;
          sort?: components["schemas"]["sort"];
        };
      };
    };
    responses: {
      200: components["responses"]["data"];
    };
  };
  /** Download raw data in bulk */
  download: {
    parameters: {
      query: {
        filters?: components["parameters"]["filters"];
        fields: components["parameters"]["fields"];
        sort?: components["parameters"]["sort"];
      };
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
        format:
          | "fits"
          | "fits.gz"
          | "npy"
          | "npy.gz"
          | "ecsv"
          | "ecsv.gz"
          | "ndjson"
          | "ndjson.gz"
          | "json"
          | "json.gz"
          | "csv"
          | "csv.gz";
      };
    };
    responses: {
      200: components["responses"]["download"];
    };
  };
  /** Download raw data in bulk */
  downloadPOST: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
        format:
          | "fits"
          | "fits.gz"
          | "npy"
          | "npy.gz"
          | "ecsv"
          | "ecsv.gz"
          | "ndjson"
          | "ndjson.gz"
          | "json"
          | "json.gz"
          | "csv"
          | "csv.gz";
      };
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["Filters"] & {
          fields: components["schemas"]["FieldList"];
          sort?: components["schemas"]["sort"];
        };
      };
    };
    responses: {
      200: components["responses"]["download"];
    };
  };
  /** Get count of matching rows (given some filters) */
  count: {
    parameters: {
      query?: {
        filters?: components["parameters"]["filters"];
      };
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    responses: {
      200: components["responses"]["count"];
    };
  };
  /** Get count of matching rows (given some filters) */
  countPOST: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["Filters"];
      };
    };
    responses: {
      200: components["responses"]["count"];
    };
  };
  /** Get statistics about fields (given some filters) */
  stats: {
    parameters: {
      query: {
        filters?: components["parameters"]["filters"];
        fields: components["parameters"]["fields"];
      };
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    responses: {
      200: components["responses"]["stats"];
    };
  };
  /** Get statistics about fields (given some filters) */
  statsPOST: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["Filters"] & {
          fields?: components["schemas"]["FieldList"];
        };
      };
    };
    responses: {
      200: components["responses"]["stats"];
    };
  };
  /** Get a histogram of data across one or more fields */
  histogram: {
    parameters: {
      query: {
        filters?: components["parameters"]["filters"];
        /** @description field(s) along which to calculate histograms (see descriptions for non-standard formatting of size/log) */
        fields: components["schemas"]["HistogramList"];
        /** @description optional field within which to calculate quartiles */
        quartiles?: components["schemas"]["FieldName"];
      };
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    responses: {
      200: components["responses"]["histogram"];
    };
  };
  /** Get a histogram of data across one or more fields */
  histogramPOST: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
      };
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["Filters"] & {
          fields: components["schemas"]["HistogramList"];
          quartiles?: components["schemas"]["FieldName"];
        };
      };
    };
    responses: {
      200: components["responses"]["histogram"];
    };
  };
  /** Download a row attachment */
  attachment: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
        /** @description field name of attachment */
        field: components["schemas"]["FieldName"];
        /** @description _id for row of interest */
        id: string;
      };
    };
    responses: {
      200: components["responses"]["attachment"];
    };
  };
  /** Download attachments in bulk from matching rows for multiple fields */
  attachments: {
    parameters: {
      query: {
        filters?: components["parameters"]["filters"];
        fields: components["parameters"]["fields"];
      };
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
        format: "uris" | "zip" | "sh";
      };
    };
    responses: {
      200: components["responses"]["attachments"];
    };
  };
  /** Download attachments in bulk from matching rows for multiple fields */
  attachmentsPOST: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
        format: "uris" | "zip" | "sh";
      };
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["Filters"] & {
          fields: components["schemas"]["FieldList"];
        };
      };
    };
    responses: {
      200: components["responses"]["attachments"];
    };
  };
  /** Download attachments in bulk from matching rows for single field */
  attachments1: {
    parameters: {
      query?: {
        filters?: components["parameters"]["filters"];
      };
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
        format: "uris" | "zip" | "sh";
        field: components["schemas"]["FieldName"];
      };
    };
    responses: {
      200: components["responses"]["attachments1"];
    };
  };
  /** Download attachments in bulk from matching rows for single field */
  attachments1POST: {
    parameters: {
      path: {
        /** @description catalog name from list of catalogs */
        catalog: string;
        format: "uris" | "zip" | "sh";
        field: components["schemas"]["FieldName"];
      };
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["Filters"];
      };
    };
    responses: {
      200: components["responses"]["attachments1"];
    };
  };
}
