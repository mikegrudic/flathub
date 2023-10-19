import type {
  CatalogHierarchyNode,
  DataPostRequestBody,
  DataResponse,
  DataRow
} from "../types";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type AccessorColumnDef,
  type ColumnDef,
  type GroupColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import {
  fetch_api_post,
  get_field_type,
  log,
  is_leaf_node,
  is_root_node
} from "../shared";
import { useFilters } from "../filters";
import { BigButton, CollapsibleSection, Placeholder } from "./Primitives";
import Katex from "./Katex";
import { useCatalogID } from "./CatalogContext";
import { useCatalogMetadata } from "./CatalogMetadata";
import { useCurrentColumnIDs } from "../columns";

export default function TableSection() {
  return (
    <CollapsibleSection label="table">
      <div className="space-y-4">
        <div className="grid">
          <BigButton className="w-full">Select Columns</BigButton>
        </div>
        <Table />
      </div>
    </CollapsibleSection>
  );
}

function Table() {
  const catalog_id = useCatalogID();

  const fields = Array.from(useCurrentColumnIDs());

  const filters = useFilters();

  const [rows_per_page] = React.useState(25);
  const [offset, set_offset] = React.useState(0);

  const request_body: DataPostRequestBody = {
    object: true,
    fields: fields,
    ...filters,
    count: rows_per_page,
    offset
    // ...query_parameters
  };

  const query_config = {
    path: `/${catalog_id}/data`,
    body: request_body
  };

  const enable_request = !!catalog_id && fields.length > 0;

  const query = useQuery({
    queryKey: [`table-data`, query_config],
    queryFn: async (): Promise<DataResponse> => {
      return fetch_api_post<DataPostRequestBody, DataResponse>(
        query_config.path,
        query_config.body
      );
    },
    enabled: enable_request,
    staleTime: Infinity
  });

  const component = (() => {
    if (!query.data) {
      return <Placeholder className="h-[400px]">Loading...</Placeholder>;
    } else if (query.data && query.data.length === 0) {
      return <Placeholder className="h-[400px]">Empty response.</Placeholder>;
    } else if (query.data && query.data.length > 0) {
      return (
        <div className="overflow-x-scroll desktop:max-w-none">
          <TablePrimitive data={query.data} />
        </div>
      );
    }
  })();

  return (
    <>
      {component}
      <div>offset: {offset}</div>
      <button
        onClick={() => {
          set_offset(offset + rows_per_page);
        }}
      >
        add {rows_per_page} to offset
      </button>
    </>
  );
}

function TablePrimitive({ data }: { data: Array<DataRow> }) {
  const catalog_metadata_wrapper = useCatalogMetadata();
  const catalog_hierarchy = catalog_metadata_wrapper?.hierarchy;

  const columns = construct_table_columns(data, catalog_hierarchy);

  log(`columns`, columns);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const header_groups = table.getHeaderGroups();
  const skip_rendering = new Set();
  return (
    <table>
      <thead>
        {header_groups.map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header_initial) => {
              let header = header_initial;
              let row_span = 1;
              if (skip_rendering.has(header.column.id)) return null;
              // If it's a placeholder:
              // - Skip rendering any future headers
              // - Set row span based on the depth of non-placeholder header
              if (header.isPlaceholder) {
                skip_rendering.add(header.column.id);
                const leaves = header.getLeafHeaders();
                const non_placeholder_header = leaves.find(
                  (leaf) => !leaf.isPlaceholder
                );
                if (!non_placeholder_header) {
                  throw new Error(
                    `No non-placeholder header found for ${header.column.id}`
                  );
                }
                row_span = 1 + non_placeholder_header.depth - header.depth;
              }
              return (
                <th
                  className="border-2 px-2 py-1 "
                  key={header.id}
                  colSpan={header.colSpan}
                  rowSpan={row_span}
                >
                  {
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
                  }
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="whitespace-nowrap px-2 py-1 text-right"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * We have a list of **leaf** fields that we want to display in a table.
 * We need to get their ancestors for the column headers.
 *
 * @param data Table data
 * @param catalog_field_hierarchy The complete field hierarchy for this catalog
 * @returns An array of column definitions for use with react-table
 */
function construct_table_columns(
  data: DataResponse,
  catalog_field_hierarchy: CatalogHierarchyNode
): ColumnDef<DataRow>[] {
  if (data.length === 0) return [];
  if (!catalog_field_hierarchy)
    throw new Error(`catalog_field_hierarchy is null`);
  // Get IDs of the leaf fields based on keys in data
  const leaf_column_ids_set = new Set(Object.keys(data[0] ?? {}));

  // log(`field_ids_set`, field_ids_set)

  // Recursively construct column definitions
  const next = (
    node: CatalogHierarchyNode
  ): GroupColumnDef<DataRow> | AccessorColumnDef<DataRow> | null => {
    // Include this node if:
    // - It is a leaf node, and is one of the fields in field_ids_set
    // - It is the ancestor of one of the fields in field_ids_set
    const is_visible_leaf_field =
      is_leaf_node(node) && leaf_column_ids_set.has(node.data.name);
    const is_ancestor_of_field = node
      .leaves()
      .some((child) => leaf_column_ids_set.has(child.data.name));
    const include = is_visible_leaf_field || is_ancestor_of_field;
    if (!include) return null;

    const child_columns: ColumnDef<DataRow>[] = [];

    for (const child of node.children ?? []) {
      const child_column = next(child);
      if (child_column) {
        child_columns.push(child_column);
      }
    }

    let field_id = node.data.name;

    if (field_id?.length === 0) {
      field_id = node.data.title;
    }

    if (is_root_node(node)) {
      field_id = `root`;
    }

    if (!field_id || field_id.length === 0) {
      console.error(
        `construct_table_columns: field_id is empty for node:`,
        node
      );
      throw new Error(`field_id is empty`);
    }

    const column_base: ColumnDef<DataRow> = {
      id: field_id,
      header: () => <Katex>{node.data.title ?? node.data.name}</Katex>
    };

    if (child_columns.length === 0) {
      const column: AccessorColumnDef<DataRow> = {
        ...column_base,
        accessorFn: (row) => {
          const value = row[field_id];
          const field_type = get_field_type(node.data);
          if (
            field_type === `LABELLED_ENUMERABLE_INTEGER` ||
            field_type === `LABELLED_ENUMERABLE_BOOLEAN`
          ) {
            const index = typeof value === "number" ? value : Number(value);
            const text = node.data.enum[index];
            return text;
          }
          return value;
        },
        cell: (row) => row.getValue()
      };
      return column;
    } else {
      const column: GroupColumnDef<DataRow> = {
        ...column_base,
        columns: child_columns
      };
      return column;
    }
  };
  const root = next(catalog_field_hierarchy);
  // if (root === null) throw new Error(`root is null`);
  if (root === null) {
    console.error(`construct_table_columns: root is null`);
    return null;
  }
  if (!("columns" in root)) throw new Error(`root.columns is not defined`);
  const columns = root?.columns ?? [];
  return columns;
}
