import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  BarChart3, 
  RefreshCw, 
  MessageSquare,
  Tag,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { getAIFeedbackSummary } from '../lib/ai-analytics';

export const AIFeedbackAnalytics: React.FC = () => {
  const [feedback, setFeedback] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeedbackData();
  }, []);

  const loadFeedbackData = async () => {
    setIsLoading(true);
    try {
      const feedbackData = await getAIFeedbackSummary();
      setFeedback(feedbackData);
    } catch (error) {
      console.error('Error loading AI feedback:', error);
      toast.error('Failed to load feedback analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">AI Feedback Analytics</h2>
        </div>
        <button
          onClick={loadFeedbackData}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          disabled={isLoading}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : !feedback || feedback.totalFeedback === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback data yet</h3>
          <p className="text-gray-500 mb-4">
            Feedback data will appear here once users provide ratings on AI responses
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-3">Overall Rating</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold ${getRatingColor(feedback.averageRating)}`}>
                  {feedback.averageRating.toFixed(1)}
                </span>
                <div className="flex items-center">
                  {renderStars(feedback.averageRating)}
                </div>
              </div>
              <span className="text-sm text-blue-700">
                Based on {feedback.totalFeedback} ratings
              </span>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Rating Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">Positive</span>
                    <span className="text-sm text-gray-700">{feedback.positivePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${feedback.positivePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex items-center justify-center text-yellow-500">
                  <span className="text-lg">•</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">Neutral</span>
                    <span className="text-sm text-gray-700">{feedback.neutralPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${feedback.neutralPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ThumbsDown className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">Negative</span>
                    <span className="text-sm text-gray-700">{feedback.negativePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${feedback.negativePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          {feedback.topCategories && feedback.topCategories.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">Top Feedback Categories</h3>
              <div className="space-y-3">
                {feedback.topCategories.map((category: any, index: number) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700">{category.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${(category.count / feedback.totalFeedback) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">
                        {category.count}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};