
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ResultsTable } from '@/features/queries/components/results-table';
import { AlertCircle } from 'lucide-react';

interface ChartRendererProps {
  type: string; // 'bar' | 'stacked-bar' | 'line' | 'pie' | 'kpi' | 'table'
  chartConfig: {
    xAxis?: string;
    xAxes?: string[];
    yAxis?: string;
    yAxes?: string[];
    color?: string;
    colors?: Record<string, string>;
    xAxisSeparator?: string;
    kpiColumn?: string;
    kpiLabel?: string;
    [key: string]: any;
  };
  data: Record<string, any>[];
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const CONCATENATED_X_AXIS_KEY = '__querylens_x_axis_label';

function getXAxisKeys(chartConfig: ChartRendererProps['chartConfig']) {
  const configuredKeys = chartConfig.xAxes?.filter(Boolean) ?? [];
  return configuredKeys.length > 0 ? configuredKeys : chartConfig.xAxis ? [chartConfig.xAxis] : [];
}

function getYAxisKeys(chartConfig: ChartRendererProps['chartConfig']) {
  const configuredKeys = chartConfig.yAxes?.filter(Boolean) ?? [];
  return configuredKeys.length > 0 ? configuredKeys : chartConfig.yAxis ? [chartConfig.yAxis] : [];
}

function buildChartData(
  data: ChartRendererProps['data'],
  xAxisKeys: string[],
  separator: string,
) {
  if (xAxisKeys.length <= 1) {
    return data;
  }

  return data.map((row) => ({
    ...row,
    [CONCATENATED_X_AXIS_KEY]: xAxisKeys
      .map((key) => row[key])
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
      .join(separator),
  }));
}

export function ChartRenderer({ type, chartConfig, data }: ChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-slate-500 text-xs">
        <AlertCircle className="h-5 w-5 mb-1.5 text-slate-700" />
        No hay datos devueltos para esta consulta.
      </div>
    );
  }

  const { color = '#3b82f6', colors = {}, kpiColumn, xAxisSeparator = ' - ' } = chartConfig;
  const xAxisKeys = getXAxisKeys(chartConfig);
  const yAxisKeys = getYAxisKeys(chartConfig);
  const xAxisDataKey = xAxisKeys.length > 1 ? CONCATENATED_X_AXIS_KEY : xAxisKeys[0];
  const chartData = buildChartData(data, xAxisKeys, xAxisSeparator);

  // Custom tooltips with dark styles
  const renderTooltip = (props: any) => {
    const { active, label, payload } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 shadow-xl text-xs">
          <p className="font-semibold text-white mb-1">{label || payload[0].payload[xAxisDataKey || '']}</p>
          <div className="space-y-0.5">
            {payload.map((item: any) => (
              <p key={item.dataKey} className="font-bold" style={{ color: item.color || '#60a5fa' }}>
                {item.name || item.dataKey}: {item.value}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  switch (type) {
    case 'kpi': {
      const col = kpiColumn || Object.keys(data[0])[0];
      const val = data[0][col];
      const label = chartConfig.kpiLabel || col;

      let displayValue = String(val);
      if (typeof val === 'number') {
        if (val % 1 === 0) {
          displayValue = val.toLocaleString();
        } else {
          displayValue = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }

      return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
            {label}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white select-all">
            {displayValue}
          </h2>
        </div>
      );
    }

    case 'bar': {
      const yAxis = yAxisKeys[0];
      if (!xAxisDataKey || !yAxis) {
        throw new Error('Ejes X o Y no seleccionados');
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: '#334155', opacity: 0.1 }} />
            <Bar dataKey={yAxis} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case 'stacked-bar': {
      if (!xAxisDataKey || yAxisKeys.length === 0) {
        throw new Error('Ejes X o Y no seleccionados');
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: '#334155', opacity: 0.1 }} />
            <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '6px' }} />
            {yAxisKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="querylens-stacked-bar"
                fill={colors[key] || PRESET_COLORS[index % PRESET_COLORS.length]}
                radius={index === yAxisKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case 'line': {
      const yAxis = yAxisKeys[0];
      if (!xAxisDataKey || !yAxis) {
        throw new Error('Ejes X o Y no seleccionados');
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip content={renderTooltip} />
            <Line
              type="monotone"
              dataKey={yAxis}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    case 'pie': {
      const nameCol = xAxisKeys[0] || Object.keys(data[0])[0];
      const valCol = yAxisKeys[0] || Object.keys(data[0])[1];

      if (!valCol) {
        throw new Error('No hay columnas suficientes para generar el gráfico circular');
      }

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="75%"
              fill="#8884d8"
              dataKey={valCol}
              nameKey={nameCol}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PRESET_COLORS[index % PRESET_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case 'table':
    default: {
      const columns = Object.keys(data[0]);
      return (
        <div className="h-full overflow-y-auto max-h-[220px]">
          <ResultsTable columns={columns} rows={data} />
        </div>
      );
    }
  }
}
