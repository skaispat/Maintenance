import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, Plus, Minus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createMachine, fetchMachineDetails, updateMachine } from '../services/machineService';

// Move InputField component outside the main component to prevent re-creation
const InputField = ({
  label,
  name,
  type = "text",
  required = false,
  value,
  onChange,
  validationErrors,
  readOnly = false,
  placeholder,
  ...props
}: any) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}{required && '*'}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm border p-2 ${validationErrors[name]
        ? 'border-primary/30 focus:border-primary'
        : 'border-gray-300 focus:border-primary focus:ring-primary'
        } ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      {...props}
    />
    {validationErrors[name] && (
      <p className="mt-1 text-sm text-primary flex items-center">
        <AlertCircle size={14} className="mr-1" />
        {validationErrors[name]}
      </p>
    )}
  </div>
);

// Move FileUpload component outside the main component to prevent re-creation
const FileUpload = ({ label, id, accept, description, onChange, file }: any) => (
  <div className="h-full flex flex-col">
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
      <div className="space-y-1 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="flex text-sm text-gray-600 justify-center flex-wrap">
          <label htmlFor={id} className="cursor-pointer font-medium text-primary hover:text-primary">
            <span>{file ? "Change file" : "Upload a file"}</span>
            <input id={id} type="file" accept={accept} className="hidden" onChange={onChange} />
          </label>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
        {file && <p className="text-xs text-green-600 mt-1">Selected: {file.name}</p>}
      </div>
    </div>
  </div>
);

interface FormData {
  name: string;
  model: string;
  manufacturer: string;
  department: string;
  location: string;
  purchase_date: string;
  purchase_price: string;
  vendor: string;
  warranty_expiration: string;
  next_maintenance: string;
  notes: string;
}

interface Specification {
  name: string;
  value: string;
}

