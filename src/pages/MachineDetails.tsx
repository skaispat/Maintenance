import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Edit } from "lucide-react";
import OverViewTab from "./machineDetails/OverViewTab";
import MaintenanceTab from "./machineDetails/MaintenanceTab";
import RepairHistoryTab from "./machineDetails/RepairHistoryTab";
import PurchasesAssetsTab from "./machineDetails/PurchasesAssetsTab";
import DocumentsTab from "./machineDetails/DocumentsTab";
import AnalyticsTab from "./machineDetails/AnalyticsTab";
import { type MachineDetails } from "../models/machineDetailsExtended";
import { fetchMachineDetails } from "../services/machineService";

const MachineDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [machine, setMachine] = useState<MachineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadMachineDetails = async () => {
      console.log("Loading machine details for ID:", id);

      if (!id) {
        setError("No machine ID provided");
        setLoading(false);
        return;
      }

      // Check if id is a valid number
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        setError("Invalid machine ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const machineData = await fetchMachineDetails(id);
        console.log("Machine data fetched:", machineData);

        if (machineData) {
          setMachine(machineData);
        } else {
          setError(`Machine with ID ${id} not found`);
        }
      } catch (err: any) {
        console.error("Error loading machine details:", err);
        setError(err.message || "Failed to load machine details");
      } finally {
        setLoading(false);
      }
    };

    loadMachineDetails();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      operational: { color: "bg-green-100 text-green-800", text: "Operational" },
      maintenance: { color: "bg-yellow-100 text-yellow-800", text: "Maintenance" },
      down: { color: "bg-primary/10 text-primary", text: "Down" },
      retired: { color: "bg-gray-100 text-gray-800", text: "Retired" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.operational;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "maintenance", name: "Maintenance" },
    { id: "repairs", name: "Repair History" },
    { id: "purchases", name: "Purchases & Assets" },
    { id: "documents", name: "Documents" },
    { id: "analytics", name: "Analytics" },
  ];

  const renderTabContent = () => {
    if (!machine) return null;

    console.log("Rendering tab content for:", activeTab);
    console.log("Machine data:", machine);

    // Add a simple check to see if we're getting valid data
    if (!machine.id || !machine.name) {
      return <div>Error: Invalid machine data</div>;
    }

    switch (activeTab) {
      case "overview":
        return <OverViewTab machine={machine} />;
      case "maintenance":
        return <MaintenanceTab machine={machine} />;
      case "repairs":
        return <RepairHistoryTab machine={machine} />;
      case "purchases":
        return <PurchasesAssetsTab machine={machine} />;
      case "documents":
        return <DocumentsTab machine={machine} />;
      case "analytics":
        return <AnalyticsTab machine={machine} />;
      default:
        return <OverViewTab machine={machine} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="ml-4">Loading machine details for ID: {id}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
          <div className="flex">
            <div>
              <h3 className="text-sm font-medium text-primary">Error loading machine details</h3>
              <p className="text-sm text-primary mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Machine not found</h3>
              <p className="text-sm text-yellow-600 mt-1">The requested machine with ID {id} could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6 overflow-x-auto">
        <Link
          to="/machines"
          className="flex items-center mr-4 text-primary hover:text-primary-dark"
        >
          <ChevronLeft size={20} />
          <span>Back to Machines</span>
        </Link>
        <h1 className="flex-1 text-xl md:text-2xl font-bold text-gray-800">
          {machine.name}
        </h1>
        <div className="hidden md:flex items-center space-x-2">
          {getStatusBadge(machine.status)}
          <Link
            to={`/machines/${id}/edit`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MachineDetails;