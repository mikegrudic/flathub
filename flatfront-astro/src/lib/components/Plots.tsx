import type {
  DataPostRequestBody,
  DataResponse,
  HistogramPostRequestBody,
  HistogramResponse,
  PlotWrapper
} from "../types";
import React from "react";
import {
  useQuery,
  useQueryClient,
  type UseQueryOptions
} from "@tanstack/react-query";
import { log, fetch_api_post } from "../shared";
import { useIsDarkMode } from "../dark-mode";
import { useCatalogID } from "../contexts/CatalogContext";
import { useRandomConfig } from "../contexts/RandomContext";
import { useFilters } from "../contexts/FiltersContext";
import { useCatalogMetadata } from "../contexts/CatalogMetadataContext";
import { usePlotState } from "../contexts/PlotContext";
import { StatusBox } from "./Primitives";
import {
  LabelledPlotControl,
  Labelled,
  LogModeCheckbox
} from "./PlotPrimitives";
import HighchartsPlot from "./HighchartsPlot";

export const Histogram: PlotWrapper = {
  key: `histogram`,
  label: `Histogram`,
  Plot() {
    const catalog_id = useCatalogID();
    const filters = useFilters();
    const random_config = useRandomConfig();

    const field_config = useAxisConfig(`field`);
    const count_config = useAxisConfig(`count`);

    const enable_request =
      Boolean(catalog_id) && field_config.ready_for_request;

    const query = usePlotQuery<HistogramPostRequestBody, HistogramResponse>({
      path: `/${catalog_id}/histogram`,
      body: {
        fields: [
          {
            field: field_config.field_id,
            size: 100,
            log: field_config.log_mode
          }
        ] as any,
        ...filters,
        ...random_config
      },
      label: `Histogram`,
      enabled: enable_request
    });

    const data_munged = (() => {
      if (!query.data) return [];
      return query.data.buckets.map(({ key: [value], count }) => {
        return [value, count];
      });
    })();

    const options: Highcharts.Options = {
      ...get_highcharts_options(),
      xAxis: {
        type: field_config.log_mode ? `logarithmic` : `linear`,
        title: {
          text: field_config.field_id
        }
      },
      yAxis: {
        type: count_config.log_mode ? `logarithmic` : `linear`,
        title: {
          text: `Count`
        }
      },
      series: [
        {
          type: `column`,
          name: `Count`,
          data: data_munged,
          animation: false,
          borderRadius: 0
        }
      ]
    };

    const status = (() => {
      if (field_config.log_mode_error_message) {
        return field_config.log_mode_error_message;
      } else if (query.isFetching) {
        return <LoadingBox />;
      } else if (!(data_munged.length > 0)) {
        return `No data.`;
      } else {
        return null;
      }
    })();

    return <StatusWrapper status={status} options={options} />;
  },
  Controls() {
    return (
      <>
        <LabelledPlotControl
          label="Field"
          plotControlKey="field"
          placeholder="Choose field..."
          showLogSwitch={true}
        />
        <LogCountControl />
      </>
    );
  }
};

export const Heatmap: PlotWrapper = {
  key: `heatmap`,
  label: `Heatmap`,
  Plot() {
    const catalog_id = useCatalogID();
    const filters = useFilters();
    const random_config = useRandomConfig();

    const x_axis = useAxisConfig(`x_axis`);
    const y_axis = useAxisConfig(`y_axis`);

    const enable_request =
      Boolean(catalog_id) &&
      x_axis.ready_for_request &&
      y_axis.ready_for_request;

    const query = usePlotQuery<HistogramPostRequestBody, HistogramResponse>({
      path: `/${catalog_id}/histogram`,
      body: {
        fields: [
          { field: x_axis.field_id, size: 20, log: x_axis.log_mode },
          { field: y_axis.field_id, size: 20, log: y_axis.log_mode }
        ] as any,
        ...filters,
        ...random_config
      },
      label: `Heatmap`,
      enabled: enable_request
    });

    const data_munged = (() => {
      if (!query.data) return [];
      return query.data.buckets.map(({ key: [x, y], count }) => {
        return [x, y, count];
      });
    })();

    const is_dark_mode = useIsDarkMode();

    const options: Highcharts.Options = {
      ...get_highcharts_options(),
      xAxis: {
        type: x_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: x_axis.field_id
        },
        gridLineWidth: 1
      },
      yAxis: {
        type: y_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: y_axis.field_id
        }
      },
      colorAxis: {
        minColor: is_dark_mode ? `black` : `white`,
        maxColor: is_dark_mode ? `white` : `black`
      },
      series: [
        {
          type: `heatmap`,
          data: data_munged,
          colsize: query?.data?.sizes[0],
          rowsize: query?.data?.sizes[1],
          boostThreshold: 1
        }
      ]
    };

    const status = (() => {
      if (x_axis.log_mode_error_message) {
        return x_axis.log_mode_error_message;
      } else if (y_axis.log_mode_error_message) {
        return y_axis.log_mode_error_message;
      } else if (query.isFetching) {
        return <LoadingBox />;
      } else if (!(data_munged.length > 0)) {
        return `No data.`;
      } else {
        return null;
      }
    })();

    return <StatusWrapper status={status} options={options} />;
  },
  Controls() {
    return (
      <>
        <XAxisControl />
        <YAxisControl />
      </>
    );
  }
};