const NewMachine = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [machineImage, setMachineImage] = useState<File | null>(null);
  const [userManual, setUserManual] = useState<File | null>(null);
  const [specsSheet, setSpecsSheet] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [specifications, setSpecifications] = useState<Specification[]>([{ name: '', value: '' }]);
  const [maintenanceParts, setMaintenanceParts] = useState<string[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState(['quarterly', 'annual']);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    name: '', model: '', manufacturer: '', department: '',
    location: '', purchase_date: '', purchase_price: '', vendor: '',
    warranty_expiration: '', next_maintenance: '', notes: ''
  });

  // Fetch machine details if in edit mode
  React.useEffect(() => {
    const loadMachine = async () => {
      if (!isEditMode || !id) return;

      try {
        setInitialLoading(true);
        const machine = await fetchMachineDetails(id);
        if (machine) {
          setFormData({
            name: machine.name,
            model: machine.model || '',
            manufacturer: machine.manufacturer || '',
            department: machine.department,
            location: machine.location || '',
            purchase_date: machine.purchaseDate,
            purchase_price: machine.purchasePrice?.toString() || '',
            vendor: machine.vendor || '',
            warranty_expiration: machine.warrantyExpiration || '',
            next_maintenance: machine.nextMaintenance,
            notes: '', // Notes might not be in the main object or need specific handling
          });

          if (machine.imageUrl) {
            setImagePreview(machine.imageUrl);
          }

          if (machine.specifications) {
            setSpecifications(
              Object.entries(machine.specifications).map(([name, value]) => ({ name, value }))
            );
          }

          if (machine.maintenanceParts) {
            setMaintenanceParts(machine.maintenanceParts);
          }

          if (machine.maintenanceSchedule) {
            // maintenanceSchedule is string[] in MachineDetails
            setMaintenanceSchedule(machine.maintenanceSchedule);
          }
        }
      } catch (error) {
        console.error('Error loading machine:', error);
        toast.error('Failed to load machine details');
      } finally {
        setInitialLoading(false);
      }
    };

    loadMachine();
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Machine name is required';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.purchase_date) errors.purchase_date = 'Purchase date is required';
    if (!formData.next_maintenance) errors.next_maintenance = 'Next maintenance date is required';

    if (formData.purchase_price && parseFloat(formData.purchase_price) < 0) {
      errors.purchase_price = 'Purchase price cannot be negative';
    }

    if (formData.purchase_date && formData.next_maintenance) {
      const purchaseDate = new Date(formData.purchase_date);
      const nextMaintenance = new Date(formData.next_maintenance);
      const today = new Date(); today.setHours(0, 0, 0, 0);

      if (nextMaintenance <= purchaseDate) errors.next_maintenance = 'Next maintenance must be after purchase date';
      if (nextMaintenance <= today) errors.next_maintenance = 'Next maintenance must be a future date';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be under 5MB");
      return;
    }

    setMachineImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'manual' | 'specs') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    if (type === 'manual') {
      setUserManual(file);
    } else {
      setSpecsSheet(file);
    }
  };

  // Fixed specification handlers
  const addSpecification = () => {
    setSpecifications(prev => [...prev, { name: '', value: '' }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecification = (index: number, field: 'name' | 'value', value: string) => {
    setSpecifications(prev =>
      prev.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      )
    );
  };

  // Fixed maintenance parts handlers
  const addMaintenancePart = () => {
    if (maintenanceParts.length >= 5) {
      toast.error("Maximum 5 maintenance parts allowed");
      return;
    }
    setMaintenanceParts(prev => [...prev, '']);
  };

  const removeMaintenancePart = (index: number) => {
    setMaintenanceParts(prev => prev.filter((_, i) => i !== index));
  };

  const updateMaintenancePart = (index: number, value: string) => {
    setMaintenanceParts(prev =>
      prev.map((part, i) =>
        i === index ? value : part
      )
    );
  };

  const toggleMaintenanceSchedule = (schedule: string) => {
    setMaintenanceSchedule(prev =>
      prev.includes(schedule)
        ? prev.filter(s => s !== schedule)
        : [...prev, schedule]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return toast.error('Please fix validation errors');

    setLoading(true);
    try {
      const specificationsObj = specifications.reduce((acc, spec) => {
        if (spec.name.trim() && spec.value.trim()) {
          acc[spec.name.trim()] = spec.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const machineData = {
        name: formData.name.trim(),
        model: formData.model.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        department: formData.department,
        location: formData.location.trim() || null,
        purchase_date: formData.purchase_date,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        vendor: formData.vendor.trim() || null,
        warranty_expiration: formData.warranty_expiration || null,
        next_maintenance: formData.next_maintenance,
        last_maintenance: formData.purchase_date,
        status: 'operational' as const,
        health_score: 100,
        repair_count: 0,
        total_repair_cost: 0,
        task_assigned: false,
        assigned_user: null,
        maintenance_parts: maintenanceParts.filter(part => part.trim() !== ''),
        specifications: Object.keys(specificationsObj).length > 0 ? specificationsObj : null,
        maintenance_schedule: maintenanceSchedule,
        image_file: machineImage,
        user_manual: userManual,
        specs_sheet: specsSheet,
        notes: formData.notes.trim() || null,
      };

      if (isEditMode && id) {
        await updateMachine(id, machineData);
        toast.success('Machine updated successfully');
      } else {
        await createMachine(machineData);
        toast.success('Machine successfully added to inventory');
      }
      navigate('/machines');
    } catch (error: any) {
      console.error('Error creating machine:', error);
      toast.error(error.message || 'Failed to create machine');
    } finally {
      setLoading(false);
    }
  };

  const getDateString = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center mb-6 space-y-2 md:space-y-0 px-4 md:px-0">
        <Link to="/machines" className="text-primary hover:text-primary-dark md:mr-4 flex items-center">
          <ChevronLeft size={20} />
          <span>Back to Machines</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Machine' : 'Add New Machine'}</h1>
      </div>

      <div className="bg-white rounded-lg shadow mx-4 md:mx-0 mb-0">
        <div className="p-4 md:p-6 pb-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Machine Information */}
              <div className="space-y-6">
                <h2 className="font-medium text-lg text-gray-900 border-b pb-2">Machine Information</h2>
                <InputField
                  label="Machine Name"
                  name="name"
                  required
                  placeholder="e.g., Hydraulic Press HP-102"
                  value={formData.name}
                  onChange={handleInputChange}
                  validationErrors={validationErrors}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input
                    type="text"
                    disabled
                    className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 bg-gray-100 p-2 text-gray-500 cursor-not-allowed"
                    value="SN-2025/Machine Name/001"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Serial number will be automatically generated upon creation.
                  </p>
                </div>

                <InputField
                  label="Model"
                  name="model"
                  placeholder="e.g., HP-2000 Series"
                  value={formData.model}
                  onChange={handleInputChange}
                  validationErrors={validationErrors}
                />
                <InputField
                  label="Manufacturer"
                  name="manufacturer"
                  placeholder="e.g., Industrial Dynamics Ltd."
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  validationErrors={validationErrors}
                />

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department*</label>
                  <select
                    id="department"
                    name="department"
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm border p-2 ${validationErrors.department ? 'border-primary/30 focus:border-primary' : 'border-gray-300 focus:border-primary'
                      }`}
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Department</option>
                    {['Rolling Mill', 'Furnace', 'Slag Crusher', 'CCM'].map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {validationErrors.department && (
                    <p className="mt-1 text-sm text-primary flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {validationErrors.department}
                    </p>
                  )}
                </div>

                <InputField
                  label="Location"
                  name="location"
                  placeholder="e.g., Building A, Floor 2, Section 3"
                  value={formData.location}
                  onChange={handleInputChange}
                  validationErrors={validationErrors}
                />
              </div>

              {/* Right Column - Purchase & Maintenance Details */}
              <div className="space-y-6">
                <h2 className="font-medium text-lg text-gray-900 border-b pb-2">Purchase & Maintenance Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Purchase Date"
                    name="purchase_date"
                    type="date"
                    required
                    max={getDateString()}
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    validationErrors={validationErrors}
                  />
                  <InputField
                    label="Purchase Price (₹)"
                    name="purchase_price"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    validationErrors={validationErrors}
                  />
                </div>

                <InputField
                  label="Vendor"
                  name="vendor"
                  placeholder="e.g., Industrial Suppliers Inc."
                  value={formData.vendor}
                  onChange={handleInputChange}
                  validationErrors={validationErrors}
                />
                <InputField
                  label="Warranty Expiration"
                  name="warranty_expiration"
                  type="date"
                  min={formData.purchase_date || getDateString()}
                  value={formData.warranty_expiration}
                  onChange={handleInputChange}
                  validationErrors={validationErrors}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Schedule</label>
                  <div className="space-y-2">
                    {['monthly', 'quarterly', 'biannual', 'annual'].map((schedule) => (
                      <div key={schedule} className="flex items-center">
                        <input
                          type="checkbox"
                          id={schedule}
                          checked={maintenanceSchedule.includes(schedule)}
                          onChange={() => toggleMaintenanceSchedule(schedule)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor={schedule} className="ml-2 block text-sm text-gray-700 capitalize">
                          {schedule}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Parts ({maintenanceParts.filter(p => p.trim() !== '').length}/5)
                  </label>
                  <div className="space-y-2">
                    {maintenanceParts.map((part, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Part ${index + 1}`}
                          value={part}
                          onChange={(e) => updateMaintenancePart(index, e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeMaintenancePart(index)}
                          className="p-2 rounded-full hover:bg-primary/5 text-primary"
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                    {maintenanceParts.length < 5 && (
                      <button
                        type="button"
                        onClick={addMaintenancePart}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Part
                      </button>
                    )}
                  </div>
                </div>

                <InputField
                  label="Next Maintenance Date"
                  name="next_maintenance"
                  type="date"
                  required
                  min={getDateString(1)}
                  value={formData.next_maintenance}
                  onChange={handleInputChange}
                  validationErrors={validationErrors}
                />
              </div>
            </div>

            {/* Documentation Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="font-medium text-lg text-gray-900 mb-4">Documentation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="h-full flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Machine Image</label>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Machine Preview" className="w-32 h-32 object-cover rounded-lg mb-3" />
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600 justify-center flex-wrap">
                      <label htmlFor="machine-image" className="cursor-pointer font-medium text-primary hover:text-primary">
                        <span>{imagePreview ? "Change Image" : "Upload Image"}</span>
                        <input id="machine-image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>

                <FileUpload
                  label="User Manual"
                  id="user-manual"
                  accept=".pdf,.doc,.docx"
                  description="PDF, DOC up to 10MB"
                  onChange={(e: any) => handleDocumentUpload(e, 'manual')}
                  file={userManual}
                />
                <FileUpload
                  label="Specifications Sheet"
                  id="specs-sheet"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  description="PDF, DOC, XLS up to 10MB"
                  onChange={(e: any) => handleDocumentUpload(e, 'specs')}
                  file={specsSheet}
                />
              </div>
            </div>

            {/* Additional Specifications */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="font-medium text-lg text-gray-900 mb-4">Additional Specifications</h2>
              <div className="space-y-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input
                      type="text"
                      placeholder="Specification Name"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                      value={spec.name}
                      onChange={(e) => updateSpecification(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                    />
                    {specifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="p-2 rounded-full hover:bg-primary/5 text-primary"
                      >
                        <Minus size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSpecification}
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus size={16} className="mr-2" />
                Add Specification
              </button>
            </div>

            {/* Notes Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="font-medium text-lg text-gray-900 mb-4">Notes</h2>
              <textarea
                rows={4}
                name="notes"
                className="shadow-sm block w-full focus:ring-primary focus:border-primary sm:text-sm border border-gray-300 rounded-md p-2"
                placeholder="Add any additional notes about this machine..."
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Link to="/machines" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  isEditMode ? 'Update Machine' : 'Save Machine'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewMachine;