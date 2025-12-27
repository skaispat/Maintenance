import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MaintenanceTask } from '../../models/machineDetailsExtended';
import { updateMaintenanceTask } from '../../services/machineService';
import { toast } from 'react-hot-toast';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: MaintenanceTask;
    machineId: number;
    onTaskUpdated: (updatedTask: MaintenanceTask) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, machineId, onTaskUpdated }) => {
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        dueDate: '',
        status: '',
        assignedTo: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                type: task.type,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                status: task.status,
                assignedTo: task.assignedTo
            });
        }
    }, [task]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updates = {
                title: formData.title,
                type: formData.type,
                dueDate: new Date(formData.dueDate).toISOString(),
                status: formData.status as any,
                assignedTo: formData.assignedTo
            };

            const success = await updateMaintenanceTask(task.id, updates, machineId);

            if (success) {
                const updatedTask: MaintenanceTask = {
                    ...task,
                    ...updates
                };
                onTaskUpdated(updatedTask);
                toast.success('Task updated successfully');
                onClose();
            } else {
                toast.error('Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-medium">Edit Task</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value="maintenance">Maintenance</option>
                            <option value="repair">Repair</option>
                            <option value="inspection">Inspection</option>
                            <option value="cleaning">Cleaning</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                        <input
                            type="text"
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTaskModal;
