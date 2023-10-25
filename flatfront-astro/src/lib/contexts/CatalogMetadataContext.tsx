import type {
  CatalogMetadataWrapper,
  CatalogResponse,
  FieldMetadata,
  CatalogHierarchyNode
} from "../types";

import React from "react";
import * as d3 from "d3";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetch_api_get, log, is_root_node, get_field_type } from "../shared";
import { useCatalogID } from "./CatalogContext";

const CatalogMetadataContext = React.createContext<
  CatalogMetadataWrapper | undefined
>(undefined);

export function CatalogMetadataProvider({ children }) {
  const catalog_id = useCatalogID();
  const catalog_query = useQuery({
    queryKey: [`catalog`, catalog_id],
    queryFn: (): Promise<CatalogResponse> => fetch_api_get(`/${catalog_id}`),
    enabled: !!catalog_id
  });
  const wrapped = React.useMemo(
    () =>
      catalog_query.data
        ? wrap_catalog_response(catalog_query.data)
        : undefined,
    [catalog_query.data]
  );

  return (
    <CatalogMetadataContext.Provider value={wrapped}>
      {children}
    </CatalogMetadataContext.Provider>
  );
}

function wrap_catalog_response(catalog_response: CatalogResponse) {
  log(`Creating metadata for ${catalog_response.name}...`);
  const root = {
    sub: catalog_response.fields
  } as FieldMetadata;
  const hierarchy: CatalogHierarchyNode = d3.hierarchy<FieldMetadata>(
    root,
    (d) => d?.sub ?? []
  );
  const hash_map = new Map<CatalogHierarchyNode, string>();
  const depth_first: Array<CatalogHierarchyNode> = [];
  hierarchy.eachBefore((node) => {
    hash_map.set(node, tiny_json_hash(node.data));
    if (!is_root_node(node)) depth_first.push(node);
  });
  const wrapper: CatalogMetadataWrapper = {
    response: catalog_response,
    hierarchy,
    depth_first,
    hash_map
  };
  return wrapper;
}

function tiny_json_hash(object: any) {
  const text = JSON.stringify(object);
  let hash = 5381;
  let index = text.length;
  while (index) {
    hash = (hash * 33) ^ text.charCodeAt(--index);
  }
  return (hash >>> 0).toString(16);
}

export function useCatalogMetadata(): CatalogMetadataWrapper | undefined {
  const catalog_metadata = React.useContext(CatalogMetadataContext);
  return catalog_metadata;
}
