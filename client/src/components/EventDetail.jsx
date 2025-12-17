import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiUser, FiEdit, FiTrash2, FiX, FiLogIn } from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const fetchEvent = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data.event);
    } catch {
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRSVP = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const isFull = event.attendeeCount >= event.capacity;
    if (!event.isAttending && isFull) {
      setError('This event is fully booked');
      return;
    }

    try {
      const endpoint = event.isAttending ? 'cancel' : 'rsvp';
      await api.post(`/events/${id}/${endpoint}`);
      setError('');
      fetchEvent();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update RSVP');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
          <Link 
            to="/" 
            className="text-blue-600 dark:text-blue-400 mt-4 inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isFull = event.attendeeCount >= event.capacity;
  const isPast = new Date(event.dateTime) < new Date();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <Link
        to="/"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 sm:mb-6 inline-flex items-center transition-colors text-sm sm:text-base"
      >
        <FiArrowLeft className="mr-2" />
        Back to Events
      </Link>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md mb-4 sm:mb-6 text-sm sm:text-base">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {event.imageUrl && (
          <div className="h-48 sm:h-64 lg:h-96 overflow-hidden">
            <img
              src={getImageSrc(event.imageUrl)}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {event.title}
              </h1>
              {event.isOwner && (
                <span className="inline-block px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md shadow-sm">
                  Your Event
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="flex items-start">
              <FiCalendar className="text-blue-600 dark:text-blue-400 text-xl sm:text-2xl mr-3 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white break-words">
                  {format(new Date(event.dateTime), 'PPP p')}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <FiMapPin className="text-green-600 dark:text-green-400 text-xl sm:text-2xl mr-3 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Location</p>
                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white break-words">
                  {event.location}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <FiUsers className="text-purple-600 dark:text-purple-400 text-xl sm:text-2xl mr-3 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Attendees</p>
                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {event.attendeeCount} / {event.capacity}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(event.attendeeCount / event.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <FiUser className="text-orange-600 dark:text-orange-400 text-xl sm:text-2xl mr-3 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Created By</p>
                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white break-words">
                  {event.createdBy?.name || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Description
            </h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            {user && event.isOwner && (
              <>
                <Link
                  to={`/events/${id}/edit`}
                  className="flex items-center justify-center px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-medium"
                >
                  <FiEdit className="mr-2" />
                  Edit Event
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center px-4 sm:px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-medium"
                >
                  <FiTrash2 className="mr-2" />
                  Delete Event
                </button>
              </>
            )}

            {user && !event.isOwner && !isPast && (
              <button
                onClick={handleRSVP}
                disabled={isFull && !event.isAttending}
                className={`flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg text-sm sm:text-base ${
                  event.isAttending
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                    : isFull
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300 dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600 shadow-sm'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {event.isAttending ? (
                  <>
                    <FiX className="mr-2" />
                    Cancel RSVP
                  </>
                ) : isFull ? (
                  'Event Full'
                ) : (
                  'RSVP Now'
                )}
              </button>
            )}

            {!user && (
              <Link
                to="/login"
                className="flex items-center justify-center px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-medium"
              >
                <FiLogIn className="mr-2" />
                Login to RSVP
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
