import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartPie, TrendingUp, FileText } from 'lucide-react';
import { DocumentStats as DocumentStatsType, getDocumentStats } from '../lib/api';

const DocumentStats = () => {
  const [stats, setStats] = useState<DocumentStatsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDocumentStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch document statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Calculate document type distribution
  const typeDistribution = stats.reduce((acc, doc) => {
    acc[doc.classification] = (acc[doc.classification] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const distributionData = Object.entries(typeDistribution).map(([classification, count]) => ({
    classification,
    count,
  }));

  // Calculate average confidence
  const avgConfidence = stats.length
    ? stats.reduce((sum, doc) => sum + doc.confidence, 0) / stats.length
    : 0;

  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
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