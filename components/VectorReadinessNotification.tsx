"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Info, Users, TrendingUp, Shield } from 'lucide-react';

interface VectorReadinessNotificationProps {
  vectorAnalysisReady: boolean;
  currentUsers?: number;
  targetUsers?: number;
  alternativeInsights?: any;
}

export default function VectorReadinessNotification({ 
  vectorAnalysisReady, 
  currentUsers = 0, 
  targetUsers = 1000,
  alternativeInsights 
}: VectorReadinessNotificationProps) {
  const progressPercentage = Math.min((currentUsers / targetUsers) * 100, 100);
  
  if (vectorAnalysisReady) {
    return (
      <Card className="bg-green-50 border-green-200 mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Competitive Analysis Available
              </h4>
              <p className="text-sm text-green-600 mt-1">
                We now have enough data to provide competitive insights and benchmarking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200 mb-6">
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800">
                Competitive Analysis Coming Soon
              </h4>
              <p className="text-sm text-blue-600 mt-1">
                We're building our database to provide you with competitive insights. 
                Your analysis will focus on individual assessment and market trends.
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-blue-700">Community Progress</span>
              </div>
              <span className="text-blue-600 font-medium">
                {currentUsers.toLocaleString()} / {targetUsers.toLocaleString()} users
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-blue-100"
            />
            <p className="text-xs text-blue-600">
              {progressPercentage.toFixed(1)}% complete - {(targetUsers - currentUsers).toLocaleString()} more users needed
            </p>
          </div>

          {/* Available Features */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <h5 className="text-sm font-medium text-blue-800 mb-2">
              Available Now:
            </h5>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Individual skills analysis and recommendations</li>
              <li>• Resume quality assessment and optimization</li>
              <li>• Real-time market demand insights</li>
              <li>• Personalized career roadmap</li>
              <li>• Salary trends and expectations</li>
            </ul>
          </div>

          {/* Coming Soon */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
            <h5 className="text-sm font-medium text-purple-800 mb-2">
              Coming Soon:
            </h5>
            <ul className="text-xs text-purple-600 space-y-1">
              <li>• Competitive benchmarking against similar profiles</li>
              <li>• Salary comparison with anonymized peer data</li>
              <li>• Industry-specific performance insights</li>
              <li>• Skills gap analysis vs. top performers</li>
            </ul>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <h5 className="text-xs font-medium text-gray-700">Privacy First</h5>
              <p className="text-xs text-gray-600 mt-1">
                All competitive analysis will use anonymized, aggregated data. 
                Individual profiles are never shared or compared directly.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 