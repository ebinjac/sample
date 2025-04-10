'use client';

import { useFormState } from 'react-dom';
import { searchCertificates } from '@/app/actions/certificate-actions';

export function CertificateSearch() {
  const [state, formAction] = useFormState(searchCertificates, { results: [], error: null });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Common Name</label>
            <input
              type="text"
              name="commonName"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isAmexCert"
            id="isAmexCert"
            className="h-4 w-4"
          />
          <label htmlFor="isAmexCert">AMEX Certificate</label>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>

        {state.error && (
          <div className="text-red-500 p-3 bg-red-50 rounded">{state.error}</div>
        )}
      </form>

      {state.results?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Common Name</th>
                  <th className="p-3 text-left">Serial Number</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {state.results.map((cert) => (
                  <tr key={cert.certificateIdentifier} className="border-t">
                    <td className="p-3">{cert.commonName}</td>
                    <td className="p-3">{cert.serialNumber}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded ${
                        cert.certificateStatus === 'Issued' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cert.certificateStatus}
                      </span>
                    </td>
                    <td className="p-3">{cert.validTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}