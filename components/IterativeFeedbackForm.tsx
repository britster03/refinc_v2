"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MessageSquare, Star, Target } from 'lucide-react';

interface IterativeFeedbackFormProps {
  analysisResult: any;
  onSubmitFeedback: (feedback: FeedbackData) => void;
  isLoading?: boolean;
  remainingIterations: number;
}

export interface FeedbackData {
  satisfaction: number;
  areas_to_improve: string[];
  specific_feedback: string;
  focus_changes: string[];
}

const IMPROVEMENT_AREAS = [
  'Skill Recommendations',
  'Salary Analysis', 
  'Career Roadmap',
  'Resume Feedback',
  'Market Insights',
  'Learning Resources'
];

const FOCUS_CHANGES = [
  'More specific recommendations',
  'Different industry focus',
  'Remote work opportunities',
  'Leadership development',
  'Technical skill emphasis',
  'Soft skills development',
  'Certification guidance',
  'Networking strategies'
];

export default function IterativeFeedbackForm({ 
  analysisResult, 
  onSubmitFeedback, 
  isLoading = false,
  remainingIterations 
}: IterativeFeedbackFormProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    satisfaction: 7,
    areas_to_improve: [],
    specific_feedback: '',
    focus_changes: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback(feedback);
  };

  const handleAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setFeedback({
        ...feedback,
        areas_to_improve: [...feedback.areas_to_improve, area]
      });
    } else {
      setFeedback({
        ...feedback,
        areas_to_improve: feedback.areas_to_improve.filter(a => a !== area)
      });
    }
  };

  const handleFocusChange = (focus: string, checked: boolean) => {
    if (checked) {
      setFeedback({
        ...feedback,
        focus_changes: [...feedback.focus_changes, focus]
      });
    } else {
      setFeedback({
        ...feedback,
        focus_changes: feedback.focus_changes.filter(f => f !== focus)
      });
    }
  };

  const getSatisfactionColor = (score: number) => {
    if (score <= 3) return 'text-red-500';
    if (score <= 6) return 'text-yellow-500';
    if (score <= 8) return 'text-blue-500';
    return 'text-green-500';
  };

  const getSatisfactionLabel = (score: number) => {
    if (score <= 3) return 'Needs Improvement';
    if (score <= 6) return 'Satisfactory';
    if (score <= 8) return 'Good';
    return 'Excellent';
  };

  if (remainingIterations <= 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Analysis Complete
            </h3>
            <p className="text-gray-500">
              You've reached the maximum number of refinements for this analysis session.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-purple-600" />
          Refine Your Analysis
          <Badge variant="secondary" className="ml-auto">
            {remainingIterations} refinements left
          </Badge>
        </CardTitle>
        <p className="text-gray-600">
          Help us improve your analysis by providing feedback on what you'd like to see more of.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Satisfaction Rating */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-medium">
                Overall Satisfaction: {feedback.satisfaction}/10
              </Label>
              <span className={`text-sm font-medium ${getSatisfactionColor(feedback.satisfaction)}`}>
                ({getSatisfactionLabel(feedback.satisfaction)})
              </span>
            </div>
            <Slider
              value={[feedback.satisfaction]}
              onValueChange={(value) => setFeedback({...feedback, satisfaction: value[0]})}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>1 (Poor)</span>
              <span>10 (Excellent)</span>
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              What would you like us to focus more on?
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {IMPROVEMENT_AREAS.map(area => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={feedback.areas_to_improve.includes(area)}
                    onCheckedChange={(checked) => handleAreaChange(area, checked as boolean)}
                  />
                  <Label htmlFor={area} className="text-sm text-gray-700">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Changes */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              How should we adjust the focus?
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              {FOCUS_CHANGES.map(focus => (
                <div key={focus} className="flex items-center space-x-2">
                  <Checkbox
                    id={focus}
                    checked={feedback.focus_changes.includes(focus)}
                    onCheckedChange={(checked) => handleFocusChange(focus, checked as boolean)}
                  />
                  <Label htmlFor={focus} className="text-sm text-gray-700">
                    {focus}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Specific Feedback */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-medium">
                Specific feedback or questions:
              </Label>
            </div>
            <Textarea
              value={feedback.specific_feedback}
              onChange={(e) => setFeedback({...feedback, specific_feedback: e.target.value})}
              placeholder="e.g., 'I want more specific learning resources for Python' or 'Focus more on remote job opportunities' or 'Need more guidance on salary negotiation'"
              className="min-h-[100px] resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Be specific about what you'd like to see improved or changed in the next iteration.
            </p>
          </div>

          {/* Current Analysis Summary */}
          {analysisResult && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">Current Analysis Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Overall Score:</span>
                  <div className="font-medium">
                    {analysisResult.overall_score || 'N/A'}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Recommendation:</span>
                  <div className="font-medium capitalize">
                    {analysisResult.recommendation || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Confidence:</span>
                  <div className="font-medium">
                    {analysisResult.confidence || 'N/A'}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Focus Areas:</span>
                  <div className="font-medium">
                    {analysisResult.focus_areas?.length || 0} identified
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading || (feedback.areas_to_improve.length === 0 && !feedback.specific_feedback.trim())}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Re-analyzing...
                </div>
              ) : (
                'Re-analyze with Improvements'
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will generate a refined analysis based on your feedback
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 