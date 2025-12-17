import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';
import api from '../utils/api';
import EventCard from './EventCard';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('future');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (dateFilter === 'future') params.append('future', 'true');
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      
      const { data } = await api.get(`/events?${params.toString()}`);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, fromDate, toDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
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
          Discover Events
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Find and join amazing events happening around you
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-lg pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-12 sm:pr-4 py-2.5 sm:py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base shadow-sm"
              />
              {/* Search Button Inside Input - Mobile */}
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 sm:hidden p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center shadow-md hover:shadow-lg"
                aria-label="Search"
              >
                <FiSearch className="text-base" />
              </button>
            </div>
            {/* Search Button Outside - Desktop */}
            <button
              type="submit"
              className="hidden sm:flex sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm sm:text-base font-medium items-center justify-center shadow-md hover:shadow-lg"
            >
              <span>Search</span>
            </button>
          </div>

          {/* Filter Toggle Button - Mobile */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm"
          >
            <span className="flex items-center">
              <FiFilter className="mr-2" />
              Filters
            </span>
            <FiCalendar className={showFilters ? 'rotate-180' : ''} />
          </button>

          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-4`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Date Filter:
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                >
                  <option value="future">Upcoming</option>
                  <option value="all">All Events</option>
                </select>
              </div>

              {dateFilter === 'all' && (
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Date:
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To Date:
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <FiSearch className="mx-auto text-4xl sm:text-5xl text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            No events found. Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} onUpdate={fetchEvents} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
