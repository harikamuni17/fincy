'use client'

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Tooltip, Legend,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface ROISavingsChartProps {
  data: { label: string; predicted: number; actual: number }[]
}

export default function ROISavingsChart({ data }: ROISavingsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No ROI data yet</p>
      </div>
    )
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
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
          label: (ctx) => ` ${ctx.dataset.label}: ₹${(ctx.raw as number).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#4A5065', font: { family: "'DM Sans', sans-serif", size: 10 } },
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
    labels: data.map((d) => d.label.substring(0, 20)),
    datasets: [
      {
        label: 'Predicted Saving',
        data: data.map((d) => d.predicted),
        backgroundColor: 'rgba(108,142,255,0.7)',
        borderRadius: 4,
      },
      {
        label: 'Actual Saving',
        data: data.map((d) => d.actual),
        backgroundColor: 'rgba(0,212,170,0.7)',
        borderRadius: 4,
      },
    ],
  }

  return (
    <div style={{ height: '200px' }}>
      <Bar options={options} data={chartData} />
    </div>
  )
}
