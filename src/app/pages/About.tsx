import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Users, Target, Award, Heart } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To provide transparent, efficient, and accessible real estate solutions that connect buyers, sellers, and investors with their perfect properties.'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Our experienced agents and consultants bring years of industry expertise to help you navigate every step of your real estate journey.'
    },
    {
      icon: Award,
      title: 'Quality Service',
      description: 'We are committed to delivering exceptional service with integrity, professionalism, and attention to detail in every transaction.'
    },
    {
      icon: Heart,
      title: 'Client Focus',
      description: 'Your satisfaction is our priority. We listen to your needs and work tirelessly to find the perfect solution for you.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Active Properties' },
    { number: '1000+', label: 'Happy Clients' },
    { number: '50+', label: 'Expert Agents' },
    { number: '15+', label: 'Years Experience' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">About ALDC</h1>
          <p className="text-xl text-slate-600 mb-8">
            Transforming the real estate experience through innovation, integrity, and excellence
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-l-4 border-l-blue-600">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h2>
              <p className="text-slate-600 leading-relaxed">
                To be the leading real estate platform that empowers individuals and businesses to achieve their property aspirations through innovative technology, trusted guidance, and exceptional service.
              </p>
            </Card>

            <Card className="p-8 border-l-4 border-l-green-600">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed">
                To provide transparent, efficient, and accessible real estate solutions that connect buyers, sellers, and investors with their perfect properties while maintaining the highest standards of professionalism and integrity.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <Icon className="w-12 h-12 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{value.title}</h3>
                      <p className="text-slate-600">{value.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 px-4 bg-blue-600">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">Our Commitment</h2>
          <Card className="p-8 mb-8">
            <p className="text-slate-600 leading-relaxed mb-4">
              At ALDC, we understand that real estate is more than just buying and selling properties—it's about fulfilling dreams and building futures. Our team of dedicated professionals combines market expertise with personalized service to ensure every client receives the attention and guidance they deserve.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Whether you're a first-time homebuyer, a seasoned investor, or a property seller, we're here to guide you through every step of your real estate journey with transparency, professionalism, and a commitment to excellence.
            </p>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Get In Touch</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Ready to start your real estate journey? Connect with our team today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/consultation">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                Schedule Consultation
              </Button>
            </Link>
            <Link to="/properties">
              <Button variant="outline" className="w-full sm:w-auto">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
