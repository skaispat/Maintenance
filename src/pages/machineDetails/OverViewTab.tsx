import React from "react";
import { Thermometer } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MachineDetails } from "../../models/machineDetailsExtended";

interface OverviewTabProps {
  machine: MachineDetails;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ machine }) => {
  console.log("OverviewTab received machine data:", machine);

  const getHealthColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-primary";
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Machine Information Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="mb-4 text-lg font-medium">Machine Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Serial Number:</span>
              <span className="font-medium">{machine.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Model:</span>
              <span className="font-medium">{machine.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Manufacturer:</span>
              <span className="font-medium">{machine.manufacturer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Department:</span>
              <span className="font-medium">{machine.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium">{machine.location}</span>
            </div>
          </div>
        </div>

        {/* Purchase Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="mb-4 text-lg font-medium">Purchase Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Purchase Date:</span>
              <span className="font-medium">
                {formatDate(machine.purchaseDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Purchase Price:</span>
              <span className="font-medium">₹{(machine.purchasePrice || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vendor:</span>
              <span className="font-medium">{machine.vendor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Warranty Until:</span>
              <span className="font-medium">
                {formatDate(machine.warrantyExpiration)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Asset Age:</span>
              <span className="font-medium">
                {machine.purchaseDate ? Math.floor(
                  (new Date().getTime() - new Date(machine.purchaseDate).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000)
                ) : 'N/A'}{" "}
                years
              </span>
            </div>
          </div>
        </div>

        {/* Health & Maintenance Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="mb-4 text-lg font-medium">Health & Maintenance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Health Score:</span>
                <span className="font-medium">{machine.healthScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getHealthColor(machine.healthScore)}`}
                  style={{ width: `${machine.healthScore}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Maintenance:</span>
              <span className="font-medium">
                {formatDate(machine.lastMaintenance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Next Maintenance:</span>
              <span className="font-medium">
                {formatDate(machine.nextMaintenance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Maintenance Schedule:</span>
              <span className="font-medium capitalize">
                {Array.isArray(machine.maintenanceSchedule) ? machine.maintenanceSchedule.join(", ") : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Repairs:</span>
              <span className="font-medium">{machine.repairCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Repair Cost:</span>
              <span className="font-medium">₹{machine.totalRepairCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="mb-4 text-lg font-medium">Specifications</h3>
        <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg sm:grid-cols-2 md:grid-cols-3">
          {machine.specifications &&
            ((typeof machine.specifications === 'object' && !Array.isArray(machine.specifications) && Object.keys(machine.specifications).length > 0) ||
              (Array.isArray(machine.specifications) && machine.specifications.length > 0)) ? (
            <>
              {Array.isArray(machine.specifications) ? (
                machine.specifications.map((spec: any, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-500">{spec.name}:</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))
              ) : (
                Object.entries(machine.specifications).map(([key, value], index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-500">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="col-span-full text-center py-4 text-gray-500">
              No specifications available
            </div>
          )}
        </div>
      </div>

      {/* Temperature Chart */}
      <div className="mt-8">
        <h3 className="flex items-center mb-4 text-lg font-medium">
          <Thermometer size={20} className="mr-2 text-primary" />
          Latest Temperature Readings
        </h3>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Array.isArray(machine.temperatureData) ? machine.temperatureData : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 50]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;