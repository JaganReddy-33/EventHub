import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiUsers, FiPlus, FiSearch } from 'react-icons/fi';
import api from '../utils/api';
import EventCard from './EventCard';

const UserDashboard = () => {
  const [created, setCreated] = useState([]);
  const [attending, setAttending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/events/mine');
      setCreated(data.created || []);
      setAttending(data.attending || []);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          My Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Manage your events and track your RSVPs
        </p>
      </div>

      {/* Stats Cards - Mobile Friendly */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Created</p>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {created.length}
              </p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <FiCalendar className="text-blue-600 dark:text-blue-400 text-2xl sm:text-3xl" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Attending</p>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                {attending.length}
              </p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <FiUsers className="text-green-600 dark:text-green-400 text-2xl sm:text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Mobile Optimized */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('created')}
            className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex items-center ${
              activeTab === 'created'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FiCalendar className="mr-1.5 sm:mr-2" />
            Created ({created.length})
          </button>
          <button
            onClick={() => setActiveTab('attending')}
            className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex items-center ${
              activeTab === 'attending'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FiUsers className="mr-1.5 sm:mr-2" />
            Attending ({attending.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'created' ? (
        <div>
          {created.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 px-4">
              <FiCalendar className="mx-auto text-4xl sm:text-5xl text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4">
                You haven't created any events yet.
              </p>
              <Link
                to="/events/new"
                className="inline-flex items-center px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-medium"
              >
                <FiPlus className="mr-2" />
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {created.map((event) => (
                <EventCard key={event._id} event={event} onUpdate={fetchDashboard} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {attending.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 px-4">
              <FiUsers className="mx-auto text-4xl sm:text-5xl text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4">
                You're not attending any events yet.
              </p>
              <Link
                to="/"
                className="inline-flex items-center px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-medium"
              >
                <FiSearch className="mr-2" />
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {attending.map((event) => (
                <EventCard key={event._id} event={event} onUpdate={fetchDashboard} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