export const BoxPlot: PlotWrapper = {
  key: `boxplot`,
  label: `Box Plot`,
  Plot() {
    const catalog_id = useCatalogID();
    const filters = useFilters();
    const random_config = useRandomConfig();

    const x_axis = useAxisConfig(`x_axis`);
    const y_axis = useAxisConfig(`y_axis`);

    const enable_request =
      Boolean(catalog_id) &&
      x_axis.ready_for_request &&
      y_axis.ready_for_request;

    const query = usePlotQuery<HistogramPostRequestBody, HistogramResponse>({
      path: `/${catalog_id}/histogram`,
      body: {
        fields: [
          { field: x_axis.field_id, size: 60, log: x_axis.log_mode }
        ] as any,
        quartiles: y_axis.field_id?.toString(),
        ...filters,
        ...random_config
      },
      label: `Boxplot`,
      enabled: enable_request
    });

    const data_munged = (() => {
      if (!query.data) return [];
      return query.data.buckets.map(({ key: [x, y], count, quartiles }) => {
        // x, low, q1, median, q3, high
        return [x, ...quartiles];
      });
    })();

    const options: Highcharts.Options = {
      ...get_highcharts_options(),
      xAxis: {
        type: x_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: x_axis.field_id
        }
      },
      yAxis: {
        type: y_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: y_axis.field_id
        }
      },
      series: [
        {
          type: `boxplot`,
          data: data_munged,
          keys: [`x`, `low`, `q1`, `median`, `q3`, `high`]
        },
        {
          type: `line`,
          data: data_munged.map((d) => [d[0], d[3]])
        }
      ]
    };

    const status = (() => {
      if (x_axis.log_mode_error_message) {
        return x_axis.log_mode_error_message;
      } else if (y_axis.log_mode_error_message) {
        return y_axis.log_mode_error_message;
      } else if (query.isFetching) {
        return <LoadingBox />;
      } else if (!(data_munged.length > 0)) {
        return `No data.`;
      } else {
        return null;
      }
    })();

    return <StatusWrapper status={status} options={options} />;
  },
  Controls() {
    return (
      <>
        <XAxisControl />
        <YAxisControl />
      </>
    );
  }
};

export const Scatterplot: PlotWrapper = {
  key: `scatterplot`,
  label: `Scatterplot`,
  Plot() {
    const catalog_id = useCatalogID();
    const filters = useFilters();
    const plot_state = usePlotState();

    const x_axis = useAxisConfig(`x_axis`);
    const y_axis = useAxisConfig(`y_axis`);

    const count = plot_state?.count ?? 2e3;

    // TODO: What's the best way of doing this
    // const total_rows = useCatalogMetadata()?.response?.count;
    // const sample = Math.min((count * 10) / total_rows, 1);
    const sample = 0.9999;

    const enable_request =
      Boolean(catalog_id) &&
      x_axis.ready_for_request &&
      y_axis.ready_for_request;

    const query = usePlotQuery<DataPostRequestBody, DataResponse>({
      path: `/${catalog_id}/data`,
      body: {
        object: true,
        fields: [x_axis.field_id, y_axis.field_id],
        ...filters,
        count,
        sample
      },
      label: `Scatterplot`,
      enabled: enable_request
    });

    const data_munged = (() => {
      if (!x_axis.field_id) return [];
      if (!y_axis.field_id) return [];
      if (!query.data) return [];
      return query.data.map((datum) => {
        return [+datum[x_axis.field_id], +datum[y_axis.field_id]];
      });
    })();

    const options: Highcharts.Options = {
      ...get_highcharts_options(),
      xAxis: {
        type: x_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: x_axis.field_id
        },
        gridLineWidth: 1
      },
      yAxis: {
        type: y_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: y_axis.field_id
        }
      },
      series: [
        {
          type: `scatter`,
          marker: {
            radius: 1
          },
          data: data_munged,
          boostThreshold: 1
        }
      ]
    };

    const status = (() => {
      if (x_axis.log_mode_error_message) {
        return x_axis.log_mode_error_message;
      } else if (y_axis.log_mode_error_message) {
        return y_axis.log_mode_error_message;
      } else if (query.isFetching) {
        return <LoadingBox />;
      } else if (!(data_munged.length > 0)) {
        return `No data.`;
      } else {
        return null;
      }
    })();

    return <StatusWrapper status={status} options={options} />;
  },
  Controls() {
    return (
      <>
        <XAxisControl />
        <YAxisControl />
      </>
    );
  }
};

