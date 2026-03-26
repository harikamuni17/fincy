'use client'

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend,
  type ChartOptions,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Line } from 'react-chartjs-2'
import type { ForecastRecord } from '@/types'
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, annotationPlugin)

interface ForecastChartProps {
  historicalData: { month: string; amount: number }[]
  forecastRecords: ForecastRecord[]
  budgetLimit?: number
}

export default function ForecastChart({
  historicalData,
  forecastRecords,
  budgetLimit,
}: ForecastChartProps) {
  const forecastMonths = forecastRecords.map((f) =>
    format(new Date((f as unknown as { forecastMonth: string }).forecastMonth), 'MMM yyyy'),
  )
  const allLabels = [...historicalData.map((d) => d.month), ...forecastMonths]
  const splitIdx = historicalData.length

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
            ctx.raw !== null && ctx.raw !== undefined
              ? ` ${ctx.dataset.label}: ₹${(ctx.raw as number).toLocaleString('en-IN')}`
              : '',
        },
      },
      annotation: {
        annotations: {
          todayLine: {
            type: 'line',
            xMin: splitIdx - 1,
            xMax: splitIdx - 1,
            borderColor: 'rgba(240,242,245,0.25)',
            borderWidth: 1,
            borderDash: [4, 4],
            label: {
              content: 'Today',
              display: true,
              position: 'start',
              color: '#8B92A5',
              font: { family: "'DM Mono', monospace", size: 9 },
            },
          },
          ...(budgetLimit
            ? {
                budgetLine: {
                  type: 'line' as const,
                  yMin: budgetLimit,
                  yMax: budgetLimit,
                  borderColor: 'rgba(255,181,71,0.6)',
                  borderWidth: 1,
                  borderDash: [6, 3],
                  label: {
                    content: `Budget: ₹${budgetLimit.toLocaleString('en-IN')}`,
                    display: true,
                    position: 'end',
                    color: '#FFB547',
                    font: { family: "'DM Mono', monospace", size: 9 },
                  },
                },
              }
            : {}),
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

  const actualData: (number | null)[] = [
    ...historicalData.map((d) => d.amount),
    ...Array(forecastMonths.length).fill(null),
  ]

  const predictedData: (number | null)[] = [
    ...Array(splitIdx - 1).fill(null),
    historicalData[splitIdx - 1]?.amount ?? null,
    ...forecastRecords.map((f) => Math.round((f as unknown as { predictedSpend: number }).predictedSpend)),
  ]

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Actual Spend',
        data: actualData,
        borderColor: '#00D4AA',
        backgroundColor: 'rgba(0,212,170,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointStyle: 'circle',
        borderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Predicted Spend',
        data: predictedData,
        borderColor: '#FF4D6A',
        backgroundColor: 'rgba(255,77,106,0.06)',
        fill: false,
        tension: 0.4,
        pointRadius: 5,
        pointStyle: 'circle' as const,
        pointBorderColor: '#FF4D6A',
        pointBackgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
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
