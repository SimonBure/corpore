'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard } from "./components/LayoutDashboard";
import { ButtonPrimary } from "./components/ButtonPrimary";
import { StatsCard } from "./components/StatsCard";
import { ChartContainer } from '@/components/analytics/ChartContainer';
import { PhotoGallery } from '@/components/gallery/PhotoGallery';
import { sessionApi } from '@/lib/api';
import { Session } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'gallery'>('overview');

  useEffect(() => {
    const fetchRecentSessions = async () => {
      try {
        setLoading(true);
        const response = await sessionApi.getAll();
        
        if (response.success && response.data) {
          // Filter completed sessions and get the 5 most recent
          const completed = response.data
            .filter(session => session.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          setRecentSessions(completed);
        }
      } catch (err) {
        setError('Échec du chargement des sessions récentes');
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSessions();
  }, []);

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Statistiques */}
            <section className="w-[80%] mx-auto mb-8">
              <StatsCard sessions={recentSessions} />
            </section>

            {/* Recent Workouts */}
            <section className="w-[80%] mx-auto">
              <h2 className="text-xl font-semibold mb-4">Entraînements récents</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des entraînements récents...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : recentSessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="text-6xl mb-4">💪</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun entraînement pour le moment</h3>
                  <p className="text-gray-600 mb-6">Commencez votre parcours fitness aujourd'hui !</p>
                  <ButtonPrimary onClick={() => router.push("/session/new")}>
                    Créer Votre Premier Entraînement
                  </ButtonPrimary>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentSessions.map((session) => (
                    <div 
                      key={session.id} 
                      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/session/complete/${session.id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(session.date)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600 mb-3">
                        <span>{session.sessionExercises.length} exercices</span>
                        {session.duration && (
                          <span>{formatDuration(session.duration)}</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {session.sessionExercises.slice(0, 3).map((se, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {se.exercise?.name}
                          </span>
                        ))}
                        {session.sessionExercises.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{session.sessionExercises.length - 3} de plus
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        );
      
      case 'analytics':
        return (
          <section className="w-[90%] mx-auto space-y-8">
            <ChartContainer />
          </section>
        );
      
      case 'gallery':
        return (
          <section className="w-[90%] mx-auto">
            <PhotoGallery onPhotoSuccess={() => setActiveTab('gallery')} />
          </section>
        );
      
      default:
        return null;
    }
  };

  return (
    <LayoutDashboard>
      {/* En-tête */}
      <header className="w-full flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <ButtonPrimary onClick={() => router.push("/sessions/history")}>
            Historique des entraînements
          </ButtonPrimary>
          <ButtonPrimary onClick={() => router.push("/session/new")}>
            Nouvel entraînement
          </ButtonPrimary>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="w-full mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 justify-center">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Aperçu
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Galerie de l'Évolution
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </LayoutDashboard>
  );
}
