import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { BookOpen, Lightbulb, TrendingUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Resources() {
  const resources = [
    {
      icon: FileText,
      title: 'Buying Guide',
      description: 'A comprehensive guide for first-time homebuyers covering everything from pre-approval to closing.',
      link: '#'
    },
    {
      icon: TrendingUp,
      title: 'Market Insights',
      description: 'Stay informed with our latest market trends, price analysis, and investment opportunities.',
      link: '#'
    },
    {
      icon: BookOpen,
      title: 'Blog',
      description: 'Read expert articles on real estate tips, home improvement, and investment strategies.',
      link: '#'
    },
    {
      icon: Lightbulb,
      title: 'Selling Tips',
      description: 'Learn how to prepare your home for sale and maximize your property value.',
      link: '#'
    }
  ];

  const articles = [
    {
      id: 1,
      title: '10 Tips for First-Time Home Buyers',
      category: 'Buying Guide',
      date: 'Feb 1, 2026',
      excerpt: 'Navigate the homebuying process with confidence. Learn essential tips to help you make informed decisions.',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'Market Trends: What to Expect in 2026',
      category: 'Market Insights',
      date: 'Jan 28, 2026',
      excerpt: 'Explore the latest real estate market trends and what they mean for buyers and sellers.',
      readTime: '7 min read'
    },
    {
      id: 3,
      title: 'How to Stage Your Home for Sale',
      category: 'Selling Tips',
      date: 'Jan 25, 2026',
      excerpt: 'Discover proven staging techniques that can help you attract more buyers and get better offers.',
      readTime: '6 min read'
    },
    {
      id: 4,
      title: 'Understanding Property Investment Returns',
      category: 'Investment Guide',
      date: 'Jan 20, 2026',
      excerpt: 'Learn how to evaluate investment properties and calculate potential returns on your investment.',
      readTime: '8 min read'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Resources & Guides</h1>
          <p className="text-xl text-gray-700">
            Learn, grow, and make informed decisions with our expert resources
          </p>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <Icon className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-700 text-sm mb-4">{resource.description}</p>
                  <a href={resource.link} className="text-green-600 hover:text-green-700 font-semibold text-sm">
                    Learn More →
                  </a>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Latest Articles</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {articles.map((article) => (
                <Card key={article.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500">{article.date}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{article.title}</h3>
                <p className="text-gray-700 mb-4">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{article.readTime}</span>
                  <a href="#" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                    Read More →
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center bg-green-600 rounded-lg p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">More Questions?</h2>
          <p className="text-green-100 mb-8">
            Check out our FAQs or get in touch with our team for personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/faqs">
              <Button className="w-full sm:w-auto bg-white text-green-600 hover:bg-green-50">
                View FAQs
              </Button>
            </Link>
            <Link to="/contact">
              <Button className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </div>
  );
}
