'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { MonthlyDataPoint } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface SpendTrendChartProps {
  actualData: MonthlyDataPoint[]
  projectedData?: MonthlyDataPoint[]
}

export default function SpendTrendChart({ actualData, projectedData = [] }: SpendTrendChartProps) {
  const allMonths = [
    ...actualData.map((d) => d.month),
    ...projectedData.map((d) => d.month),
  ]

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        position: 'top' as const,
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
        bodyColor: '#8B92A5',
        titleFont: { family: "'DM Sans', sans-serif", size: 12 },
        bodyFont: { family: "'DM Mono', monospace", size: 12 },
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${(ctx.raw as number).toLocaleString('en-IN')}`,
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

  const data = {
    labels: allMonths,
    datasets: [
      {
        label: 'Actual Spend',
        data: actualData.map((d) => d.amount),
        borderColor: '#00D4AA',
        backgroundColor: 'rgba(0,212,170,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#00D4AA',
        borderWidth: 2,
      },
      ...(projectedData.length > 0
        ? [
            {
              label: 'Projected if no action',
              data: [
                ...Array(actualData.length - 1).fill(null),
                actualData[actualData.length - 1]?.amount ?? 0,
                ...projectedData.map((d) => d.amount),
              ],
              borderColor: '#FF4D6A',
              backgroundColor: 'rgba(255,77,106,0.05)',
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              borderDash: [5, 5],
              borderWidth: 2,
              pointBackgroundColor: '#FF4D6A',
            },
          ]
        : []),
    ],
  }

  return (
    <div style={{ height: '240px' }}>
      <Line options={options} data={data} />
    </div>
  )
}
