'use client'

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend,
  type ChartOptions,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Line } from 'react-chartjs-2'
import type { MonthlyDataPoint } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, annotationPlugin)

interface SimulationChartProps {
  baselineData: MonthlyDataPoint[]
  projectedData: MonthlyDataPoint[]
  todayIndex?: number
}

export default function SimulationChart({
  baselineData,
  projectedData,
  todayIndex,
}: SimulationChartProps) {
  const allMonths = [
    ...baselineData.map((d) => d.month),
    ...projectedData.map((d) => d.month),
  ]

  const splitIdx = Math.max(0, baselineData.length - 1)

  // Trajectory: all baseline + continuation
  const trajectoryData = [...baselineData.map((d) => d.amount), ...projectedData.map((d) => d.amount)]
  // After action: nulls for history then the projected values
  const afterActionData: (number | null)[] = [
    ...Array(splitIdx).fill(null),
    baselineData[splitIdx]?.amount ?? 0,
    ...projectedData.map((d) => d.amount),
  ]

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#8B92A5',
          font: { family: "'DM Mono', monospace", size: 11 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1A1D24',
        borderColor: '#2A3045',
        borderWidth: 1,
        titleColor: '#F0F2F5',
        bodyFont: { family: "'DM Mono', monospace", size: 11 },
        callbacks: {
          label: (ctx) =>
            ctx.raw !== null
              ? ` ${ctx.dataset.label}: ₹${(ctx.raw as number).toLocaleString('en-IN')}`
              : '',
        },
      },
      annotation: {
        annotations: {
          todayLine: {
            type: 'line',
            xMin: todayIndex ?? splitIdx,
            xMax: todayIndex ?? splitIdx,
            borderColor: 'rgba(240,242,245,0.3)',
            borderWidth: 1,
            borderDash: [4, 4],
            label: {
              content: 'Today',
              display: true,
              position: 'start',
              color: '#8B92A5',
              font: { family: "'DM Mono', monospace", size: 10 },
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#1E2535' },
        ticks: { color: '#4A5065', font: { family: "'DM Mono', monospace", size: 10 } },
      },
      y: {
        grid: { color: '#1E2535' },
        ticks: {
          color: '#4A5065',
          font: { family: "'DM Mono', monospace", size: 10 },
          callback: (val) => '₹' + Number(val).toLocaleString('en-IN'),
        },
      },
    },
  }

  const chartData = {
    labels: allMonths,
    datasets: [
      {
        label: 'Current trajectory',
        data: trajectoryData,
        borderColor: '#FF4D6A',
        backgroundColor: 'rgba(255,77,106,0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
        segment: {
          borderDash: (ctx: { p0DataIndex: number }) =>
            ctx.p0DataIndex >= splitIdx ? [5, 5] : undefined,
        },
      },
      {
        label: 'After action',
        data: afterActionData,
        borderColor: '#00D4AA',
        backgroundColor: 'rgba(0,212,170,0.1)',
        fill: {
          target: 0,
          below: 'rgba(0,212,170,0.08)',
        },
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  }

  return (
    <div style={{ height: '280px' }}>
      <Line options={options} data={chartData} />
    </div>
  )
}
