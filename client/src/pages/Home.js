import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  GiftIcon, 
  TrophyIcon, 
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'Earn Robux',
      description: 'Complete offers, surveys, and tasks to earn Robux rewards.',
    },
    {
      icon: GiftIcon,
      title: 'Daily Rewards',
      description: 'Get bonus Robux for logging in daily and staying active.',
    },
    {
      icon: TrophyIcon,
      title: 'Leaderboards',
      description: 'Compete with other users and climb the earnings leaderboard.',
    },
    {
      icon: UserGroupIcon,
      title: 'Referral System',
      description: 'Invite friends and earn 10% of their earnings as bonus.',
    },
  ];

  const stats = [
    { label: 'Total Users', value: '50,000+' },
    { label: 'Robux Earned', value: '2.5M+' },
    { label: 'Active Offers', value: '500+' },
    { label: 'Withdrawals', value: '25,000+' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 bg-roblox-pattern opacity-10"></div>
        <div className="relative container-custom py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Earn <span className="text-gradient-robux bg-clip-text text-transparent bg-gradient-to-r from-robux-300 to-robux-100">Free Robux</span>
              <br />Every Day
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Complete offers, participate in surveys, and invite friends to earn Robux. 
              The most trusted and secure platform for earning Roblox rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="btn-robux btn-lg shadow-glow-robux"
                  >
                    Start Earning Now
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="btn btn-lg bg-white/10 text-white hover:bg-white/20 border-white/20"
                  >
                    View Leaderboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/offers"
                    className="btn-robux btn-lg shadow-glow-robux"
                  >
                    Browse Offers
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn btn-lg bg-white/10 text-white hover:bg-white/20 border-white/20"
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose RobuxRewards?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the most reliable and secure way to earn free Robux with multiple earning methods.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 text-center hover:shadow-medium transition-all duration-200">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Start earning Robux in just 3 simple steps
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sign Up & Verify
              </h3>
              <p className="text-gray-600">
                Create your account and verify your Roblox username to get started.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Complete Offers
              </h3>
              <p className="text-gray-600">
                Browse and complete offers, surveys, and tasks to earn Robux rewards.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Withdraw Robux
              </h3>
              <p className="text-gray-600">
                Request withdrawals through gamepass purchases when you reach minimum balance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Trusted & Secure
            </h2>
            <p className="text-xl text-gray-300">
              Your account security and privacy are our top priorities
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-success-400" />
              <h3 className="text-lg font-semibold text-white mb-2">
                SSL Encrypted
              </h3>
              <p className="text-gray-300">
                All data is protected with 256-bit SSL encryption
              </p>
            </div>
            
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-success-400" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Account Safe
              </h3>
              <p className="text-gray-300">
                We never ask for your Roblox password or account details
              </p>
            </div>
            
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-success-400" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Fast Payouts
              </h3>
              <p className="text-gray-300">
                Withdrawals are processed within 24-48 hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-robux-500 to-robux-600">
          <div className="container-custom text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-robux-100 mb-8">
              Join thousands of users who are already earning free Robux daily
            </p>
            <Link
              to="/register"
              className="btn btn-lg bg-white text-robux-600 hover:bg-gray-100 shadow-glow"
            >
              Create Free Account
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;