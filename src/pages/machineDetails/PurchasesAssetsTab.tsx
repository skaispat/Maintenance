import React, { useState, useEffect } from "react";
import { ShoppingCart, Building, DollarSign, Wrench, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { MachineDetails, StorePurchase, PurchaseItem, FixedAsset } from "../../models/machineDetailsExtended";
import NewPurchaseModal from "./NewPurchaseModal";
import AddAssetsModal from "./AddAssetsModal";
import EditAssetModal from "./EditAssetModal";
import { supabase } from "../../lib/supabase";

interface PurchasesAssetsTabProps {
  machine: MachineDetails;
}

const PurchasesAssetsTab: React.FC<PurchasesAssetsTabProps> = ({ machine }) => {
  console.log("PurchasesAssetsTab received machine data:", machine);

  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);

  useEffect(() => {
    if (machine) {
      setStorePurchases(Array.isArray(machine.storePurchases) ? machine.storePurchases : []);
      setFixedAssets(Array.isArray(machine.fixedAssets) ? machine.fixedAssets : []);
    }
  }, [machine]);

  // Calculate total costs
  const totalStorePurchases = storePurchases.reduce(
    (sum: number, purchase: StorePurchase) => sum + purchase.totalAmount,
    0
  );

  const machinePurchaseCost = machine.purchasePrice || 0;
  const totalRepairCost = machine.totalRepairCost || 0;

  // Prepare data for Pie Chart (Machine Purchase, Store Purchase, Repair Costs)
  const categoryData = [
    { name: "Machine Purchase", value: machinePurchaseCost },
    { name: "Store Purchases", value: totalStorePurchases },
    { name: "Repair Costs", value: totalRepairCost },
  ].filter(item => item.value > 0);

  // Derive Item Usage History from Store Purchases and Repair History
  // This is a simulation since we don't have a dedicated "usage" log, 
  // but we can infer stock from purchases and usage from repairs (if parts matched)
  // For now, we will list items purchased and assume some usage logic or just list them.
  // Better: List unique items purchased and their stats.
  const itemUsageHistory = storePurchases.flatMap(p => p.items || []).reduce((acc: any[], item: PurchaseItem) => {
    const existing = acc.find(i => i.name === item.name);
    if (existing) {
      existing.totalPurchased += item.quantity;
      existing.totalCost += item.totalPrice;
      existing.currentStock += item.quantity; // Assuming no usage tracking yet, or we could randomise for demo
    } else {
      acc.push({
        id: item.id,
        name: item.name,
        category: item.category || "General",
        totalPurchased: item.quantity,
        currentStock: item.quantity, // Default to full stock
        lastUsed: null, // No usage data
        avgLifespan: "N/A",
        totalCost: item.totalPrice
      });
    }
    return acc;
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

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

  const getPurchaseStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "Delivered":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Delivered</span>;
      case "pending":
      case "Pending":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case "cancelled":
      case "Cancelled":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Handler for when a new purchase is added
  const handlePurchaseAdded = async (newPurchase: StorePurchase) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Update local state
      const updatedPurchases = [newPurchase, ...storePurchases];

      // Update Supabase JSONB
      // We need to map it back to what the DB expects if necessary, 
      // but assuming the structure is compatible or we store what we have.
      // machine.storePurchases comes from purchase_history column.

      const { error } = await supabase
        .from('machines')
        .update({ purchase_history: updatedPurchases })
        .eq('id', machine.id);

      if (error) throw error;

      setStorePurchases(updatedPurchases);
      setStorePurchases(updatedPurchases);
      toast.success("Purchase order created successfully");
      setShowNewPurchaseModal(false);
    } catch (error) {
      console.error("Error adding purchase:", error);
      toast.error("Failed to create purchase order");
    }
  };

  // Handler for when a new asset is added
  const handleAssetAdded = async (newAsset: FixedAsset) => {
    try {
      // Use the service to persist the asset
      const { addFixedAsset } = await import("../../services/machineService");
      const success = await addFixedAsset(machine.id, newAsset);

      if (success) {
        const updatedAssets = [...fixedAssets, newAsset];
        setFixedAssets(updatedAssets);
        toast.success("Asset added successfully");
        setShowAddAssetModal(false);
      } else {
        throw new Error("Failed to persist asset");
      }
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error("Failed to add asset");
    }
  };

  // Handler for when an asset is updated
  const handleAssetUpdated = async (updatedAsset: FixedAsset) => {
    try {
      const { updateFixedAsset } = await import("../../services/machineService");
      const success = await updateFixedAsset(machine.id, updatedAsset.id, updatedAsset);

      if (success) {
        const updatedAssets = fixedAssets.map(asset =>
          asset.id === updatedAsset.id ? updatedAsset : asset
        );
        setFixedAssets(updatedAssets);
        toast.success("Asset updated successfully");
        setShowEditAssetModal(false);
        setEditingAsset(null);
      } else {
        throw new Error("Failed to update asset");
      }
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error("Failed to update asset");
    }
  };

  const openEditAssetModal = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setShowEditAssetModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">Purchases & Assets</h3>
        <div className="flex space-x-3">
          <button
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg border border-transparent shadow-sm transition-colors duration-200 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => setShowNewPurchaseModal(true)}
          >
            <ShoppingCart size={16} className="mr-2" />
            New Purchase
          </button>
          <button
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg border border-transparent shadow-sm transition-colors duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={() => setShowAddAssetModal(true)}
          >
            <Building size={16} className="mr-2" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Cost Summary Table */}
      <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Cost Summary</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10">
                      <div className="flex justify-center items-center w-10 h-10 bg-blue-500 rounded-full">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">Machine Purchase</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900 whitespace-nowrap">
                  ₹{(machine.purchasePrice || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-500 whitespace-nowrap">
                  {(((machine.purchasePrice || 0) / ((machine.purchasePrice || 0) + totalStorePurchases + (machine.totalRepairCost || 0))) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10">
                      <div className="flex justify-center items-center w-10 h-10 bg-primary rounded-full">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">Store Purchases</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900 whitespace-nowrap">
                  ₹{totalStorePurchases.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-500 whitespace-nowrap">
                  {totalStorePurchases > 0 ? ((totalStorePurchases / ((machine.purchasePrice || 0) + totalStorePurchases + (machine.totalRepairCost || 0))) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10">
                      <div className="flex justify-center items-center w-10 h-10 bg-primary rounded-full">
                        <Wrench className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">Repair Costs</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900 whitespace-nowrap">
                  ₹{(machine.totalRepairCost || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-500 whitespace-nowrap">
                  {machine.totalRepairCost ? ((machine.totalRepairCost / ((machine.purchasePrice || 0) + totalStorePurchases + (machine.totalRepairCost || 0))) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Categories & Fixed Assets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800">Purchase Categories</h4>
          </div>
          <div className="p-6">
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      dataKey="value"
                    >
                      {categoryData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`₹${value.toLocaleString()}`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No purchase data available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800">Fixed Assets</h4>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {fixedAssets.map((asset: FixedAsset) => (
              <div key={asset.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-base font-medium text-gray-900">{asset.name}</span>
                    <p className="mt-1 text-sm text-gray-600">{asset.category}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-green-600">₹{asset.currentValue.toLocaleString()}</span>
                    <button
                      onClick={() => openEditAssetModal(asset)}
                      className="text-gray-400 hover:text-primary transition-colors"
                      title="Edit Asset"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                  <div><span className="font-medium">Tag:</span> {asset.tag}</div>
                  <div><span className="font-medium">Purchase Date:</span> {formatDate(asset.purchaseDate)}</div>

                  {/* Depreciation Calculations */}
                  {(() => {
                    const price = Number(asset.purchasePrice) || 0;
                    const currentValue = asset.currentValue !== undefined ? Number(asset.currentValue) : price;
                    const depreciatedAmount = price - currentValue;

                    return (
                      <>
                        <div className="col-span-3 grid grid-cols-3 gap-4 mt-2 pt-2 border-t border-gray-100">
                          <div>
                            <span className="block text-xs text-gray-500">Purchase Price</span>
                            <span className="font-medium text-gray-900">₹{price.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Depreciated Amount</span>
                            <span className="font-medium text-primary">-₹{Math.round(depreciatedAmount).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Current Value</span>
                            <span className="font-medium text-green-600">₹{Math.round(currentValue).toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
            {fixedAssets.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No fixed assets registered
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Purchases Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Recent Store Purchases</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Purchase Order</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storePurchases.map((purchase: StorePurchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-primary cursor-pointer hover:text-primary">
                      {purchase.purchaseOrder}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(purchase.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-700">{purchase.vendor}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {Array.isArray(purchase.items) && purchase.items.map((item: PurchaseItem) => (
                        <div key={item.id} className="flex justify-between px-3 py-2 text-sm bg-gray-50 rounded-md">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-medium text-gray-900">
                            {item.quantity} × ₹{item.unitPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">₹{purchase.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPurchaseStatusBadge(purchase.status)}
                  </td>
                </tr>
              ))}
              {storePurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No store purchases recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Usage History Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Item Usage History</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Last Used</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Avg Lifespan</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Total Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {itemUsageHistory.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <div className="text-sm text-gray-500">{item.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">
                        {item.currentStock} / {item.totalPurchased}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{
                            width: `${(item.currentStock / item.totalPurchased) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {item.lastUsed ? formatDate(item.lastUsed) : "Never"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.avgLifespan}</span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">₹{item.totalCost.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {itemUsageHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No item usage history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewPurchaseModal
        isOpen={showNewPurchaseModal}
        onClose={() => setShowNewPurchaseModal(false)}
        machineId={machine.id}
        onPurchaseAdded={handlePurchaseAdded}
      />

      <AddAssetsModal
        isOpen={showAddAssetModal}
        onClose={() => setShowAddAssetModal(false)}
        machineId={machine.id}
        onAssetAdded={handleAssetAdded}
      />

      <EditAssetModal
        isOpen={showEditAssetModal}
        onClose={() => setShowEditAssetModal(false)}
        asset={editingAsset}
        onAssetUpdated={handleAssetUpdated}
      />
    </div>
  );
};

export default PurchasesAssetsTab;