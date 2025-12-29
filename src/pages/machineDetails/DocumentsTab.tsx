import React, { useState, useEffect } from "react";
import { FileText, Download, Trash2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { MachineDetails, Document } from "../../models/machineDetailsExtended";
import { supabase } from "../../lib/supabase";

interface DocumentsTabProps {
  machine: MachineDetails;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ machine }) => {
  console.log("DocumentsTab received machine data:", machine);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch documents from machine prop
  useEffect(() => {
    if (machine && machine.documents) {
      // Map DocumentItem to Document
      const mappedDocs: Document[] = machine.documents.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        size: 'Unknown',
        uploadedBy: 'Current User',
        date: item.uploadedAt
      }));
      setDocuments(mappedDocs);
    } else {
      setDocuments([]);
    }
    setLoading(false);
  }, [machine]);

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



  // Handle document download
  const handleDownload = async (doc: Document) => {
    try {

      const sourceDoc = machine.documents?.find((d: any) => d.id === doc.id);
      if (sourceDoc && sourceDoc.url) {
        window.open(sourceDoc.url, '_blank');
      } else {
        toast.error('Document URL not found');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // Handle document deletion
  const handleDelete = async (docId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        if (!supabase) throw new Error('Supabase client not initialized');

        // 1. Remove from JSONB
        const currentDocs = machine.documents || [];
        const updatedDocs = currentDocs.filter((doc: any) => doc.id !== docId);

        const { error: dbError } = await supabase
          .from('machines')
          .update({ documents: updatedDocs })
          .eq('id', machine.id);

        if (dbError) throw dbError;

        // 2. Remove from Storage (Optional, but good practice)
        // We need the path. If we stored it as URL, we might need to parse it.
        // For now, we just update the metadata.

        setDocuments(updatedDocs.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          size: 'Unknown',
          uploadedBy: 'Current User',
          date: d.uploadedAt
        })));
        toast.success('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
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
        <h3 className="text-lg font-medium">Documents & Images</h3>
      </div>

      {/* Machine Image Section */}
      {machine.imageUrl && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
            <ImageIcon size={18} className="mr-2 text-primary" />
            Machine Image
          </h4>
          <div className="flex justify-center bg-gray-50 rounded-lg p-4 border border-gray-100">
            <img
              src={machine.imageUrl}
              alt={machine.name}
              className="max-h-96 object-contain rounded-md shadow-sm"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Uploaded By</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc: Document) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <FileText size={16} className="mr-2 text-gray-400" />
                    <span className="text-sm font-medium text-primary">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.type === "PDF" ? "bg-primary/10 text-primary" :
                    doc.type === "DOC" ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{doc.size}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{doc.uploadedBy}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(doc.date)}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center mr-3 text-primary hover:text-primary-dark"
                  >
                    <Download size={16} className="mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="inline-flex items-center text-primary hover:text-primary-dark"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No documents uploaded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
};

export default DocumentsTab;