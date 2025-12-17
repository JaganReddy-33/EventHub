import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiCalendar, FiMapPin, FiUsers, FiArrowRight, FiX } from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EventCard = ({ event, onUpdate }) => {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getImageSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    // Handle local /uploads URLs even when VITE_API_URL includes /api
    try {
      const base = new URL(API_URL);
      return `${base.origin}${url}`;
    } catch {
      return `http://localhost:5000${url}`;
    }
  };

  const handleRSVP = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('Please login to RSVP');
      return;
    }

    const isFull = event.attendeeCount >= event.capacity;
    if (!event.isAttending && isFull) {
      alert('This event is fully booked');
      return;
    }

    try {
      const endpoint = event.isAttending ? 'cancel' : 'rsvp';
      await api.post(`/events/${event._id}/${endpoint}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update RSVP';
      alert(errorMessage);
    }
  };

  const isFull = event.attendeeCount >= event.capacity;
  const isPast = new Date(event.dateTime) < new Date();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 h-full flex flex-col">
      {event.imageUrl && (
        <div className="h-40 sm:h-48 overflow-hidden">
          <img
            src={getImageSrc(event.imageUrl)}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 pr-2">
            {event.title}
          </h3>
          {event.isOwner && (
            <span className="px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md whitespace-nowrap shadow-sm">
              Your Event
            </span>
          )}
        </div>
        
        <p className="text-gray-700 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-grow">
          {event.description}
        </p>
        
        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          <div className="flex items-center text-xs sm:text-sm text-gray-700 dark:text-gray-400">
            <FiCalendar className="mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate">{format(new Date(event.dateTime), 'PPP p')}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-700 dark:text-gray-400">
            <FiMapPin className="mr-2 flex-shrink-0 text-green-600 dark:text-green-400" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-700 dark:text-gray-400">
            <FiUsers className="mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
            <span>{event.attendeeCount} / {event.capacity} attendees</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 mt-auto">
          <Link
            to={`/events/${event._id}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center sm:justify-start"
          >
            View Details
            <FiArrowRight className="ml-1 sm:ml-2" />
          </Link>
          
          {user && !event.isOwner && !isPast && (
            <button
              onClick={handleRSVP}
              disabled={isFull && !event.isAttending}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shadow-sm ${
                event.isAttending
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'
                  : isFull
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200 dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
              }`}
            >
              {event.isAttending ? (
                <>
                  <FiX className="inline mr-1" />
                  Cancel
                </>
              ) : isFull ? (
                'Full'
              ) : (
                'RSVP'
              )}
            </button>
          )}
        </div>
        
        {isFull && !event.isAttending && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400 text-center sm:text-left">
            Event is fully booked
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
