import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Upload, X } from 'lucide-react';
import AdminLayout from '@/app/components/AdminLayout';
import FormSection from '@/app/components/ui/FormSection';
import CheckboxGrid from '@/app/components/ui/CheckboxGrid';
import AdminPropertyRadioGroup from './components/property/AdminPropertyRadioGroup';
import type { AdminPropertyPhotoUpload } from '@/app/services/adminPropertyService';
import {
  fetchAdminPropertyData,
  fetchAdminPropertyDetails,
  createAdminProperty,
  updateAdminProperty,
  type ProjectOption,
  type SellerOption,
  type PropertyTypeOption,
  type PropertyListingStatusOption,
  type UrbanLotTypeOption,
  type AgriculturalLotTypeOption,
  type CommercialLotTypeOption,
  type IndustrialLotTypeOption,
  type PropertyPayload,
  type PropertyDetailPayload,
} from '@/app/services/adminPropertyService';

/* ===== Main Component ===== */

export default function AdminPropertyForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeOption[]>([]);
  const [listingStatuses, setListingStatuses] = useState<PropertyListingStatusOption[]>([]);
  const [urbanLotTypes, setUrbanLotTypes] = useState<UrbanLotTypeOption[]>([]);
  const [agriculturalLotTypes, setAgriculturalLotTypes] = useState<AgriculturalLotTypeOption[]>([]);
  const [commercialLotTypes, setCommercialLotTypes] = useState<CommercialLotTypeOption[]>([]);
  const [industrialLotTypes, setIndustrialLotTypes] = useState<IndustrialLotTypeOption[]>([]);

  const [formData, setFormData] = useState({
    propertyname: '',
    projectid: 0,
    sellerclientid: null as number | null,
    propertytypeid: null as number | null,
    propertylistingstatusid: 0,
    propertyownershipid: null as number | null,
    location_island: 'Luzon',
    location_region: '',
    location_province: '',
    location_city: '',
    location_barangay: '',
    location_street: '',
    lot_size: 0,
    urbanreflottypeid: null as number | null,
    commercialreflottypeid: null as number | null,
    industrialreflottypeid: null as number | null,
    lotType: '',
    titled: false,
    overlooking: false,
    topography: '',
    amenities: [] as string[],
    utilities_water: false,
    utilities_electricity: false,
    utilities_sim: false,
    utilities_internet: false,
    access_motorcycle: false,
    access_car: false,
    access_truck: false,
    access_road: false,
    access_cemented_road: false,
    access_rough_road: false,
    facilities_gated: false,
    facilities_security: false,
    facilities_clubhouse: false,
    facilities_sports: false,
    facilities_parks: false,
    agriculturalreflottypeids: [] as number[],
    agri_hasfarmhouse: false,
    agri_hasbarns: false,
    agri_haswarehousestorage: false,
    agri_hasriversstreams: false,
    agri_hasirrigationcanal: false,
    agri_haslakelagoon: false,
    comm_hasparking: false,
    comm_hasloadingbay: false,
    comm_haselevator: false,
    comm_hasfireprotection: false,
    comm_hassecurity: false,
    comm_hascctv: false,
    ind_hasthreephasepower: false,
    ind_hasheavyhaulroadaccess: false,
    ind_hasloadingdock: false,
    ind_haswarehouse: false,
    ind_hasfireprotection: false,
    ind_hashazmatzone: false,
    ind_hastruckaccess: false,
    photos: [] as AdminPropertyPhotoUpload[],
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await fetchAdminPropertyData();
        if (!mounted) return;

        setProjects(data.projects);
        setSellers(data.sellers);
        setPropertyTypes(data.propertyTypes);
        setListingStatuses(data.listingStatuses);
        setUrbanLotTypes(data.urbanLotTypes);
        setAgriculturalLotTypes(data.agriculturalLotTypes);
        setCommercialLotTypes(data.commercialLotTypes);
        setIndustrialLotTypes(data.industrialLotTypes);

        // If edit mode, load property details
        if (isEditMode && id) {
          const propertyId = Number(id);
          const property = data.properties.find(p => p.propertyid === propertyId);
          
          if (property) {
            const details = await fetchAdminPropertyDetails(propertyId);
            setFormData({
              propertyname: property.propertyname ?? '',
              projectid: property.projectid,
              sellerclientid: property.sellerclientid ?? null,
              propertytypeid: property.propertytypeid ?? null,
              propertylistingstatusid: property.propertylistingstatusid,
              propertyownershipid: property.propertyownershipid ?? null,
              location_island: details.location_island ?? 'Luzon',
              location_region: details.location_region ?? '',
              location_province: details.location_province ?? '',
              location_city: details.location_city ?? '',
              location_barangay: details.location_barangay ?? '',
              location_street: details.location_street ?? '',
              lot_size: details.lot_size ?? 0,
              urbanreflottypeid: details.urbanreflottypeid ?? null,
              commercialreflottypeid: details.commercialreflottypeid ?? null,
              industrialreflottypeid: details.industrialreflottypeid ?? null,
              lotType: details.urbanreflottypeid
                ? String(details.urbanreflottypeid)
                : details.commercialreflottypeid
                  ? String(details.commercialreflottypeid)
                  : details.industrialreflottypeid
                    ? String(details.industrialreflottypeid)
                    : '',
              titled: Boolean(details.detail_istitled),
              overlooking: Boolean(details.detail_isoverlooking),
              topography: details.detail_topography ?? '',
              amenities: (() => {
                const typeName = (property.property_type_name ?? '').toLowerCase();
                if (typeName.includes('commercial')) {
                  return [
                    ...(details.comm_hasparking ? ['Parking'] : []),
                    ...(details.comm_hasloadingbay ? ['Loading Bay'] : []),
                    ...(details.comm_haselevator ? ['Elevator'] : []),
                    ...(details.comm_hasfireprotection ? ['Fire Protection'] : []),
                    ...(details.comm_hassecurity ? ['Security'] : []),
                    ...(details.comm_hascctv ? ['CCTV'] : []),
                  ];
                }
                if (typeName.includes('industrial')) {
                  return [
                    ...(details.ind_hasthreephasepower ? ['Three-Phase Power'] : []),
                    ...(details.ind_hasheavyhaulroadaccess ? ['Heavy Haul Road Access'] : []),
                    ...(details.ind_hasloadingdock ? ['Loading Dock'] : []),
                    ...(details.ind_haswarehouse ? ['Warehouse'] : []),
                    ...(details.ind_hasfireprotection ? ['Fire Protection'] : []),
                    ...(details.ind_hashazmatzone ? ['Hazmat Zone'] : []),
                    ...(details.ind_hastruckaccess ? ['Truck Access'] : []),
                  ];
                }
                return [
                  ...(details.facilities_gated ? ['Gated'] : []),
                  ...(details.facilities_security ? ['Security'] : []),
                  ...(details.facilities_clubhouse ? ['Clubhouse / Function Hall'] : []),
                  ...(details.facilities_sports ? ['Sports & Fitness Center'] : []),
                  ...(details.facilities_parks ? ['Parks & Playgrounds'] : []),
                ];
              })(),
              utilities_water: details.utilities_water ?? false,
              utilities_electricity: details.utilities_electricity ?? false,
              utilities_sim: details.utilities_sim ?? false,
              utilities_internet: details.utilities_internet ?? false,
              access_motorcycle: details.access_motorcycle ?? false,
              access_car: details.access_car ?? false,
              access_truck: details.access_truck ?? false,
              access_road: details.access_road ?? false,
              access_cemented_road: details.access_cemented_road ?? false,
              access_rough_road: details.access_rough_road ?? false,
              facilities_gated: details.facilities_gated ?? false,
              facilities_security: details.facilities_security ?? false,
              facilities_clubhouse: details.facilities_clubhouse ?? false,
              facilities_sports: details.facilities_sports ?? false,
              facilities_parks: details.facilities_parks ?? false,
              agriculturalreflottypeids: details.agriculturalreflottypeids ?? [],
              agri_hasfarmhouse: details.agri_hasfarmhouse ?? false,
              agri_hasbarns: details.agri_hasbarns ?? false,
              agri_haswarehousestorage: details.agri_haswarehousestorage ?? false,
              agri_hasriversstreams: details.agri_hasriversstreams ?? false,
              agri_hasirrigationcanal: details.agri_hasirrigationcanal ?? false,
              agri_haslakelagoon: details.agri_haslakelagoon ?? false,
              comm_hasparking: details.comm_hasparking ?? false,
              comm_hasloadingbay: details.comm_hasloadingbay ?? false,
              comm_haselevator: details.comm_haselevator ?? false,
              comm_hasfireprotection: details.comm_hasfireprotection ?? false,
              comm_hassecurity: details.comm_hassecurity ?? false,
              comm_hascctv: details.comm_hascctv ?? false,
              ind_hasthreephasepower: details.ind_hasthreephasepower ?? false,
              ind_hasheavyhaulroadaccess: details.ind_hasheavyhaulroadaccess ?? false,
              ind_hasloadingdock: details.ind_hasloadingdock ?? false,
              ind_haswarehouse: details.ind_haswarehouse ?? false,
              ind_hasfireprotection: details.ind_hasfireprotection ?? false,
              ind_hashazmatzone: details.ind_hashazmatzone ?? false,
              ind_hastruckaccess: details.ind_hastruckaccess ?? false,
              photos: [],
            });
          }
        }
      } catch (error) {
        console.error('Failed to load property form options:', error);
        setSubmitError('Failed to load form data. Please try again.');
      } finally {
        if (mounted) {
          setIsLoadingOptions(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [id, isEditMode]);

  const selectedPropertyType = propertyTypes.find(
    (type) => type.propertytypeid === formData.propertytypeid
  );
  const normalizedPropertyType = selectedPropertyType?.propertytypename?.toLowerCase() ?? '';
  const isAgriculturalType = normalizedPropertyType.includes('agri');
  const isCommercialType = normalizedPropertyType.includes('commercial');
  const isIndustrialType = normalizedPropertyType.includes('industrial');
  const isUrbanType = !isAgriculturalType && !isCommercialType && !isIndustrialType;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === 'true' || value === 'false') {
      setFormData((prev) => ({ ...prev, [field]: value === 'true' }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const toggleAgriculturalLotType = (lotTypeId: number) => {
    setFormData((prev) => {
      const current = prev.agriculturalreflottypeids;
      const next = current.includes(lotTypeId)
        ? current.filter((id) => id !== lotTypeId)
        : [...current, lotTypeId];
      return { ...prev, agriculturalreflottypeids: next };
    });
  };

  const handleAmenitiesToggle = (amenity: string) => {
    setFormData((prev) => {
      const current = prev.amenities;
      const next = current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity];

      const updatedData = { ...prev, amenities: next };

      if (isUrbanType) {
        if (amenity === 'Gated') updatedData.facilities_gated = next.includes('Gated');
        if (amenity === 'Security') updatedData.facilities_security = next.includes('Security');
        if (amenity === 'Clubhouse / Function Hall') {
          updatedData.facilities_clubhouse = next.includes('Clubhouse / Function Hall');
        }
        if (amenity === 'Sports & Fitness Center') {
          updatedData.facilities_sports = next.includes('Sports & Fitness Center');
        }
        if (amenity === 'Parks & Playgrounds') {
          updatedData.facilities_parks = next.includes('Parks & Playgrounds');
        }
      }

      if (isCommercialType) {
        if (amenity === 'Parking') updatedData.comm_hasparking = next.includes('Parking');
        if (amenity === 'Loading Bay') updatedData.comm_hasloadingbay = next.includes('Loading Bay');
        if (amenity === 'Elevator') updatedData.comm_haselevator = next.includes('Elevator');
        if (amenity === 'Fire Protection') {
          updatedData.comm_hasfireprotection = next.includes('Fire Protection');
        }
        if (amenity === 'Security') updatedData.comm_hassecurity = next.includes('Security');
        if (amenity === 'CCTV') updatedData.comm_hascctv = next.includes('CCTV');
      }

      if (isIndustrialType) {
        if (amenity === 'Three-Phase Power') {
          updatedData.ind_hasthreephasepower = next.includes('Three-Phase Power');
        }
        if (amenity === 'Heavy Haul Road Access') {
          updatedData.ind_hasheavyhaulroadaccess = next.includes('Heavy Haul Road Access');
        }
        if (amenity === 'Loading Dock') updatedData.ind_hasloadingdock = next.includes('Loading Dock');
        if (amenity === 'Warehouse') updatedData.ind_haswarehouse = next.includes('Warehouse');
        if (amenity === 'Fire Protection') {
          updatedData.ind_hasfireprotection = next.includes('Fire Protection');
        }
        if (amenity === 'Hazmat Zone') updatedData.ind_hashazmatzone = next.includes('Hazmat Zone');
        if (amenity === 'Truck Access') updatedData.ind_hastruckaccess = next.includes('Truck Access');
      }

      return updatedData;
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== selectedFiles.length) {
      setSubmitError('Only image files are allowed for photo uploads.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const availableSlots = 10 - formData.photos.length;
    if (imageFiles.length > availableSlots) {
      setSubmitError(`You can upload ${availableSlots} more photo(s). Maximum is 10.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const encodedPhotos = await Promise.all(
        imageFiles.map(
          (file) =>
            new Promise<AdminPropertyPhotoUpload>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  dataUrl: String(reader.result ?? ''),
                  fileName: file.name,
                  mimeType: file.type,
                  fileSize: file.size,
                });
              };
              reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...encodedPhotos],
      }));

      setSubmitError(null);
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to process selected photos.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (photoIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, index) => index !== photoIndex),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (
        !formData.propertyname ||
        !formData.projectid ||
        !formData.propertylistingstatusid ||
        !formData.location_region ||
        !formData.location_province ||
        !formData.location_city ||
        !formData.location_barangay ||
        !formData.location_street ||
        !formData.lot_size
      ) {
        throw new Error('Please fill all required fields');
      }

      const payload: PropertyPayload = {
        propertyname: formData.propertyname,
        projectid: Number(formData.projectid),
        sellerclientid: formData.sellerclientid,
        propertytypeid: formData.propertytypeid,
        propertylistingstatusid: Number(formData.propertylistingstatusid),
        propertyownershipid: formData.propertyownershipid,
      };

      const detailPayload: PropertyDetailPayload = {
        location_island: formData.location_island,
        location_region: formData.location_region,
        location_province: formData.location_province,
        location_city: formData.location_city,
        location_barangay: formData.location_barangay,
        location_street: formData.location_street,
        lot_size: Number(formData.lot_size),
        urbanreflottypeid: formData.urbanreflottypeid,
        commercialreflottypeid: formData.commercialreflottypeid,
        industrialreflottypeid: formData.industrialreflottypeid,
        detail_istitled: formData.titled,
        detail_isoverlooking: formData.overlooking,
        detail_topography: formData.topography,
        utilities_water: formData.utilities_water,
        utilities_electricity: formData.utilities_electricity,
        utilities_sim: formData.utilities_sim,
        utilities_internet: formData.utilities_internet,
        access_motorcycle: formData.access_motorcycle,
        access_car: formData.access_car,
        access_truck: formData.access_truck,
        access_road: formData.access_road,
        access_cemented_road: formData.access_cemented_road,
        access_rough_road: formData.access_rough_road,
        facilities_gated: formData.facilities_gated,
        facilities_security: formData.facilities_security,
        facilities_clubhouse: formData.facilities_clubhouse,
        facilities_sports: formData.facilities_sports,
        facilities_parks: formData.facilities_parks,
        agriculturalreflottypeids: formData.agriculturalreflottypeids,
        agri_hasfarmhouse: formData.agri_hasfarmhouse,
        agri_hasbarns: formData.agri_hasbarns,
        agri_haswarehousestorage: formData.agri_haswarehousestorage,
        agri_hasriversstreams: formData.agri_hasriversstreams,
        agri_hasirrigationcanal: formData.agri_hasirrigationcanal,
        agri_haslakelagoon: formData.agri_haslakelagoon,
        comm_hasparking: formData.comm_hasparking,
        comm_hasloadingbay: formData.comm_hasloadingbay,
        comm_haselevator: formData.comm_haselevator,
        comm_hasfireprotection: formData.comm_hasfireprotection,
        comm_hassecurity: formData.comm_hassecurity,
        comm_hascctv: formData.comm_hascctv,
        ind_hasthreephasepower: formData.ind_hasthreephasepower,
        ind_hasheavyhaulroadaccess: formData.ind_hasheavyhaulroadaccess,
        ind_hasloadingdock: formData.ind_hasloadingdock,
        ind_haswarehouse: formData.ind_haswarehouse,
        ind_hasfireprotection: formData.ind_hasfireprotection,
        ind_hashazmatzone: formData.ind_hashazmatzone,
        ind_hastruckaccess: formData.ind_hastruckaccess,
      };

      const lookup = {
        projects,
        sellers,
        propertyTypes,
        listingStatuses,
      };

      if (isEditMode && id) {
        await updateAdminProperty(Number(id), payload, detailPayload, lookup, formData.photos);
      } else {
        await createAdminProperty(payload, detailPayload, lookup, formData.photos);
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error('Property submission error:', error);
      setSubmitError(error?.message || 'Failed to save property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-gray-900 mb-4">
              {isEditMode ? 'Property Updated' : 'Property Added Successfully'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isEditMode
                ? 'The property has been updated successfully.'
                : 'The property has been added to the system.'}
            </p>
            <Link
              to="/admin/properties"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Properties
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-green-600 text-white py-12 -mx-8 -mt-8 mb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/properties"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
          <h1 className="mb-4">{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
          <p className="text-green-100 text-lg">
            {isEditMode
              ? 'Update the property details below.'
              : 'Fill in the details to add a new property to the system.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {isLoadingOptions && (
            <p className="text-sm text-gray-500">Loading form options...</p>
          )}

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">{submitError}</p>
            </div>
          )}

          {/* PROPERTY IDENTITY */}
          <section>
            <h2 className="text-gray-900 mb-6 text-xl font-semibold">Property Identity</h2>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Property Name *
              </label>
              <input
                type="text"
                name="propertyname"
                value={formData.propertyname}
                onChange={handleChange}
                required
                placeholder="e.g., Beachfront Farmland, Metro Residential Lot"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  name="projectid"
                  value={formData.projectid || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.projectid} value={project.projectid}>
                      {project.projectname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  name="propertytypeid"
                  value={formData.propertytypeid || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      propertytypeid: e.target.value ? Number(e.target.value) : null,
                      lotType: '',
                      urbanreflottypeid: null,
                      commercialreflottypeid: null,
                      industrialreflottypeid: null,
                      titled: false,
                      overlooking: false,
                      topography: '',
                      amenities: [],
                    }))
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Property Type</option>
                  {propertyTypes.map((type) => (
                    <option key={type.propertytypeid} value={type.propertytypeid}>
                      {type.propertytypename}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPropertyType && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  isAgriculturalType
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Selected Type
                </p>
                <p
                  className={`text-lg font-semibold mt-1 ${
                    isAgriculturalType ? 'text-blue-700' : 'text-amber-700'
                  }`}
                >
                  {selectedPropertyType.propertytypename}
                </p>
              </div>
            )}
          </section>

          {/* PROPERTY CLASSIFICATION */}
          <FormSection title="Property Classification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Seller / Landowner
                </label>
                <select
                  name="sellerclientid"
                  value={formData.sellerclientid || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sellerclientid: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">No seller linked</option>
                  {sellers.map((seller) => (
                    <option key={seller.clientid} value={seller.clientid}>
                      {seller.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Listing Status *
                </label>
                <select
                  name="propertylistingstatusid"
                  value={formData.propertylistingstatusid || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  {listingStatuses.map((status) => (
                    <option
                      key={status.propertylistingstatusid}
                      value={status.propertylistingstatusid}
                    >
                      {status.propertylistingstatusname}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FormSection>

          {/* LOCATION DETAILS */}
          <FormSection title="Location Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Island *
                </label>
                <select
                  name="location_island"
                  value={formData.location_island}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Luzon">Luzon</option>
                  <option value="Visayas">Visayas</option>
                  <option value="Mindanao">Mindanao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Region *
                </label>
                <input
                  type="text"
                  name="location_region"
                  value={formData.location_region}
                  onChange={handleChange}
                  required
                  placeholder="e.g., NCR, CALABARZON"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Province *
                </label>
                <input
                  type="text"
                  name="location_province"
                  value={formData.location_province}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Laguna"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="location_city"
                  value={formData.location_city}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Calamba"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Barangay *
                </label>
                <input
                  type="text"
                  name="location_barangay"
                  value={formData.location_barangay}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Parian"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Street *
                </label>
                <input
                  type="text"
                  name="location_street"
                  value={formData.location_street}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Main Road"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Lot Size (sqm) *
                </label>
                <input
                  type="number"
                  name="lot_size"
                  min={0}
                  value={formData.lot_size || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </FormSection>

          {/* LOT TYPE & DETAILS */}
          {formData.propertytypeid && (
            <>
              {isAgriculturalType ? (
                <section className="border border-green-200 bg-green-50 rounded-lg p-6 mt-6 transition-all duration-300">
                  <h3 className="text-gray-900 font-semibold mb-6">Agricultural Property Details</h3>

                  <div>
                    <label className="block text-sm text-gray-700 mb-3">
                      Agricultural Lot Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {agriculturalLotTypes.map((lotType) => (
                        <label
                          key={lotType.agriculturalreflottypeid}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.agriculturalreflottypeids.includes(
                              lotType.agriculturalreflottypeid
                            )}
                            onChange={() =>
                              toggleAgriculturalLotType(lotType.agriculturalreflottypeid)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700">
                            {lotType.agriculturalreflottypename}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm text-gray-700 mb-3">
                      Facilities & Amenities
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agri_hasbarns}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, agri_hasbarns: e.target.checked }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">Barns</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agri_hasfarmhouse}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, agri_hasfarmhouse: e.target.checked }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">Farmhouse</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agri_hasirrigationcanal}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, agri_hasirrigationcanal: e.target.checked }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">Irrigation / Canal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agri_haslakelagoon}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, agri_haslakelagoon: e.target.checked }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">Lake / Lagoon</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agri_hasriversstreams}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, agri_hasriversstreams: e.target.checked }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">Rivers / Streams</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agri_haswarehousestorage}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, agri_haswarehousestorage: e.target.checked }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">Warehouse / Storage</span>
                      </label>
                    </div>
                  </div>
                </section>
              ) : isCommercialType ? (
                <section className="border border-orange-200 bg-orange-50 rounded-lg p-6 mt-6 transition-all duration-300">
                  <h3 className="text-gray-900 font-semibold mb-6">Commercial Property Details</h3>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Commercial Lot Type
                    </label>
                    <select
                      name="lotType"
                      value={formData.lotType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lotType: e.target.value,
                          commercialreflottypeid: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select lot type...</option>
                      {commercialLotTypes.map((lotType) => (
                        <option
                          key={lotType.commercialreflottypeid}
                          value={lotType.commercialreflottypeid}
                        >
                          {lotType.commercialreflottypename}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6">
                    <CheckboxGrid
                      label="Facilities & Amenities"
                      options={['Parking', 'Loading Bay', 'Elevator', 'Fire Protection', 'Security', 'CCTV']}
                      values={formData.amenities}
                      onToggle={handleAmenitiesToggle}
                    />
                  </div>

                  <div className="mt-6">
                    <AdminPropertyRadioGroup
                      label="Land Titled?"
                      name="titled"
                      value={formData.titled}
                      options={['Yes', 'No']}
                      onChange={handleRadioChange('titled')}
                    />
                  </div>

                  <div className="mt-6">
                    <AdminPropertyRadioGroup
                      label="Overlooking?"
                      name="overlooking"
                      value={formData.overlooking}
                      options={['Yes', 'No']}
                      onChange={handleRadioChange('overlooking')}
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm text-gray-700 mb-2">
                      Topography
                    </label>
                    <select
                      name="topography"
                      value={formData.topography}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select topography...</option>
                      <option value="Flat">Flat</option>
                      <option value="Rolling">Rolling</option>
                      <option value="Sloping">Sloping</option>
                      <option value="Mountainous">Mountainous</option>
                    </select>
                  </div>
                </section>
              ) : isIndustrialType ? (
                <section className="border border-gray-300 bg-gray-50 rounded-lg p-6 mt-6 transition-all duration-300">
                  <h3 className="text-gray-900 font-semibold mb-6">Industrial Property Details</h3>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Industrial Lot Type
                    </label>
                    <select
                      name="lotType"
                      value={formData.lotType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lotType: e.target.value,
                          industrialreflottypeid: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Select lot type...</option>
                      {industrialLotTypes.map((lotType) => (
                        <option
                          key={lotType.industrialreflottypeid}
                          value={lotType.industrialreflottypeid}
                        >
                          {lotType.industrialreflottypename}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6">
                    <CheckboxGrid
                      label="Facilities & Amenities"
                      options={['Three-Phase Power', 'Heavy Haul Road Access', 'Loading Dock', 'Warehouse', 'Fire Protection', 'Hazmat Zone', 'Truck Access']}
                      values={formData.amenities}
                      onToggle={handleAmenitiesToggle}
                    />
                  </div>

                  <div className="mt-6">
                    <AdminPropertyRadioGroup
                      label="Land Titled?"
                      name="titled"
                      value={formData.titled}
                      options={['Yes', 'No']}
                      onChange={handleRadioChange('titled')}
                    />
                  </div>

                  <div className="mt-6">
                    <AdminPropertyRadioGroup
                      label="Overlooking?"
                      name="overlooking"
                      value={formData.overlooking}
                      options={['Yes', 'No']}
                      onChange={handleRadioChange('overlooking')}
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm text-gray-700 mb-2">
                      Topography
                    </label>
                    <select
                      name="topography"
                      value={formData.topography}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Select topography...</option>
                      <option value="Flat">Flat</option>
                      <option value="Rolling">Rolling</option>
                      <option value="Sloping">Sloping</option>
                      <option value="Mountainous">Mountainous</option>
                    </select>
                  </div>
                </section>
              ) : isUrbanType ? (
                <section className="border border-blue-200 bg-blue-50 rounded-lg p-6 mt-6 transition-all duration-300">
                  <h3 className="text-gray-900 font-semibold mb-6">Urban Property Details</h3>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Urban Lot Type
                    </label>
                    <select
                      name="lotType"
                      value={formData.lotType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lotType: e.target.value,
                          urbanreflottypeid: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select lot type...</option>
                      {urbanLotTypes.map((lotType) => (
                        <option key={lotType.urbanreflottypeid} value={lotType.urbanreflottypeid}>
                          {lotType.urbanreflottypename}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6">
                    <CheckboxGrid
                      label="Facilities & Amenities"
                      options={['Gated', 'Security', 'Clubhouse / Function Hall', 'Sports & Fitness Center', 'Parks & Playgrounds']}
                      values={formData.amenities}
                      onToggle={handleAmenitiesToggle}
                    />
                  </div>
                </section>
              ) : null}
            </>
          )}

          {/* UTILITIES */}
          <FormSection title="Property Utilities">
            <AdminPropertyRadioGroup
              label="Water"
              name="utilitiesWater"
              value={formData.utilities_water}
              options={['Yes', 'No']}
              onChange={handleRadioChange('utilities_water')}
              required
            />

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="Electricity"
                name="utilitiesElectricity"
                value={formData.utilities_electricity}
                options={['Yes', 'No']}
                onChange={handleRadioChange('utilities_electricity')}
                required
              />
            </div>

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="SIM Network"
                name="utilitiesSIM"
                value={formData.utilities_sim}
                options={['Yes', 'No']}
                onChange={handleRadioChange('utilities_sim')}
                required
              />
            </div>

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="Internet"
                name="utilitiesInternet"
                value={formData.utilities_internet}
                options={['Yes', 'No']}
                onChange={handleRadioChange('utilities_internet')}
                required
              />
            </div>
          </FormSection>

          {/* ACCESSIBILITY */}
          <FormSection title="Property Accessibility & Vicinity">
            <AdminPropertyRadioGroup
              label="Accessible by Motorcycle"
              name="accessMotorcycle"
              value={formData.access_motorcycle}
              options={['Yes', 'No']}
              onChange={handleRadioChange('access_motorcycle')}
              required
            />

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="Accessible by Car"
                name="accessCar"
                value={formData.access_car}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_car')}
                required
              />
            </div>

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="Accessible by Truck"
                name="accessTruck"
                value={formData.access_truck}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_truck')}
                required
              />
            </div>

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="Has Access Road"
                name="accessRoad"
                value={formData.access_road}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_road')}
                required
              />
            </div>

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="Has Cemented Road"
                name="accessCementedRoad"
                value={formData.access_cemented_road}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_cemented_road')}
                required
              />
            </div>

            <div className="mt-6">
              <AdminPropertyRadioGroup
                label="Has Rough Road"
                name="accessRoughRoad"
                value={formData.access_rough_road}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_rough_road')}
                required
              />
            </div>
          </FormSection>

          {/* PHOTOS */}
          <FormSection title="Property Photos">
            <div className="border border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">
                Upload up to 10 property images. {isEditMode ? 'New uploads will replace existing photos.' : 'Accepted formats: JPG, PNG, WebP'}
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Choose Photos</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            {formData.photos.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div
                    key={`${photo.fileName}-${index}`}
                    className="relative rounded-lg border border-gray-200 overflow-hidden bg-white"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.fileName}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          {/* SUBMIT */}
          <section className="border-t border-gray-200 pt-6">
            {submitError && (
              <p className="text-sm text-red-600 mb-3">{submitError}</p>
            )}
            <div className="flex gap-3">
              <Link
                to="/admin/properties"
                className="flex-1 px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors text-center text-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingOptions}
                className={`flex-1 px-6 py-4 rounded-lg text-white font-medium transition-colors ${
                  isSubmitting || isLoadingOptions
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isEditMode
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Property' : 'Add Property'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </AdminLayout>
  );
}
