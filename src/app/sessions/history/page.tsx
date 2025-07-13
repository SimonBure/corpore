'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard } from '../../components/LayoutDashboard';
import { sessionApi } from '@/lib/api';
import { Session } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'templates'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await sessionApi.getAll();
        
        if (response.success && response.data) {
          setSessions(response.data);
          setFilteredSessions(response.data);
        }
      } catch (err) {
        setError('Failed to load sessions');
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    let filtered = sessions;

    // Apply filter
    switch (filter) {
      case 'completed':
        filtered = sessions.filter(session => session.completed && !session.isTemplate);
        break;
      case 'templates':
        filtered = sessions.filter(session => session.isTemplate);
        break;
      default:
        filtered = sessions;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, filter, searchTerm]);

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalVolume = (session: Session): number => {
    return session.sessionExercises.reduce((total, exercise) => {
      if (exercise.actualReps && exercise.weight) {
        const exerciseVolume = exercise.actualReps.reduce((sum, reps, index) => {
          const weight = exercise.weight?.[index] || 0;
          return sum + (reps * weight);
        }, 0);
        return total + exerciseVolume;
      }
      return total;
    }, 0);
  };

  const handleSessionClick = (session: Session) => {
    if (session.isTemplate) {
      // For templates, navigate to create new session page with this template
      router.push(`/session/new?template=${session.id}`);
    } else if (session.completed) {
      // For completed sessions, show completion page
      router.push(`/session/complete/${session.id}`);
    } else {
      // For incomplete sessions, navigate to execution
      router.push(`/session/execute/${session.id}`);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await sessionApi.delete(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (err) {
        console.error('Error deleting session:', err);
        alert('Failed to delete session');
      }
    }
  };

  if (loading) {
    return (
      <LayoutDashboard>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workout history...</p>
        </div>
      </LayoutDashboard>
    );
  }

  if (error) {
    return (
      <LayoutDashboard>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      {/* Header */}
      <header className="w-full flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Workout History</h1>
        <button
          onClick={() => router.push('/session/new')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Workout
        </button>
      </header>

      {/* Filters and Search */}
      <div className="w-full mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Filter Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed' 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({sessions.filter(s => s.completed && !s.isTemplate).length})
            </button>
            <button
              onClick={() => setFilter('templates')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'templates' 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Templates ({sessions.filter(s => s.isTemplate).length})
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="w-full">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start by creating your first workout session'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{session.title}</h3>
                      {session.isTemplate && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Template
                        </span>
                      )}
                      {session.completed && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <span>{formatDate(session.date)}</span>
                      <span>{session.sessionExercises.length} exercises</span>
                      {session.duration && (
                        <span>{formatDuration(session.duration)}</span>
                      )}
                      {session.completed && (
                        <span>{getTotalVolume(session).toFixed(0)} kg volume</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {session.sessionExercises.slice(0, 4).map((se, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {se.exercise?.name}
                        </span>
                      ))}
                      {session.sessionExercises.length > 4 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          +{session.sessionExercises.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete session"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutDashboard>
  );
}