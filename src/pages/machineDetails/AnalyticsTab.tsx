import React from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MachineDetails, YearlyRepairCost } from "../../models/machineDetailsExtended";

interface AnalyticsTabProps {
  machine: MachineDetails;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ machine }) => {
  console.log("AnalyticsTab received machine data:", machine);

  // Prepare data for charts with better error handling
  const yearlyRepairCosts = Array.isArray(machine.yearlyRepairCosts) ? machine.yearlyRepairCosts : [];

  const repairCostData = yearlyRepairCosts.map((item: YearlyRepairCost) => ({
    year: item.year,
    cost: item.cost,
  }));

  // Handle case where maintenanceTasks might not be available
  const maintenanceTasks = Array.isArray(machine.maintenanceTasks) ? machine.maintenanceTasks : [];

  const maintenanceData = [
    { name: "Completed", value: maintenanceTasks.filter((task) => task.status === "completed").length },
    { name: "Scheduled", value: maintenanceTasks.filter((task) => task.status === "scheduled").length },
    { name: "In Progress", value: maintenanceTasks.filter((task) => task.status === "in-progress").length },
    { name: "Overdue", value: maintenanceTasks.filter((task) => task.status === "overdue").length },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Custom label renderer to prevent overlapping
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.4; // Increased radius to move labels further out
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percent is significant (>5%)
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#333"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-500">Total Repair Cost</h4>
              <p className="text-2xl font-bold text-gray-900">₹{(machine.totalRepairCost || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-500">Maintenance Tasks</h4>
              <p className="text-2xl font-bold text-gray-900">{maintenanceTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-500">Health Score</h4>
              <p className="text-2xl font-bold text-gray-900">{machine.healthScore}/100</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-500">Repair Count</h4>
              <p className="text-2xl font-bold text-gray-900">{machine.repairCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Costs Over Time */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h4 className="mb-4 text-lg font-semibold text-gray-800">Repair Costs Over Time</h4>
        <div className="h-80">
          {repairCostData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repairCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, "Cost"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Repair Cost"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No repair cost data available
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Status Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-gray-800">Maintenance Status Distribution</h4>
          <div className="h-80">
            {maintenanceTasks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maintenanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={true} // Enable label lines
                    label={renderCustomizedLabel} // Use custom label renderer
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {maintenanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Tasks"]} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No maintenance tasks data available
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-gray-800">Performance Metrics</h4>
          <div className="h-80">
            {machine.healthScore ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Uptime", value: Math.min(100, Math.max(0, machine.healthScore + 5)) },
                    { name: "Efficiency", value: Math.min(100, Math.max(0, machine.healthScore)) },
                    { name: "Reliability", value: Math.min(100, Math.max(0, machine.healthScore - 5)) },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                  <Legend />
                  <Bar dataKey="value" name="Percentage" fill="#DC2626" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No performance metrics data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;