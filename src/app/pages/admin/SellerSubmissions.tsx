import { useEffect, useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import {
  deleteSubmissionProperty,
  fetchSellerSubmissions,
  fetchSellerSubmissionDetail,
  setSubmissionStatus,
  type SellerSubmissionDetail,
  type SellerSubmissionRow,
  type SellerSubmissionStatusCode,
} from '@/app/services/sellerSubmissionsService';

const ACTIONS: Array<{ code: SellerSubmissionStatusCode; label: string; className: string }> = [
  { code: 'REV', label: 'Needs Revision', className: 'px-2 py-1 border border-amber-300 text-amber-700 bg-amber-50 rounded hover:bg-amber-100' },
  { code: 'ACC', label: 'Accept', className: 'px-2 py-1 border border-blue-300 text-blue-700 bg-blue-50 rounded hover:bg-blue-100' },
  { code: 'REJ', label: 'Reject', className: 'px-2 py-1 border border-red-300 text-red-700 bg-red-50 rounded hover:bg-red-100' },
  { code: 'AVL', label: 'Publish', className: 'px-2 py-1 border border-green-300 text-green-700 bg-green-50 rounded hover:bg-green-100' },
];

const getStatusBadgeClass = (statusCode: string): string => {
  switch (statusCode) {
    case 'PND':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'REV':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'ACC':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'REJ':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'AVL':
      return 'bg-green-100 text-green-800 border border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

export default function AdminSellerSubmissions() {
  const [rows, setRows] = useState<SellerSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SellerSubmissionDetail | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchSellerSubmissions());
    } catch (error) {
      console.error('Failed to load seller submissions', error);
      alert('Failed to load seller submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (propertyId: number, code: SellerSubmissionStatusCode) => {
    setActionLoadingId(propertyId);
    try {
      await setSubmissionStatus(propertyId, code);
      await load();
    } catch (error) {
      console.error('Failed to update submission status', error);
      alert('Failed to update submission status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteProperty = async (propertyId: number) => {
    const shouldDelete = confirm('Delete this property draft permanently? This action cannot be undone.');
    if (!shouldDelete) return;

    setActionLoadingId(propertyId);
    try {
      await deleteSubmissionProperty(propertyId);
      await load();
    } catch (error) {
      console.error('Failed to delete property draft', error);
      alert('Failed to delete property draft');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDetail = async (propertyId: number) => {
    setViewOpen(true);
    setViewLoading(true);
    setSelectedDetail(null);

    try {
      const detail = await fetchSellerSubmissionDetail(propertyId);
      setSelectedDetail(detail);
    } catch (error) {
      console.error('Failed to load submission detail', error);
      alert('Failed to load submission detail');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-gray-900">Seller Submissions</h2>
          <p className="text-gray-600">Review drafts and control publishing workflow</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-500">Loading submissions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((row) => (
                    <tr key={row.propertyid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.propertyname}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>{row.sellerName}</div>
                        <div className="text-xs text-gray-500">{row.sellerEmail || row.sellerContact || 'No contact info'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(row.statusCode)}`}>
                          {row.statusName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(row.createdat).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => openDetail(row.propertyid)}
                            className="px-2 py-1 border rounded hover:bg-gray-50"
                          >
                            View
                          </button>
                          {ACTIONS.map((action) => (
                            <button
                              key={action.code}
                              onClick={() => updateStatus(row.propertyid, action.code)}
                              disabled={actionLoadingId === row.propertyid}
                              className={`${action.className} ${row.statusCode === action.code ? 'ring-2 ring-offset-1 ring-gray-400' : ''} disabled:opacity-60`}
                            >
                              {action.label}
                            </button>
                          ))}
                          <button
                            onClick={() => deleteProperty(row.propertyid)}
                            disabled={actionLoadingId === row.propertyid}
                            className="px-2 py-1 border border-red-400 text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 && (
                <div className="p-8 text-center text-gray-500">No submissions currently in review workflow.</div>
              )}
            </div>
          )}
        </div>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seller Submission Details</DialogTitle>
              <DialogDescription>
                {selectedDetail ? `Property #${selectedDetail.propertyid}` : 'Loading draft details...'}
              </DialogDescription>
            </DialogHeader>

            {viewLoading && <div className="py-6 text-gray-500">Loading details...</div>}

            {!viewLoading && selectedDetail && (
              <div className="space-y-5 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Property</p>
                    <p className="text-sm text-gray-900">{selectedDetail.propertyname}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm text-gray-900">{selectedDetail.propertyTypeName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seller</p>
                    <p className="text-sm text-gray-900">{selectedDetail.sellerName}</p>
                    <p className="text-xs text-gray-500">{selectedDetail.sellerEmail || selectedDetail.sellerContact || 'No contact info'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm text-gray-900">{selectedDetail.statusName}</p>
                    <p className="text-xs text-gray-500">{new Date(selectedDetail.createdat).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm text-gray-900">
                    {selectedDetail.location
                      ? [
                          selectedDetail.location.street,
                          selectedDetail.location.barangay,
                          selectedDetail.location.city,
                          selectedDetail.location.province,
                          selectedDetail.location.region,
                          selectedDetail.location.island,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : 'No location data'}
                  </p>
                  {selectedDetail.location?.size != null && (
                    <p className="text-xs text-gray-500 mt-1">Lot Size: {selectedDetail.location.size} sqm</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500 mb-2">Utilities</p>
                    {selectedDetail.utilities ? (
                      <div className="space-y-1 text-sm text-gray-900">
                        <p>Water: {yesNo(selectedDetail.utilities.hasWater)}</p>
                        <p>Electricity: {yesNo(selectedDetail.utilities.hasElectricity)}</p>
                        <p>Mobile Signal: {yesNo(selectedDetail.utilities.hasMobileSignal)}</p>
                        <p>Internet: {yesNo(selectedDetail.utilities.hasInternet)}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No utilities data</p>
                    )}
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500 mb-2">Accessibility</p>
                    {selectedDetail.accessibility ? (
                      <div className="space-y-1 text-sm text-gray-900">
                        <p>Motorcycle: {yesNo(selectedDetail.accessibility.byMotorcycle)}</p>
                        <p>Car: {yesNo(selectedDetail.accessibility.byCar)}</p>
                        <p>Truck: {yesNo(selectedDetail.accessibility.byTruck)}</p>
                        <p>Access Road: {yesNo(selectedDetail.accessibility.byAccessRoad)}</p>
                        <p>Cemented Road: {yesNo(selectedDetail.accessibility.byCementedRoad)}</p>
                        <p>Rough Road: {yesNo(selectedDetail.accessibility.byRoughRoad)}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No accessibility data</p>
                    )}
                  </div>
                </div>

                {(selectedDetail.urbanLotType || selectedDetail.urbanAmenities) && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500 mb-2">Urban Details</p>
                    {selectedDetail.urbanLotType && (
                      <p className="text-sm text-gray-900 mb-2">Lot Type: {selectedDetail.urbanLotType}</p>
                    )}
                    {selectedDetail.urbanAmenities && (
                      <div className="space-y-1 text-sm text-gray-900">
                        <p>Gated: {yesNo(selectedDetail.urbanAmenities.hasGated)}</p>
                        <p>Security: {yesNo(selectedDetail.urbanAmenities.hasSecurity)}</p>
                        <p>Clubhouse: {yesNo(selectedDetail.urbanAmenities.hasClubhouse)}</p>
                        <p>Sports & Fitness: {yesNo(selectedDetail.urbanAmenities.hasSportsFitnessCenter)}</p>
                        <p>Parks & Playgrounds: {yesNo(selectedDetail.urbanAmenities.hasParksPlaygrounds)}</p>
                      </div>
                    )}
                  </div>
                )}

                {((selectedDetail.agriculturalLotTypes?.length ?? 0) > 0 || selectedDetail.agriculturalAmenities) && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500 mb-2">Agricultural Details</p>
                    {(selectedDetail.agriculturalLotTypes?.length ?? 0) > 0 && (
                      <p className="text-sm text-gray-900 mb-2">
                        Lot Types: {selectedDetail.agriculturalLotTypes?.join(', ')}
                      </p>
                    )}
                    {selectedDetail.agriculturalAmenities && (
                      <div className="space-y-1 text-sm text-gray-900">
                        <p>Farmhouse: {yesNo(selectedDetail.agriculturalAmenities.hasFarmhouse)}</p>
                        <p>Barns: {yesNo(selectedDetail.agriculturalAmenities.hasBarns)}</p>
                        <p>Warehouse / Storage: {yesNo(selectedDetail.agriculturalAmenities.hasWarehouseStorage)}</p>
                        <p>Rivers / Streams: {yesNo(selectedDetail.agriculturalAmenities.hasRiversStreams)}</p>
                        <p>Irrigation / Canal: {yesNo(selectedDetail.agriculturalAmenities.hasIrrigationCanal)}</p>
                        <p>Lake / Lagoon: {yesNo(selectedDetail.agriculturalAmenities.hasLakeLagoon)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-lg border p-3">
                  <p className="text-xs text-gray-500 mb-2">Photos</p>
                  {selectedDetail.photos.length === 0 ? (
                    <p className="text-sm text-gray-500">No photos submitted.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedDetail.photos.map((photo) => (
                        <div key={photo.propertyphotoid} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                          {photo.photoDataUrl ? (
                            <img
                              src={photo.photoDataUrl}
                              alt={photo.photofilename || `Photo ${photo.photoorder ?? '-'}`}
                              className="w-full h-40 object-cover"
                            />
                          ) : (
                            <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              Preview unavailable
                            </div>
                          )}
                          <div className="px-3 py-2 text-xs text-gray-600">
                            #{photo.photoorder ?? '-'} • {photo.photofilename || 'unnamed file'}
                            {photo.photosize != null ? ` • ${photo.photosize} bytes` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <button
                onClick={() => setViewOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
