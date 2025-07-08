"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Clock, Target, BookOpen, TrendingUp } from 'lucide-react';

interface PreAnalysisFormProps {
  onSubmit: (preferences: AnalysisPreferences) => void;
  isLoading?: boolean;
}

export interface AnalysisPreferences {
  roadmapDuration: number;
  careerGoals: string;
  targetRole: string;
  targetCompany: string;
  salaryExpectations: string;
  preferredIndustries: string[];
  learningTimeCommitment: number;
  priorityAreas: string[];
}

const PRIORITY_AREAS = [
  'Technical Skills',
  'Leadership',
  'Communication',
  'Industry Knowledge',
  'Certifications',
  'Networking',
  'Resume Quality',
  'Interview Skills'
];

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media & Entertainment',
  'Government',
  'Non-Profit'
];

export default function PreAnalysisForm({ onSubmit, isLoading = false }: PreAnalysisFormProps) {
  const [preferences, setPreferences] = useState<AnalysisPreferences>({
    roadmapDuration: 12,
    careerGoals: '',
    targetRole: '',
    targetCompany: '',
    salaryExpectations: '',
    preferredIndustries: [],
    learningTimeCommitment: 5,
    priorityAreas: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  const handlePriorityAreaChange = (area: string, checked: boolean) => {
    if (checked && preferences.priorityAreas.length < 3) {
      setPreferences({
        ...preferences,
        priorityAreas: [...preferences.priorityAreas, area]
      });
    } else if (!checked) {
      setPreferences({
        ...preferences,
        priorityAreas: preferences.priorityAreas.filter(a => a !== area)
      });
    }
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    if (checked) {
      setPreferences({
        ...preferences,
        preferredIndustries: [...preferences.preferredIndustries, industry]
      });
    } else {
      setPreferences({
        ...preferences,
        preferredIndustries: preferences.preferredIndustries.filter(i => i !== industry)
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Personalize Your Analysis
        </CardTitle>
        <p className="text-gray-600">
          Help us create a tailored career analysis by sharing your goals and preferences.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Career Roadmap Duration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-medium">Career Roadmap Duration</Label>
            </div>
            <Select 
              value={preferences.roadmapDuration.toString()}
              onValueChange={(value) => setPreferences({
                ...preferences, 
                roadmapDuration: parseInt(value)
              })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">1 Month (Quick wins)</SelectItem>
                <SelectItem value="12">3 Months (Standard)</SelectItem>
                <SelectItem value="24">6 Months (Comprehensive)</SelectItem>
                <SelectItem value="52">1 Year (Complete transformation)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Career Goals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-medium">Primary Career Goal</Label>
            </div>
            <Select 
              value={preferences.careerGoals}
              onValueChange={(value) => setPreferences({
                ...preferences, 
                careerGoals: value
              })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your primary goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job_switch">Switch to a new job</SelectItem>
                <SelectItem value="promotion">Get promoted in current role</SelectItem>
                <SelectItem value="career_change">Change career path</SelectItem>
                <SelectItem value="salary_increase">Increase salary</SelectItem>
                <SelectItem value="skill_upgrade">Upgrade technical skills</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Role and Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetRole">Target Role (Optional)</Label>
              <Input
                id="targetRole"
                value={preferences.targetRole}
                onChange={(e) => setPreferences({
                  ...preferences,
                  targetRole: e.target.value
                })}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetCompany">Target Company (Optional)</Label>
              <Input
                id="targetCompany"
                value={preferences.targetCompany}
                onChange={(e) => setPreferences({
                  ...preferences,
                  targetCompany: e.target.value
                })}
                placeholder="e.g., Google, Microsoft"
              />
            </div>
          </div>

          {/* Salary Expectations */}
          <div className="space-y-2">
            <Label htmlFor="salaryExpectations">Salary Expectations (Optional)</Label>
            <Input
              id="salaryExpectations"
              value={preferences.salaryExpectations}
              onChange={(e) => setPreferences({
                ...preferences,
                salaryExpectations: e.target.value
              })}
              placeholder="e.g., $80,000 - $120,000"
            />
          </div>

          {/* Learning Time Commitment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-medium">
                Weekly Learning Time Available: {preferences.learningTimeCommitment} hours
              </Label>
            </div>
            <Slider
              value={[preferences.learningTimeCommitment]}
              onValueChange={(value) => setPreferences({
                ...preferences,
                learningTimeCommitment: value[0]
              })}
              max={40}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>1 hour</span>
              <span>40 hours</span>
            </div>
          </div>

          {/* Priority Areas */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Focus Areas (Select up to 3)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRIORITY_AREAS.map(area => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={preferences.priorityAreas.includes(area)}
                    onCheckedChange={(checked) => handlePriorityAreaChange(area, checked as boolean)}
                    disabled={!preferences.priorityAreas.includes(area) && preferences.priorityAreas.length >= 3}
                  />
                  <Label 
                    htmlFor={area} 
                    className={`text-sm ${
                      !preferences.priorityAreas.includes(area) && preferences.priorityAreas.length >= 3 
                        ? 'text-gray-400' 
                        : 'text-gray-700'
                    }`}
                  >
                    {area}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {preferences.priorityAreas.length}/3
            </p>
          </div>

          {/* Preferred Industries */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Preferred Industries (Optional)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INDUSTRIES.map(industry => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={industry}
                    checked={preferences.preferredIndustries.includes(industry)}
                    onCheckedChange={(checked) => handleIndustryChange(industry, checked as boolean)}
                  />
                  <Label htmlFor={industry} className="text-sm text-gray-700">
                    {industry}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading || !preferences.careerGoals || preferences.priorityAreas.length === 0}
            >
              {isLoading ? 'Processing...' : 'Start Personalized Analysis'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 