import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for reaching out! We will contact you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567'
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'info@aldc.com',
      link: 'mailto:info@aldc.com'
    },
    {
      icon: MapPin,
      title: 'Address',
      value: '123 Real Estate Ave, City, State 12345',
      link: '#'
    },
    {
      icon: Clock,
      title: 'Office Hours',
      value: 'Mon-Fri: 9 AM - 6 PM, Sat: 10 AM - 4 PM',
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Get In Touch</h1>
          <p className="text-xl text-gray-700">
            Have questions? We're here to help. Reach out to our team anytime.
          </p>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                  <a 
                    href={info.link}
                    className="text-gray-700 hover:text-green-600 transition-colors"
                  >
                    {info.value}
                  </a>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
             <Link 
              to="/consultation" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Request Consultation
            </Link>
          </Card>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Find Us</h2>
          <div className="bg-gray-300 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-700 text-lg">Map integration coming soon</p>
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </div>
  );
}
