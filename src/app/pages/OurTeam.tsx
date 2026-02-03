import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mail, Phone, Linkedin } from 'lucide-react';

export default function OurTeam() {
  const agents = [
    {
      id: 1,
      name: 'Sarah Johnson',
      title: 'Senior Real Estate Agent',
      specialization: 'Residential Sales',
      experience: '12 years',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      email: 'sarah@aldc.com',
      phone: '+1 (555) 123-4567'
    },
    {
      id: 2,
      name: 'Michael Chen',
      title: 'Commercial Property Specialist',
      specialization: 'Commercial & Investment',
      experience: '10 years',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      email: 'michael@aldc.com',
      phone: '+1 (555) 234-5678'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      title: 'Property Consultant',
      specialization: 'First-Time Buyers',
      experience: '8 years',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      email: 'emily@aldc.com',
      phone: '+1 (555) 345-6789'
    },
    {
      id: 4,
      name: 'David Martinez',
      title: 'Senior Agent & Team Lead',
      specialization: 'Luxury Properties',
      experience: '15 years',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      email: 'david@aldc.com',
      phone: '+1 (555) 456-7890'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">Our Expert Team</h1>
          <p className="text-xl text-slate-600">
            Meet the experienced professionals dedicated to making your real estate dreams a reality
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {agents.map((agent) => (
              <Card key={agent.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img 
                  src={agent.image} 
                  alt={agent.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{agent.name}</h3>
                  <p className="text-sm font-semibold text-blue-600 mb-2">{agent.title}</p>
                  
                  <div className="space-y-2 mb-4 text-sm text-slate-600">
                    <div>
                      <span className="font-semibold">Specialization:</span> {agent.specialization}
                    </div>
                    <div>
                      <span className="font-semibold">Experience:</span> {agent.experience}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <a 
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-600 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      {agent.email}
                    </a>
                    <a 
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-600 text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      {agent.phone}
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Connect with Our Team</h2>
          <p className="text-slate-600 mb-8">
            Ready to work with one of our agents? Schedule a consultation today to discuss your real estate goals.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
            Schedule Consultation
          </Button>
        </div>
      </section>
    </div>
  );
}
