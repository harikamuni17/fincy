'use client'

import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  type ChartOptions,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryDonutChartProps {
  data: { category: string; amount: number }[]
}

const COLORS = ['#00D4AA', '#6C8EFF', '#FFB547', '#FF4D6A', '#A78BFA', '#34D399', '#F87171']

export default function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No category data</p>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.amount - a.amount).slice(0, 7)
  const total = sorted.reduce((s, d) => s + d.amount, 0)

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#8B92A5',
          font: { family: "'DM Sans', sans-serif", size: 11 },
          boxWidth: 10,
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1A1D24',
        borderColor: '#2A3045',
        borderWidth: 1,
        titleColor: '#F0F2F5',
        bodyColor: '#8B92A5',
        bodyFont: { family: "'DM Mono', monospace", size: 11 },
        callbacks: {
          label: (ctx) =>
            ` ₹${(ctx.raw as number).toLocaleString('en-IN')} (${((ctx.raw as number / total) * 100).toFixed(1)}%)`,
        },
      },
    },
  }

  const chartData = {
    labels: sorted.map((d) => d.category),
    datasets: [{
      data: sorted.map((d) => d.amount),
      backgroundColor: COLORS.slice(0, sorted.length),
      borderColor: '#111318',
      borderWidth: 2,
      hoverOffset: 4,
    }],
  }

  return (
    <div style={{ height: '200px' }}>
      <Doughnut options={options} data={chartData} />
    </div>
  )
}
