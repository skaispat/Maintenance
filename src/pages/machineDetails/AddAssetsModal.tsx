import React, { useState } from "react";
import { Building } from "lucide-react";
import toast from "react-hot-toast";
import { FixedAsset } from "../../models/machineDetailsExtended";

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number;
  onAssetAdded: (asset: FixedAsset) => void;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAssetAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    category: "Manufacturing Equipment",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: "",
    currentValue: "",
    status: "Active",
    location: ""
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create new asset object
      // Note: Persistence is handled by the parent component or not supported in current schema
      const newAsset: FixedAsset = {
        id: Date.now(), // Temporary ID
        name: formData.name,
        tag: formData.tag,
        category: formData.category,
        purchaseDate: formData.purchaseDate,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        depreciation: 0,
        currentValue: parseFloat(formData.currentValue) || 0,
        // location: formData.location, // location is not in FixedAsset interface in machineDetailsExtended.ts
        // status: formData.status, // status is not in FixedAsset interface
        depreciationRate: 0
      };

      onAssetAdded(newAsset);

      onClose();
      setFormData({
        name: "",
        tag: "",
        category: "Manufacturing Equipment",
        purchaseDate: new Date().toISOString().split("T")[0],
        purchasePrice: "",
        currentValue: "",
        status: "Active",
        location: ""
      });
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error("Failed to add asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-y-auto fixed inset-0 z-50">
      <div className="flex justify-center items-center p-4 min-h-screen">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transition-all transform">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="flex justify-center items-center w-10 h-10 bg-primary/10 rounded-full">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add New Asset</h3>
                  <p className="text-sm text-gray-500">Register a new asset in the system</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Asset Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Asset Name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Asset Tag</label>
                    <input
                      type="text"
                      name="tag"
                      value={formData.tag}
                      onChange={handleChange}
                      className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="ASSET-XXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="px-4 py-3 w-full bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="Manufacturing Equipment">Manufacturing Equipment</option>
                      <option value="Support Equipment">Support Equipment</option>
                      <option value="Environmental Control">Environmental Control</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Purchase Date</label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Purchase Price</label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      step="0.01"
                      className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Current Value</label>
                    <input
                      type="number"
                      name="currentValue"
                      value={formData.currentValue}
                      onChange={handleChange}
                      step="0.01"
                      className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="px-4 py-3 w-full bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Building A, Floor 2, Section 3"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg border border-transparent transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Asset"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssetModal;