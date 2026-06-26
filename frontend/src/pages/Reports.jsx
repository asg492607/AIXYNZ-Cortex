import React from 'react';
import { Download, FileText, FileJson } from 'lucide-react';
import api from '../lib/api';

export default function Reports() {
  const downloadReport = async (format) => {
    try {
      const res = await api.get(`/reports/findings/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `findings_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Download className="w-8 h-8 text-blue-500" />
          Reporting & Export
        </h1>
        <p className="text-gray-400 mt-1">Export your security posture data for external analysis and auditing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex flex-col items-center justify-center text-center hover:bg-gray-750 transition cursor-pointer"
             onClick={() => downloadReport('csv')}>
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Export as CSV</h3>
          <p className="text-gray-400 text-sm mt-2">Download a flat CSV spreadsheet of all findings and compliance mappings.</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex flex-col items-center justify-center text-center hover:bg-gray-750 transition cursor-pointer"
             onClick={() => downloadReport('json')}>
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <FileJson className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Export as JSON</h3>
          <p className="text-gray-400 text-sm mt-2">Download raw JSON data for programmatic ingestion by other tools.</p>
        </div>
      </div>
    </div>
  );
}
