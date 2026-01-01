"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface ActivityLineChartProps {
    activityLogs: any[];
}

export function ActivityLineChart({ activityLogs }: ActivityLineChartProps) {
    // logs are [Today...30 days ago] or vice versa? 
    // Backend generator: logs.reverse() -> [30 days ago ... Today].
    // So index 29 is today.
    // We want to show chronological on chart (Left=Old, Right=New).

    const labels = activityLogs.map((log) => new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

    const data = {
        labels,
        datasets: [
            {
                label: 'Login Count',
                data: activityLogs.map((log) => log.loginCount),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                yAxisID: 'y',
            },
            {
                label: 'Watch Time (min)',
                data: activityLogs.map((log) => log.videoWatchMinutes),
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.5)',
                yAxisID: 'y1',
            },
        ],
    };

    const options = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        stacked: false,
        plugins: {
            title: {
                display: true,
                text: '30-Day Activity History',
                color: 'white'
            },
            legend: {
                labels: { color: 'white' }
            }
        },
        scales: {
            x: {
                ticks: { color: 'white' }
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                ticks: { color: 'white' }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                },
                ticks: { color: 'white' }
            },
        },
    };

    return <Line options={options} data={data} />;
}
