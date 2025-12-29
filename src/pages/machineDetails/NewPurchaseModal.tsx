import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { StorePurchase } from "../../models/machineDetailsExtended";

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number;
  onPurchaseAdded: (purchase: StorePurchase) => void;
}

const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({ isOpen, onClose, onPurchaseAdded }) => {
  const [formData, setFormData] = useState({
    purchaseOrder: "",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
    status: "Delivered",
    itemName: "",
    quantity: "1",
    unitPrice: ""
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
      // Create the object to pass back to parent
      const newPurchase: StorePurchase = {
        id: Date.now(), // Temporary ID, will be managed by parent/DB
        purchaseOrder: formData.purchaseOrder,
        vendor: formData.vendor,
        date: formData.date,
        totalAmount: (parseInt(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0),
        status: formData.status,
        items: [{
          id: Date.now(),
          name: formData.itemName,
          category: "General",
          quantity: parseInt(formData.quantity) || 1,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          totalPrice: (parseInt(formData.quantity) || 1) * (parseFloat(formData.unitPrice) || 0)
        }],
        // Compatibility fields for the other StorePurchase interface
        itemName: formData.itemName,
        quantity: parseInt(formData.quantity) || 1,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        totalPrice: (parseInt(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0),
        purchaseDate: formData.date,
        supplier: formData.vendor
      };

      onPurchaseAdded(newPurchase);

      onClose();
      setFormData({
        purchaseOrder: "",
        vendor: "",
        date: new Date().toISOString().split("T")[0],
        status: "Delivered",
        itemName: "",
        quantity: "1",
        unitPrice: ""
      });
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast.error("Failed to create purchase order");
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
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">New Purchase Order</h3>
                  <p className="text-sm text-gray-500">Create a new purchase order</p>
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
            <div className="px-6 py-6 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Purchase Order</label>
                  <input
                    type="text"
                    name="purchaseOrder"
                    value={formData.purchaseOrder}
                    onChange={handleChange}
                    className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="PO-2024-XXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Vendor</label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Vendor Name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Item Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Item Name</label>
                    <input
                      type="text"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleChange}
                      className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Item Name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        name="unitPrice"
                        value={formData.unitPrice}
                        onChange={handleChange}
                        step="0.01"
                        className="px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="px-4 py-3 w-full bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="Delivered">Delivered</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
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
                  {loading ? "Creating..." : "Create Purchase Order"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
};

export default NewPurchaseModal;