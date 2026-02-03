import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FAQs() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqCategories = [
    {
      category: 'Buying',
      faqs: [
        {
          id: 1,
          question: 'What are the first steps in buying a property?',
          answer: 'The first steps include getting pre-approved for a mortgage, determining your budget, searching for properties that meet your criteria, and scheduling viewings. Our team can guide you through each step of the process.'
        },
        {
          id: 2,
          question: 'How long does the home buying process take?',
          answer: 'Typically, the home buying process takes 30-45 days from offer acceptance to closing. However, this timeline can vary depending on financing, inspections, and appraisals.'
        },
        {
          id: 3,
          question: 'What should I look for during a home inspection?',
          answer: 'During a home inspection, look for structural issues, roof condition, HVAC systems, plumbing, electrical systems, and any signs of water damage or pests. Your inspector will provide a detailed report.'
        }
      ]
    },
    {
      category: 'Selling',
      faqs: [
        {
          id: 4,
          question: 'How do I determine the right asking price for my home?',
          answer: 'We conduct a comparative market analysis (CMA) by comparing your home to similar properties recently sold in your area. This helps us establish a competitive asking price that maximizes your profit.'
        },
        {
          id: 5,
          question: 'How can I make my home more appealing to buyers?',
          answer: 'Consider home staging, fresh paint, landscaping improvements, and ensuring the property is clean and well-maintained. First impressions are crucial, and these improvements can significantly impact buyer interest.'
        },
        {
          id: 6,
          question: 'What fees are involved in selling a property?',
          answer: 'Selling fees typically include real estate commission (usually 5-6%), closing costs, title insurance, and any repairs needed. We can provide a detailed breakdown of all costs involved.'
        }
      ]
    },
    {
      category: 'Investment',
      faqs: [
        {
          id: 7,
          question: 'What makes a property a good investment?',
          answer: 'Good investment properties typically have strong location fundamentals, growth potential, positive cash flow, and are priced below market value. We analyze these factors to identify promising opportunities.'
        },
        {
          id: 8,
          question: 'How do I calculate ROI on a rental property?',
          answer: 'ROI is calculated by dividing annual net income by the total investment amount. Consider factors like rental income, expenses, taxes, and appreciation potential.'
        }
      ]
    },
    {
      category: 'General',
      faqs: [
        {
          id: 9,
          question: 'How can I schedule a consultation with your team?',
          answer: 'You can schedule a consultation through our website, call us directly, or visit our office. We offer flexible scheduling to accommodate your needs.'
        },
        {
          id: 10,
          question: 'Do you handle properties outside the local area?',
          answer: 'Yes, we have partnerships with agents in multiple markets. Contact us to discuss properties outside our primary service area.'
        }
      ]
    }
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-slate-600">
            Find answers to common questions about buying, selling, and investing in real estate
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.faqs.map((faq) => (
                  <Card 
                    key={faq.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-slate-900 text-left pr-4">
                        {faq.question}
                      </h3>
                      {expandedId === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                      )}
                    </button>
                    {expandedId === faq.id && (
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Didn't find your answer?</h2>
          <p className="text-slate-600 mb-8 text-lg">
            We're here to help! Get in touch with our team for personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                Contact Us
              </Button>
            </Link>
            <Link to="/resources">
              <Button variant="outline" className="w-full sm:w-auto">
                View Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
