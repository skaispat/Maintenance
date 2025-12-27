import React, { useState, useEffect } from "react";
import { User, ArrowUp, ArrowDown, Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { MachineDetails, RepairRecord } from "../../models/machineDetailsExtended";
import { supabase } from "../../lib/supabase";

interface CommonPart {
  name: string;
  count: number;
  lastReplaced: string;
  avgLifespan: string;
}

interface RepairHistoryTabProps {
  machine: MachineDetails;
}

const RepairHistoryTab: React.FC<RepairHistoryTabProps> = ({ machine }) => {
  console.log("RepairHistoryTab received machine data:", machine);

  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [repairHistory, setRepairHistory] = useState<RepairRecord[]>([]);
  const [commonParts, setCommonParts] = useState<CommonPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RepairRecord | null>(null);
  const [newRepairRecord, setNewRepairRecord] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    type: "Repair",
    issue: "",
    technician: "",
    cost: "", // Initialize as empty string
    parts: [],
    resolution: "",
    storeItems: []
  });

  // Load repair history from machine prop
  useEffect(() => {
    if (machine && machine.repairHistory) {
      // Map RepairHistoryItem to RepairRecord
      // The service already mapped it to RepairHistoryItem, but we need RepairRecord for this component
      // RepairHistoryItem: { id, date, description, cost, technician, status }
      // RepairRecord: { id, date, type, issue, technician, cost, parts, resolution, storeItems }

      const mappedRepairs: RepairRecord[] = machine.repairHistory.map((item: any) => ({
        id: item.id,
        date: item.date,
        type: "Repair", // Default
        issue: item.description || "",
        technician: item.technician || "",
        cost: item.cost || 0,
        parts: Array.isArray(item.parts) ? item.parts : (typeof item.parts === 'string' ? (item.parts as string).split(',').map(p => p.trim()) : []),
        resolution: "",
        storeItems: []
      }));

      setRepairHistory(mappedRepairs);
      calculateCommonParts(mappedRepairs);
    } else {
      setRepairHistory([]);
      setCommonParts([]);
    }
    setLoading(false);
  }, [machine]);

  // Calculate commonly replaced parts from repair history
  const calculateCommonParts = (repairs: RepairRecord[]) => {
    const partStats: Record<string, { count: number; dates: string[] }> = {};

    // Iterate through all repair records
    repairs.forEach(repair => {
      let partsList: string[] = [];
      if (Array.isArray(repair.parts)) {
        partsList = repair.parts;
      } else if (typeof repair.parts === 'string') {
        // Handle case where parts might be a comma-separated string
        partsList = (repair.parts as string).split(',').map(p => p.trim());
      }

      partsList.forEach(part => {
        if (part && part.trim()) {
          const partName = part.trim();
          if (!partStats[partName]) {
            partStats[partName] = { count: 0, dates: [] };
          }
          partStats[partName].count += 1;
          partStats[partName].dates.push(repair.date);
        }
      });
    });

    // Convert to array and calculate stats
    const commonPartsArray = Object.entries(partStats)
      .map(([name, { count, dates }]) => {
        // Sort dates descending (newest first)
        const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const lastReplaced = sortedDates[0];

        let avgLifespan = "N/A";
        if (sortedDates.length > 1) {
          let totalDiff = 0;
          for (let i = 0; i < sortedDates.length - 1; i++) {
            const d1 = new Date(sortedDates[i]).getTime();
            const d2 = new Date(sortedDates[i + 1]).getTime();
            totalDiff += (d1 - d2);
          }
          const avgDiffMs = totalDiff / (sortedDates.length - 1);
          const avgDays = Math.round(avgDiffMs / (1000 * 60 * 60 * 24));

          if (avgDays >= 365) {
            avgLifespan = `${(avgDays / 365).toFixed(1)} years`;
          } else if (avgDays >= 30) {
            avgLifespan = `${(avgDays / 30).toFixed(1)} months`;
          } else {
            avgLifespan = `${avgDays} days`;
          }
        }

        return {
          name,
          count,
          lastReplaced,
          avgLifespan
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Limit to top 4 parts

    setCommonParts(commonPartsArray);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
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

  const sortedRepairHistory = [...repairHistory].sort((a, b) => {
    const aValue = a[sortColumn as keyof RepairRecord];
    const bValue = b[sortColumn as keyof RepairRecord];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Handle input changes for the new repair record form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRepairRecord((prev: any) => ({
      ...prev,
      [name]: name === 'cost' ? value : value
    }));
  };

  // Handle input changes for the edit repair record form
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingRecord) {
      setEditingRecord({
        ...editingRecord,
        [name]: name === 'cost' ? parseFloat(value) || 0 : value
      });
    }
  };

  // Handle form submission for adding a new repair record
  const handleAddRepairRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!supabase) {
        throw new Error('Supabase client is not properly initialized');
      }

      const newRecord = {
        id: Date.now(), // Generate a simple ID
        date: newRepairRecord.date,
        description: newRepairRecord.issue,
        cost: Number(newRepairRecord.cost) || 0,
        technician: newRepairRecord.technician,
        status: 'completed',
        parts: typeof newRepairRecord.parts === 'string' ? (newRepairRecord.parts as string).split(',').map((p: string) => p.trim()).filter((p: string) => p) : newRepairRecord.parts
      };

      // Get current log from machine prop (or empty array)
      // We need to access the raw repairHistory from machine, which is mapped in the service
      // But here we want to update the JSONB column 'repair_log'
      // We should construct the array based on current machine.repairHistory

      const currentLog = machine.repairHistory || [];
      // We need to convert currentLog back to the format expected by JSONB if needed, 
      // but machine.repairHistory items are already close to what we want.

      const updatedLog = [newRecord, ...currentLog];

      // Update Supabase
      const { error } = await supabase
        .from('machines')
        .update({ repair_log: updatedLog })
        .eq('id', machine.id);

      if (error) throw error;

      const mappedLog: RepairRecord[] = updatedLog.map((item: any) => ({
        id: item.id,
        date: item.date,
        type: "Repair",
        issue: item.description || "",
        technician: item.technician || "",
        cost: item.cost || 0,
        parts: item.parts || [],
        resolution: "",
        storeItems: []
      }));

      setRepairHistory(mappedLog); // Update local state
      calculateCommonParts(mappedLog); // Update common parts

      toast.success("Repair record added successfully");
      // Reset form
      setNewRepairRecord({
        date: new Date().toISOString().split('T')[0],
        type: "Repair",
        issue: "",
        technician: "",
        cost: "",
        parts: [],
        resolution: "",
        storeItems: []
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding repair record:", error);
      toast.error("Failed to add repair record");
    }
  };

  // Handle form submission for editing a repair record
  const handleEditRepairRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRecord) return;

    try {
      if (!supabase) {
        throw new Error('Supabase client is not properly initialized');
      }

      const updatedRecord = {
        id: editingRecord.id,
        date: editingRecord.date,
        description: editingRecord.issue,
        cost: editingRecord.cost,
        technician: editingRecord.technician,
        status: 'completed',
        parts: typeof editingRecord.parts === 'string' ? (editingRecord.parts as string).split(',').map((p: string) => p.trim()).filter((p: string) => p) : editingRecord.parts
      };

      const currentLog = machine.repairHistory || [];
      const updatedLog = currentLog.map((item: any) =>
        item.id === editingRecord.id ? updatedRecord : item
      );

      // Update Supabase
      const { error } = await supabase
        .from('machines')
        .update({ repair_log: updatedLog })
        .eq('id', machine.id);

      if (error) throw error;

      const mappedLog: RepairRecord[] = updatedLog.map((item: any) => ({
        id: item.id,
        date: item.date,
        type: "Repair",
        issue: item.description || "",
        technician: item.technician || "",
        cost: item.cost || 0,
        parts: item.parts || [],
        resolution: "",
        storeItems: []
      }));

      setRepairHistory(mappedLog); // Update local state
      calculateCommonParts(mappedLog); // Update common parts

      toast.success("Repair record updated successfully");
      setEditingRecord(null);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating repair record:", error);
      toast.error("Failed to update repair record");
    }
  };

  // Handle deleting a repair record
  const handleDeleteRepairRecord = async (recordId: number) => {
    if (window.confirm("Are you sure you want to delete this repair record?")) {
      try {
        if (!supabase) {
          throw new Error('Supabase client is not properly initialized');
        }

        const currentLog = machine.repairHistory || [];
        const updatedLog = currentLog.filter((item: any) => item.id !== recordId);

        // Update Supabase
        const { error } = await supabase
          .from('machines')
          .update({ repair_log: updatedLog })
          .eq('id', machine.id);

        if (error) throw error;

        const mappedLog: RepairRecord[] = updatedLog.map((item: any) => ({
          id: item.id,
          date: item.date,
          type: "Repair",
          issue: item.description || "",
          technician: item.technician || "",
          cost: item.cost || 0,
          parts: item.parts || [],
          resolution: "",
          storeItems: []
        }));

        setRepairHistory(mappedLog); // Update local state
        calculateCommonParts(mappedLog); // Update common parts

        toast.success("Repair record deleted successfully");
      } catch (error) {
        console.error("Error deleting repair record:", error);
        toast.error("Failed to delete repair record");
      }
    }
  };

  // Open edit modal with selected record
  const openEditModal = (record: RepairRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Repair History</h3>
        <button
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md border border-transparent shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="mr-2" />
          Add Repair Record
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {sortColumn === "date" && (sortDirection === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />)}
                </div>
              </th>
              <th
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center">
                  Type
                  {sortColumn === "type" && (sortDirection === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />)}
                </div>
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Issue</th>
              <th
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("technician")}
              >
                <div className="flex items-center">
                  Technician
                  {sortColumn === "technician" && (sortDirection === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />)}
                </div>
              </th>
              <th
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("cost")}
              >
                <div className="flex items-center">
                  Cost
                  {sortColumn === "cost" && (sortDirection === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />)}
                </div>
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRepairHistory.length > 0 ? (
              sortedRepairHistory.map((repair) => (
                <tr key={repair.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(repair.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${repair.type === "Repair" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"
                      }`}>
                      {repair.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{repair.issue}</div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-1">{repair.resolution}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">{repair.technician}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{repair.cost.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <button
                      className="mr-3 text-primary hover:text-primary-dark"
                      onClick={() => openEditModal(repair)}
                    >
                      <Edit size={16} className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      className="text-primary hover:text-primary-dark"
                      onClick={() => handleDeleteRepairRecord(repair.id)}
                    >
                      <Trash2 size={16} className="inline mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No repair history records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Commonly Replaced Parts */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-medium">Commonly Replaced Parts</h3>
        {commonParts.length > 0 ? (
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {commonParts.map((part, index) => {
                // Define color classes based on index
                const colorClasses = [
                  "bg-primary/5 rounded-lg",
                  "bg-green-50 rounded-lg",
                  "bg-amber-50 rounded-lg",
                  "bg-purple-50 rounded-lg"
                ];

                const textClasses = [
                  "text-primary",
                  "text-green-700",
                  "text-amber-700",
                  "text-purple-700"
                ];

                const colorIndex = index % 4;

                return (
                  <div key={part.name} className={`p-4 ${colorClasses[colorIndex]}`}>
                    <h4 className={`mb-2 font-medium ${textClasses[colorIndex]}`}>{part.name}</h4>
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between mb-1">
                        <span>Replaced:</span>
                        <span className="font-medium">{part.count} time{part.count > 1 ? 's' : ''}</span>
                      </div>
                      {/* Avg Lifespan removed as requested */}
                      <div className="flex justify-between">
                        <span>Last:</span>
                        <span className="font-medium">{formatDate(part.lastReplaced)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center text-gray-500">
            No commonly replaced parts data available
          </div>
        )}
      </div>

      {/* Add Repair Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Add Repair Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddRepairRecord}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={newRepairRecord.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={newRepairRecord.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Repair">Repair</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Upgrade">Upgrade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                  <input
                    type="text"
                    name="issue"
                    value={newRepairRecord.issue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Describe the issue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                  <input
                    type="text"
                    name="technician"
                    value={newRepairRecord.technician}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Technician name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    name="cost"
                    value={newRepairRecord.cost}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parts Replaced (comma separated)</label>
                  <input
                    type="text"
                    name="parts"
                    value={Array.isArray(newRepairRecord.parts) ? newRepairRecord.parts.join(', ') : newRepairRecord.parts}
                    onChange={(e) => setNewRepairRecord((prev: any) => ({ ...prev, parts: e.target.value.split(',') }))}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g. Bearing, Seal, Filter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                  <textarea
                    name="resolution"
                    value={newRepairRecord.resolution}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Describe the resolution"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-dark"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Repair Record Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Edit Repair Record</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditRepairRecord}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editingRecord.date}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={editingRecord.type}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Repair">Repair</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Upgrade">Upgrade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                  <input
                    type="text"
                    name="issue"
                    value={editingRecord.issue}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Describe the issue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                  <input
                    type="text"
                    name="technician"
                    value={editingRecord.technician}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Technician name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    name="cost"
                    value={editingRecord.cost}
                    onChange={handleEditInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parts Replaced (comma separated)</label>
                  <input
                    type="text"
                    name="parts"
                    value={Array.isArray(editingRecord.parts) ? editingRecord.parts.join(', ') : editingRecord.parts}
                    onChange={(e) => setEditingRecord(prev => prev ? ({ ...prev, parts: e.target.value.split(',') }) : null)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g. Bearing, Seal, Filter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                  <textarea
                    name="resolution"
                    value={editingRecord.resolution}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Describe the resolution"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-dark"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairHistoryTab;