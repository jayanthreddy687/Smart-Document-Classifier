import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartPie, TrendingUp, FileText } from 'lucide-react';
import { DocumentStats as DocumentStatsType, getDocumentStats } from '../lib/api';

const DocumentStats = () => {
  const [stats, setStats] = useState<DocumentStatsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDocumentStats();
        
        // Validate data format
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from server');
        }

        // Validate each stat entry
        const validStats = data.filter(stat => {
          return (
            typeof stat.classification === 'string' &&
            typeof stat.confidence === 'number' &&
            !isNaN(stat.confidence) &&
            stat.confidence >= 0 &&
            stat.confidence <= 100
          );
        });

        if (validStats.length === 0 && data.length > 0) {
          throw new Error('No valid statistics data available');
        }

        setStats(validStats);
        setRetryCount(0);
      } catch (err: any) {
        let errorMessage = 'Failed to fetch document statistics';
        
        if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('Invalid data format')) {
          errorMessage = 'Server returned invalid data format. Please try again later.';
        } else if (err.message.includes('No valid statistics')) {
          errorMessage = 'No valid statistics data available.';
        }

        setError(errorMessage);
        console.error('Error fetching stats:', err);

        // Implement retry logic
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchStats(), 2000 * retryCount); // Exponential backoff
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Calculate document type distribution with error handling
  const typeDistribution = useMemo(() => {
    try {
      return stats.reduce((acc, doc) => {
        if (doc.classification) {
          acc[doc.classification] = (acc[doc.classification] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    } catch (err) {
      console.error('Error calculating type distribution:', err);
      return {};
    }
  }, [stats]);

  const distributionData = useMemo(() => {
    try {
      return Object.entries(typeDistribution).map(([classification, count]) => ({
        classification,
        count,
      }));
    } catch (err) {
      console.error('Error formatting distribution data:', err);
      return [];
    }
  }, [typeDistribution]);

  // Calculate average confidence with error handling
  const avgConfidence = useMemo(() => {
    try {
      if (stats.length === 0) return 0;
      const validStats = stats.filter(doc => !isNaN(doc.confidence));
      if (validStats.length === 0) return 0;
      return validStats.reduce((sum, doc) => sum + doc.confidence, 0) / validStats.length;
    } catch (err) {
      console.error('Error calculating average confidence:', err);
      return 0;
    }
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2">Loading statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-500 mb-2">{error}</div>
        {retryCount < MAX_RETRIES ? (
          <p className="text-sm text-gray-500">Retrying... ({retryCount}/{MAX_RETRIES})</p>
        ) : (
          <button
            onClick={() => {
              setRetryCount(0);
              fetchStats();
            }}
            className="text-purple-600 hover:text-purple-800 underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Summary Cards */}
      <Card className="bg-white/50 backdrop-blur-sm border border-purple-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-800">
            Total Documents
          </CardTitle>
          <FileText className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.length}</div>
          <p className="text-xs text-gray-500">Documents processed</p>
        </CardContent>
      </Card>

      <Card className="bg-white/50 backdrop-blur-sm border border-purple-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-800">
            Average Confidence
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {avgConfidence.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500">Across all documents</p>
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card className="md:col-span-2 bg-white/50 backdrop-blur-sm border border-purple-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-800">
            Document Distribution
          </CardTitle>
          <ChartPie className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <XAxis 
                  dataKey="classification" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="#8B5CF6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentStats; 