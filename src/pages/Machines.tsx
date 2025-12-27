import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Wrench,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { fetchAllMachines } from "../services/machineService";

// Constants
const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1581093458791-8a8415c84d5a?w=400&h=300&fit=crop";
const STATUS_OPTIONS = ["operational", "maintenance", "repair"] as const;
const ITEMS_PER_PAGE = 10;

// Types
type MachineStatus = typeof STATUS_OPTIONS[number];

interface Machine {
  id: number;
  name: string;
  serial_number: string;
  department: string;
  status: MachineStatus;
  last_maintenance: string;
  next_maintenance: string;
  purchase_date: string;
  purchase_price: number;
  total_repair_cost: number;
  repair_count: number;
  health_score: number;
  image_url: string;
  task_assigned: boolean;
  assigned_user: string | null;
  maintenance_parts: string[];
  model?: string;
  manufacturer?: string;
  vendor?: string;
  created_at: string;
  updated_at: string;
}

// Utility functions
const getStatusBadge = (status: MachineStatus) => {
  const statusConfig = {
    operational: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: CheckCircle,
      label: "Operational"
    },
    maintenance: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      icon: Wrench,
      label: "Maintenance"
    },
    repair: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      icon: AlertTriangle,
      label: "Repair"
    }
  };

  const config = statusConfig[status] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: AlertCircle,
    label: "Unknown"
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon size={12} className="mr-1" />
      {config.label}
    </span>
  );
};

const getHealthIndicator = (score: number) => {
  const color =
    score >= 90 ? "bg-green-500" :
      score >= 70 ? "bg-blue-500" :
        score >= 50 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="flex items-center">
      <div className={`mr-2 w-2 h-2 rounded-full ${color}`}></div>
      <span>{score}%</span>
    </div>
  );
};

