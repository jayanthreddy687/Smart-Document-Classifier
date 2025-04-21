import React, { useEffect, useState } from 'react';
import { FileText, FileCode, Briefcase, Scale, GraduationCap, Files } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCategories } from '@/lib/api';
import { toast } from 'sonner';

interface ClassificationResultProps {
  category: string;
  allScores: Record<string, number>;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Technical Documentation":
      return <FileCode className="w-6 h-6" />;
    case "Business Proposal":
      return <Briefcase className="w-6 h-6" />;
    case "Legal Document":
      return <Scale className="w-6 h-6" />;
    case "Academic Paper":
      return <GraduationCap className="w-6 h-6" />;
    case "General Article":
      return <FileText className="w-6 h-6" />;
    default:
      return <Files className="w-6 h-6" />;
  }
};

const ClassificationResult = ({ category, allScores }: ClassificationResultProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load document categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Sort categories by confidence score in descending order
  const sortedCategories = [...categories].sort((a, b) => {
    const scoreA = allScores[a] || 0;
    const scoreB = allScores[b] || 0;
    return scoreB - scoreA;
  });

  if (isLoading) {
    return (
      <Card className="bg-white/50 backdrop-blur-sm border border-purple-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">Document Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading categories...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/50 backdrop-blur-sm border border-purple-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">Document Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                {getCategoryIcon(category)}
              </div>
              <div className="flex flex-row items-center space-x-2 ">
                <p className="text-lg text-gray-500">Predicated Category :</p>
                <p className="text-lg font-medium text-gray-800">{category}</p>
              </div>
            </div>

            <div className="space-y-4">
              {sortedCategories.map((cat) => {
                const confidenceValue = allScores[cat] || 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat)}
                        <p className="text-sm text-gray-600">{cat}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {(confidenceValue * 100).toFixed(2)}%
                      </p>
                    </div>
                    <Progress 
                      value={confidenceValue * 100} 
                      className='h-2 bg-purple-100' 
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassificationResult;
