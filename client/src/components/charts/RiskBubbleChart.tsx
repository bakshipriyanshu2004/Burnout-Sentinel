"use client";

import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface RiskBubbleChartProps {
    students: any[];
}

export function RiskBubbleChart({ students }: RiskBubbleChartProps) {
    const data = {
        datasets: [
            {
                label: 'High Risk',
                data: students.filter(s => s.riskLevel === 'HIGH').map((s) => ({
                    x: s.engagementScore,
                    y: s.riskScore,
                    r: Math.max(8, s.riskScore / 4),
                    student: s
                })),
                backgroundColor: 'rgba(239, 68, 68, 0.6)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)',
                hoverBorderColor: '#fff',
                hoverBorderWidth: 2,
            },
            {
                label: 'Medium Risk',
                data: students.filter(s => s.riskLevel === 'MEDIUM').map((s) => ({
                    x: s.engagementScore,
                    y: s.riskScore,
                    r: Math.max(6, s.riskScore / 5),
                    student: s
                })),
                backgroundColor: 'rgba(234, 179, 8, 0.6)',
                borderColor: 'rgba(234, 179, 8, 1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(234, 179, 8, 0.9)',
                hoverBorderColor: '#fff',
                hoverBorderWidth: 2,
            },
            {
                label: 'Low Risk',
                data: students.filter(s => s.riskLevel === 'LOW').map((s) => ({
                    x: s.engagementScore,
                    y: s.riskScore,
                    r: Math.max(4, s.riskScore / 6),
                    student: s
                })),
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
                hoverBorderColor: '#fff',
                hoverBorderWidth: 2,
            },
        ],
    };

    const options = {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Engagement Score (0-100)',
                    color: '#94a3b8',
                    font: { size: 12, weight: '500' }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'transparent'
                },
                ticks: { color: '#64748b' },
                min: 0,
                max: 100
            },
            y: {
                title: {
                    display: true,
                    text: 'Risk Score (Higher is Critical)',
                    color: '#94a3b8',
                    font: { size: 12, weight: '500' }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'transparent'
                },
                ticks: { color: '#64748b' },
                min: 0,
                max: 100
            },
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 14, weight: 'bold' },
                callbacks: {
                    label: (context: any) => {
                        const student = context.raw.student;
                        return [
                            ` ${student.name}`,
                            ` Risk Level: ${student.riskLevel}`,
                            ` Risk Score: ${student.riskScore}`,
                            ` Engagement: ${student.engagementScore}`
                        ];
                    }
                }
            }
        },
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    return <Bubble data={data} options={options as any} />;
}
