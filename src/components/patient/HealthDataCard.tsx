import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import { ABNORMAL_THRESHOLDS } from '../../config';

interface HealthDataCardProps {
  title: string;
  value: number;
  unit: string;
  data: any[];
  type: 'heartRate' | 'bloodPressure' | 'bloodOxygen' | 'temperature';
  loading: boolean;
}

const HealthDataCard: React.FC<HealthDataCardProps> = ({
  title,
  value,
  unit,
  data,
  type,
  loading,
}) => {
  const getStatusColor = () => {
    if (loading || data.length === 0) return 'text-gray-400';
    
    let isAbnormal = false;
    
    switch (type) {
      case 'heartRate':
        isAbnormal = value < ABNORMAL_THRESHOLDS.heartRate.low || value > ABNORMAL_THRESHOLDS.heartRate.high;
        break;
      case 'bloodPressure':
        isAbnormal = value < ABNORMAL_THRESHOLDS.bloodPressureSystolic.low || value > ABNORMAL_THRESHOLDS.bloodPressureSystolic.high;
        break;
      case 'bloodOxygen':
        isAbnormal = value < ABNORMAL_THRESHOLDS.bloodOxygen.low;
        break;
      case 'temperature':
        isAbnormal = value < ABNORMAL_THRESHOLDS.temperature.low || value > ABNORMAL_THRESHOLDS.temperature.high;
        break;
      default:
        break;
    }
    
    return isAbnormal ? 'text-error' : 'text-success';
  };

  const getChartColor = () => {
    switch (type) {
      case 'heartRate':
        return '#0F52BA'; // primary
      case 'bloodPressure':
        return '#20B2AA'; // secondary
      case 'bloodOxygen':
        return '#FF6347'; // accent
      case 'temperature':
        return '#4CAF50'; // success
      default:
        return '#0F52BA'; // primary
    }
  };

  const formatDataForChart = () => {
    return data.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString(),
      value: item.value,
    }));
  };

  // Used for dynamic formatting on tooltip
  const formatTooltipValue = (value: number) => {
    return `${value} ${unit}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <Activity size={16} className={getStatusColor()} />
      </div>
      
      <div className="mb-4">
        {loading ? (
          <div className="animate-pulse flex space-x-1">
            <div className="h-8 w-10 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="flex items-baseline">
            <span className="text-2xl font-bold">{value}</span>
            <span className="ml-1 text-sm text-gray-500">{unit}</span>
          </div>
        )}
      </div>
      
      {/* Chart */}
      <div className="h-20">
        {loading ? (
          <div className="animate-pulse h-full bg-gray-200 rounded"></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatDataForChart()}>
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '4px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={getChartColor()} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: getChartColor() }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default HealthDataCard;