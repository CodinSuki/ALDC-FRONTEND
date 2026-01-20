import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import FormInput from '../components/ui/FormInput';
import FormTextarea from '../components/ui/FormTextarea';
import FormSection from '../components/ui/FormSection';
import { submitBuyerInquiry } from '../services/buyerInquiryService';

export default function BuyerInterestForm() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state tied to a specific property
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactEmail: '',
    contactNumber: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.contactEmail || !formData.contactNumber) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }
    
    if (!propertyId) {
      setError('Property ID is missing. Please try again.');
      setIsLoading(false);
      return;
    }
    
    // Prepare payload following database structure
    const payload = {
      client: {
        first_name: formData.firstName,
        middle_name: formData.middleName || '',
        last_name: formData.lastName,
        contact_email: formData.contactEmail,
        contact_number: formData.contactNumber,
        role: 'buyer' as const,
        source: 'buyer_form' as const,
      },
      inquiry: {
        property_id: propertyId,
        message: formData.message,
        status: 'new' as const,
      },
    };
    
    try {
      const result = await submitBuyerInquiry(payload);
      
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || result.message || 'Failed to submit inquiry');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <div className="flex-1 bg-gray-50 flex items-center justify-center py-12">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-gray-900 mb-4">Interest Registered!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for your interest in this property. One of our expert brokers will contact you shortly to discuss next steps and arrange a site visit.
              </p>
              <Link 
                to="/properties" 
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Back to Listings
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      {/* Page Header */}
      <div className="bg-green-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={`/property/${propertyId}`} className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Property
          </Link>
          <h1 className="mb-4">Inquire About This Property</h1>
          <p className="text-green-100 text-lg">
            Share your contact information and we'll arrange a consultation with our expert brokers.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-red-900 font-semibold">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <FormSection title="Your Contact Information">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First Name"
                />
                <FormInput
                  label="Middle Name"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Middle Name"
                />
                <FormInput
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last Name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormInput
                  label="Email Address"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                />
                <FormInput
                  label="Contact Number"
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  placeholder="+63 XXX XXX XXXX"
                />
              </div>

            </FormSection>

            {/* Additional Notes */}
            <section className="border-t border-gray-200 pt-6">
              <FormTextarea
                label="Additional Notes or Questions (Optional)"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us about your interest in this property, preferred viewing times, or any specific questions..."
              />
            </section>

            {/* Submit */}
            <section className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Interest'}
              </button>
              <p className="text-sm text-gray-500 text-center mt-4">
                By submitting this form, you agree to be contacted by our team regarding this property inquiry.
              </p>
            </section>

          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