const getTaskAssignmentBadge = (assigned: boolean) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assigned ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
    }`}>
    {assigned ? "Assigned" : "Unassigned"}
  </span>
);

const Machines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: "name",
    direction: "asc"
  });
  const [filters, setFilters] = useState({
    department: "all",
    status: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch machines from Supabase
  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAllMachines();
      setMachines(data);
    } catch (err: any) {
      console.error('Error fetching machines:', err);
      setError(err.message || 'Failed to fetch machines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Memoized departments
  const departments = useMemo(() =>
    Array.from(new Set(machines.map(m => m.department))),
    [machines]
  );

  // Memoized filtered and sorted machines
  // Memoized filtered and sorted machines
  const filteredMachines = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return machines
      .filter((machine) => {
        const machineName = (machine.name || "").toLowerCase();
        const serialNumber = (machine.serial_number || "").toLowerCase();
        const dept = (machine.department || "").toLowerCase();
        const status = (machine.status || "").toLowerCase();

        const matchesSearch =
          machineName.includes(searchLower) ||
          serialNumber.includes(searchLower) ||
          dept.includes(searchLower) ||
          status.includes(searchLower) ||
          (machine.assigned_user || "").toLowerCase().includes(searchLower) ||
          machine.maintenance_parts?.some(part => (part || "").toLowerCase().includes(searchLower));

        const matchesDepartment = filters.department === "all" || machine.department === filters.department;
        const matchesStatus = filters.status === "all" || machine.status === filters.status;

        return matchesSearch && matchesDepartment && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.column as keyof Machine];
        const bValue = b[sortConfig.column as keyof Machine];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Handle dates
        if (sortConfig.column.includes('maintenance') || sortConfig.column.includes('date')) {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
        }

        return 0;
      });
  }, [machines, searchTerm, filters, sortConfig]);

  const handleSort = useCallback((column: string) => {
    setSortConfig(current => ({
      column,
      direction: current.column === column && current.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  const handleFilterChange = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(current => ({ ...current, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  // Update search handler to reset page
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredMachines.length / ITEMS_PER_PAGE);
  const paginatedMachines = filteredMachines.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-primary mr-2" />
            <div>
              <h3 className="text-sm font-medium text-primary">Error loading machines</h3>
              <p className="text-sm text-primary mt-1">{error}</p>
              {!supabase && (
                <p className="text-sm text-primary mt-1">
                  Supabase client failed to initialize
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchMachines}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Machines</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredMachines.length} of {machines.length} machines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMachines}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          <Link
            to="/machines/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md border border-transparent shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus size={16} className="mr-2" />
            Add Machine
          </Link>
        </div>
      </div>

      {/* Filter and Search */}
      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row p-4 gap-4 bg-white rounded-lg shadow md:items-center">
        <div className="w-full md:flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search machines, parts, serial numbers..."
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500 flex-shrink-0" />
            <select
              className="px-3 py-2 w-full sm:w-48 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <select
              className="px-3 py-2 w-full sm:w-48 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Machine List Table for Desktop */}
      <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <MachineTable
            machines={paginatedMachines}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </div>
        {filteredMachines.length === 0 && (
          <EmptyState machinesCount={machines.length} />
        )}
      </div>

      {/* Machine Cards for Mobile */}
      <div className="block md:hidden space-y-4">
        {filteredMachines.length === 0 ? (
          <EmptyState machinesCount={machines.length} />
        ) : (
          paginatedMachines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filteredMachines.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredMachines.length)}
                </span>{" "}
                of <span className="font-medium">{filteredMachines.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Simplified Pagination: Show current page context */}
                <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components for better organization
const MachineTable: React.FC<{
  machines: Machine[];
  sortConfig: { column: string; direction: 'asc' | 'desc' };
  onSort: (column: string) => void;
}> = ({ machines, sortConfig, onSort }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
          Actions
        </th>
        <SortableHeader
          column="name"
          label="Machine Name"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <SortableHeader
          column="department"
          label="Department"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <SortableHeader
          column="vendor"
          label="Vendor"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <SortableHeader
          column="purchase_price"
          label="Purchase Price"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <SortableHeader
          column="next_maintenance"
          label="Next Maintenance"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <SortableHeader
          column="repair_count"
          label="Repair Count"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
          Task Assignment
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {machines.map((machine) => (
        <MachineTableRow key={machine.id} machine={machine} />
      ))}
    </tbody>
  </table>
);

const SortableHeader: React.FC<{
  column: string;
  label: string;
  sortConfig: { column: string; direction: 'asc' | 'desc' };
  onSort: (column: string) => void;
}> = ({ column, label, sortConfig, onSort }) => (
  <th
    className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
    onClick={() => onSort(column)}
  >
    <div className="flex items-center">
      {label}
      {sortConfig.column === column && (
        sortConfig.direction === "asc" ?
          <ArrowUp size={14} className="ml-1" /> :
          <ArrowDown size={14} className="ml-1" />
      )}
    </div>
  </th>
);

const MachineTableRow: React.FC<{ machine: Machine }> = ({ machine }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
      <div className="flex space-x-2">
        <Link
          to={`/machines/${machine.id}`}
          className="p-1 text-primary rounded hover:text-primary-dark hover:bg-primary/5"
          title="View Details"
        >
          <FileText size={18} />
        </Link>
        <Link
          to={`/assign-task?machineId=${machine.id}&taskType=repair`}
          className="p-1 text-amber-600 rounded hover:text-amber-900 hover:bg-amber-50"
          title="Repair"
        >
          <Wrench size={18} />
        </Link>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-medium text-gray-900">
        {machine.name}
      </div>
      <div className="text-xs text-gray-500">
        SN: {machine.serial_number}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">
        {machine.department}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">
        {machine.vendor || "N/A"}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">
        ₹{machine.purchase_price?.toLocaleString() || "0"}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">
        {machine.next_maintenance ? new Date(machine.next_maintenance).toLocaleDateString('en-GB') : "N/A"}
      </div>
      {machine.status !== 'operational' && (
        <div className="mt-1">
          {getStatusBadge(machine.status)}
        </div>
      )}
    </td>
    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
      {machine.repair_count}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      {getTaskAssignmentBadge(machine.task_assigned)}
      {machine.task_assigned && machine.assigned_user && (
        <div className="text-xs text-gray-500 mt-1">
          {machine.assigned_user}
        </div>
      )}
    </td>
  </tr>
);

const PartsList: React.FC<{ parts: string[] }> = ({ parts }) => (
  <div className="flex flex-wrap gap-1 max-w-xs">
    {parts?.slice(0, 3).map((part, index) => (
      <span
        key={index}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
      >
        {part}
      </span>
    ))}
    {parts?.length > 3 && (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        +{parts.length - 3} more
      </span>
    )}
  </div>
);

const MachineCard: React.FC<{ machine: Machine }> = ({ machine }) => (
  <div className="p-4 bg-white rounded-lg shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        <img
          src={machine.image_url || DEFAULT_IMAGE_URL}
          alt={machine.name}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 break-words">
            {machine.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">SN: {machine.serial_number}</p>
          <div className="mt-2">
            {getStatusBadge(machine.status)}
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-2 ml-2 flex-shrink-0">
        <Link
          to={`/machines/${machine.id}`}
          className="p-2 text-primary rounded hover:text-primary-dark hover:bg-primary/5"
        >
          <FileText size={18} />
        </Link>
        <Link
          to={`/assign-task?machineId=${machine.id}&taskType=repair`}
          className="p-2 text-amber-600 rounded hover:text-amber-900 hover:bg-amber-50"
        >
          <Wrench size={18} />
        </Link>
      </div>
    </div>

    <div className="space-y-3">
      <InfoRow label="Department:" value={machine.department} />
      <div className="flex flex-col text-sm">
        <span className="font-medium text-gray-500 mb-2">Part Names:</span>
        <PartsList parts={machine.maintenance_parts} />
      </div>
      <InfoRow label="Task Assignment:" value={<div>{getTaskAssignmentBadge(machine.task_assigned)}</div>} />
      {machine.task_assigned && machine.assigned_user && (
        <InfoRow label="Assigned To:" value={machine.assigned_user} />
      )}
      <InfoRow label="Health:" value={getHealthIndicator(machine.health_score)} />
      <InfoRow
        label="Next Maintenance:"
        value={new Date(machine.next_maintenance).toLocaleDateString('en-GB')}
      />
      <InfoRow
        label="Last Maintenance:"
        value={new Date(machine.last_maintenance).toLocaleDateString('en-GB')}
      />
      <InfoRow label="Repairs:" value={machine.repair_count.toString()} />
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="font-medium text-gray-500">{label}</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

const EmptyState: React.FC<{ machinesCount: number }> = ({ machinesCount }) => (
  <div className="px-6 py-12 text-center">
    <p className="text-gray-500">
      No machines found matching your criteria.
    </p>
    {machinesCount === 0 && (
      <p className="text-sm text-gray-400 mt-2">
        No machines in database. <Link to="/machines/new" className="text-primary hover:text-primary">Add your first machine</Link>.
      </p>
    )}
  </div>
);

export default Machines;