export const Scatterplot3D: PlotWrapper = {
  key: `scatterplot_3d`,
  label: `3D Scatterplot`,
  Plot() {
    const catalog_id = useCatalogID();
    const filters = useFilters();
    const random_config = useRandomConfig();
    const plot_state = usePlotState();

    const x_axis = useAxisConfig(`x_axis`);
    const y_axis = useAxisConfig(`y_axis`);
    const z_axis = useAxisConfig(`z_axis`);

    const count = plot_state?.count ?? 2e3;

    // TODO: What's the best way of doing this
    // const total_rows = useCatalogMetadata()?.response?.count;
    // const sample = Math.min((count * 10) / total_rows, 1);
    const sample = 0.9999;

    const enable_request =
      Boolean(catalog_id) &&
      x_axis.ready_for_request &&
      y_axis.ready_for_request &&
      z_axis.ready_for_request;

    const query = usePlotQuery<DataPostRequestBody, DataResponse>({
      path: `/${catalog_id}/data`,
      body: {
        object: true,
        fields: [x_axis.field_id, y_axis.field_id, z_axis.field_id],
        ...filters,
        count,
        sample
      },
      label: `3D Scatterplot`,
      enabled: enable_request
    });

    const data_munged = (() => {
      if (!x_axis.field_id) return [];
      if (!y_axis.field_id) return [];
      if (!z_axis.field_id) return [];
      if (!query.data) return [];
      return query.data.map((datum) => {
        return [
          +datum[x_axis.field_id],
          +datum[y_axis.field_id],
          +datum[z_axis.field_id]
        ];
      });
    })();

    const options: Highcharts.Options = {
      ...get_highcharts_options(),
      xAxis: {
        type: x_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: x_axis.field_id
        },
        gridLineWidth: 1
      },
      yAxis: {
        type: y_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: y_axis.field_id
        }
      },
      zAxis: {
        type: z_axis.log_mode ? `logarithmic` : `linear`,
        title: {
          text: z_axis.field_id
        }
      },
      series: [
        {
          type: `scatter3d`,
          marker: {
            radius: 1
          },
          data: data_munged,
          turboThreshold: 0
        }
      ]
    };

    options.chart.options3d = {
      enabled: true,
      alpha: 10,
      beta: 20,
      depth: 400,
      drag: {
        enabled: true
      }
    };

    const status = (() => {
      if (x_axis.log_mode_error_message) {
        return x_axis.log_mode_error_message;
      } else if (y_axis.log_mode_error_message) {
        return y_axis.log_mode_error_message;
      } else if (z_axis.log_mode_error_message) {
        return z_axis.log_mode_error_message;
      } else if (query.isFetching) {
        return <LoadingBox />;
      } else if (!(data_munged.length > 0)) {
        return `No data.`;
      } else {
        return null;
      }
    })();

    return <StatusWrapper status={status} options={options} />;
  },
  Controls() {
    return (
      <>
        <XAxisControl />
        <YAxisControl />
        <LabelledPlotControl
          label="Z-Axis"
          plotControlKey="z_axis"
          placeholder="Choose Z-Axis..."
          showLogSwitch={true}
        />
      </>
    );
  }
};

function XAxisControl() {
  return (
    <LabelledPlotControl
      label="X-Axis"
      plotControlKey="x_axis"
      placeholder="Choose X-Axis..."
      showLogSwitch={true}
    />
  );
}

function YAxisControl() {
  return (
    <LabelledPlotControl
      label="Y-Axis"
      plotControlKey="y_axis"
      placeholder="Choose Y-Axis..."
      showLogSwitch={true}
    />
  );
}

function LogCountControl() {
  return (
    <Labelled label="Count: Log Scale">
      <LogModeCheckbox plotControlkey="count" />
    </Labelled>
  );
}

function LoadingBox({
  queryKey: query_key = [`plot-data`]
}: {
  queryKey?: UseQueryOptions[`queryKey`];
}) {
  const query_client = useQueryClient();
  return (
    <div className="space-y-2">
      <div>Loading...</div>
      <button
        onClick={() => {
          query_client.cancelQueries({ queryKey: query_key });
        }}
        className="cursor-pointer underline"
      >
        Cancel
      </button>
    </div>
  );
}

function StatusWrapper({
  status,
  options
}: {
  status: React.ReactNode;
  options: Highcharts.Options;
}) {
  return (
    <div className="relative">
      {status && <StatusBox>{status}</StatusBox>}
      <HighchartsPlot options={options} />
    </div>
  );
}

function get_highcharts_options(): Highcharts.Options {
  return {
    chart: {
      animation: false,
      styledMode: true
    },
    legend: {
      enabled: false
    },
    title: {
      text: undefined
    },
    credits: {
      enabled: false
    },
    tooltip: {
      animation: false
    },
    exporting: {
      enabled: true
    },
    boost: {
      enabled: true,
      useGPUTranslations: true,
      usePreallocated: true
    }
  };
}

function useAxisConfig(
  key: `x_axis` | `y_axis` | `z_axis` | `count` | `field`
) {
  const plot_state = usePlotState();
  const is_log_allowed = useGetIsLogAllowed();
  const field_id = plot_state?.[key];
  const log_mode_requested = plot_state?.[`${key}_log_mode`] ?? false;
  const log_mode_allowed = is_log_allowed(field_id);
  const log_mode_error = log_mode_requested && !log_mode_allowed;
  const log_mode = log_mode_requested && log_mode_allowed;
  const ready_for_request = Boolean(field_id) && !log_mode_error;
  const log_mode_error_message = log_mode_error
    ? `Log mode not allowed because "${field_id}" values cross zero.`
    : null;
  return {
    field_id,
    log_mode,
    log_mode_error_message,
    ready_for_request
  };
}

function useGetIsLogAllowed(): (field_id: string) => boolean {
  const get_current_min = useGetCurrentMin();
  const get_current_max = useGetCurrentMax();
  return (field_id: string): boolean => {
    if (!field_id) return true;
    if (field_id === `count`) return true;
    const current_min = get_current_min(field_id);
    const current_max = get_current_max(field_id);
    if (current_min > 0 && current_max > 0) return true;
    return false;
  };
}

function useGetCurrentMin(): (field_id: string) => number | null {
  const filters = useFilters();
  const catalog_metadata = useCatalogMetadata();
  return (field_id: string): number | null => {
    const filter_value = filters[field_id];
    const field_stats = catalog_metadata?.hierarchy?.find(
      (d) => d.data.name === field_id
    )?.data?.stats;
    if (!field_id) return null;
    if (!catalog_metadata) return null;
    if (typeof filter_value === `object` && `gte` in filter_value) {
      return Number(filter_value.gte);
    } else if (field_stats && "min" in field_stats) {
      return Number(field_stats.min);
    }
    throw new Error(`Could not get min for ${field_id}`);
  };
}

function useGetCurrentMax(): (field_id: string) => number | null {
  const filters = useFilters();
  const catalog_metadata = useCatalogMetadata();
  return (field_id: string): number | null => {
    const filter_value = filters[field_id];
    const field_stats = catalog_metadata?.hierarchy?.find(
      (d) => d.data.name === field_id
    )?.data?.stats;
    if (!field_id) return null;
    if (!catalog_metadata) return null;
    if (typeof filter_value === `object` && `lte` in filter_value) {
      return Number(filter_value.lte);
    } else if (field_stats && "max" in field_stats) {
      return Number(field_stats.max);
    }
    throw new Error(`Could not get max for ${field_id}`);
  };
}

function usePlotQuery<RequestType, ResponseType>({
  path,
  body,
  label,
  enabled
}: {
  path: string;
  body: RequestType;
  label: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: [`plot-data`, path, body],
    queryFn: async ({ signal }): Promise<ResponseType> => {
      const response = await fetch_api_post<RequestType, ResponseType>(
        path,
        body,
        {
          signal
        }
      );
      log(`${label} query response`, response);
      return response;
    },
    enabled
  });
}
