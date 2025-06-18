import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

import { cn } from "@/lib/utils"

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
]

interface ChartProps {
  className?: string
  height?: number
  data: any[]
  xField: string
  yField: string
  formatter?: (value: any) => string
}

export function LineChart({
  className,
  height = 300,
  data,
  xField,
  yField,
  formatter,
}: ChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xField} />
          <YAxis tickFormatter={formatter} />
          <Tooltip formatter={formatter} />
          <Line
            type="monotone"
            dataKey={yField}
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChart({
  className,
  height = 300,
  data,
  xField,
  yField,
  formatter,
}: ChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xField} />
          <YAxis tickFormatter={formatter} />
          <Tooltip formatter={formatter} />
          <Bar dataKey={yField} fill="#8884d8" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PieChartProps extends Omit<ChartProps, "xField" | "yField"> {
  angleField: string
  colorField: string
}

export function PieChart({
  className,
  height = 300,
  data,
  angleField,
  colorField,
  formatter,
}: PieChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey={angleField}
            nameKey={colorField}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={formatter} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
} 