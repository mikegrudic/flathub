import type {
  DataResponse,
  CatalogHierarchyNode,
  FieldMetadata,
  Datum,
} from "./types";

import type {
  ColumnDef,
  GroupColumnDef,
  AccessorColumnDef,
} from "@tanstack/react-table";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { log } from "./shared";
import Katex from "./Katex";

export default function Table({
  data,
  catalog_field_hierarchy,
}: {
  data: DataResponse;
  catalog_field_hierarchy: d3.HierarchyNode<FieldMetadata>;
}) {
  const columns = construct_table_columns(data, catalog_field_hierarchy);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const header_groups = table.getHeaderGroups();

  const skip_rendering = new Set();

  return (
    <div className="overflow-x-scroll">
      <table className="text-xs">
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
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
function construct_table_columns<T>(
  data: DataResponse,
  catalog_field_hierarchy: CatalogHierarchyNode
): ColumnDef<Datum>[] {
  if (data.length === 0) return [];
  // Get field names based on keys in data
  const field_names = Object.keys(data[0] ?? {});

  // Find the field nodes in the catalog field hierarchy
  const field_nodes = field_names
    .map((field_name) => {
      return catalog_field_hierarchy.find(
        (d: any) => d.data.name === field_name
      );
    })
    .filter((d): d is CatalogHierarchyNode => typeof d !== "undefined");

  // Get unix-like paths for nodes
  const get_path = (node: CatalogHierarchyNode) => {
    return node
      .ancestors()
      .map((d) => d.data.name ?? `ROOT`)
      .reverse()
      .join(`/`);
  };

  const field_paths = field_nodes.map(get_path);

  // Recursively construct column definitions
  const next = (
    node: CatalogHierarchyNode
  ): GroupColumnDef<Datum> | AccessorColumnDef<Datum> | null => {
    // Get the path for this node
    const path = get_path(node);

    const include = field_paths.some((d) => d.startsWith(path));

    // Only include this node if its path is a partial match of one of the field_paths above
    if (!include) return null;

    const child_columns: ColumnDef<Datum>[] = [];

    for (const child of node.children ?? []) {
      const child_column = next(child);
      if (child_column) {
        child_columns.push(child_column);
      }
    }

    const column_base: ColumnDef<Datum> = {
      id: node.data.name,
      header: () => <Katex>{node.data.title ?? node.data.name}</Katex>,
    };

    if (child_columns.length === 0) {
      const column: AccessorColumnDef<Datum> = {
        ...column_base,
        accessorKey: node.data.name,
        cell: (row) => row.getValue(),
      };
      return column;
    } else {
      const column: GroupColumnDef<Datum> = {
        ...column_base,
        columns: child_columns,
      };
      return column;
    }
  };

  const root = next(catalog_field_hierarchy);

  if (root === null) {
    throw new Error(`root is null`);
  }

  if (!("columns" in root)) {
    throw new Error(`root.columns is not defined`);
  }

  const columns = root?.columns ?? [];

  return columns;
}
