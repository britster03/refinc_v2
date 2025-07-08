"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PreAnalysisForm, { AnalysisPreferences } from '@/components/PreAnalysisForm';
import IterativeFeedbackForm, { FeedbackData } from '@/components/IterativeFeedbackForm';
import VectorReadinessNotification from '@/components/VectorReadinessNotification';
import { performEnhancedAnalysis, requestAnalysisIteration, checkVectorReadiness } from '@/lib/ai-utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function TestEnhancedAnalysisPage() {
  const [step, setStep] = useState<'input' | 'preferences' | 'analysis' | 'feedback'>('input');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [preferences, setPreferences] = useState<AnalysisPreferences | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [vectorReadiness, setVectorReadiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [remainingIterations, setRemainingIterations] = useState(3);

  const handleResumeSubmit = () => {
    if (!resumeText.trim()) {
      setError('Please enter resume text');
      return;
    }
    setError('');
    setStep('preferences');
  };

  const handlePreferencesSubmit = async (prefs: AnalysisPreferences) => {
    setPreferences(prefs);
    setIsLoading(true);
    setError('');

    try {
      // Check vector readiness first
      const vectorStatus = await checkVectorReadiness();
      setVectorReadiness(vectorStatus);

      // Perform enhanced analysis
      const result = await performEnhancedAnalysis({
        resume_text: resumeText,
        job_description: jobDescription || undefined,
        preferences: prefs
      });

      if (result.success) {
        setAnalysisResult(result.analysis);
        setSessionKey(result.session_key);
        setRemainingIterations(result.remaining_iterations || 3);
        setStep('analysis');
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (feedback: FeedbackData) => {
    if (!sessionKey) {
      setError('No session available for iteration');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await requestAnalysisIteration(sessionKey, {
        feedback_data: feedback,
        improvement_areas: feedback.areas_to_improve
      });

      if (result.success) {
        setAnalysisResult(result.analysis);
        setRemainingIterations(result.remaining_iterations || 0);
      } else {
        setError(result.error || 'Iteration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Iteration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setStep('input');
    setResumeText('');
    setJobDescription('');
    setPreferences(null);
    setAnalysisResult(null);
    setSessionKey('');
    setVectorReadiness(null);
    setError('');
    setRemainingIterations(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Enhanced Analysis Pipeline Test
            </CardTitle>
            <p className="text-center text-gray-600">
              Test the complete enhanced analysis pipeline with user preferences and iterative refinement
            </p>
          </CardHeader>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-red-600 font-medium">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Vector Readiness Notification */}
        {vectorReadiness && (
          <VectorReadinessNotification
            vectorAnalysisReady={vectorReadiness.vector_operations_enabled}
            currentUsers={vectorReadiness.current_resume_count}
            targetUsers={vectorReadiness.minimum_required}
            alternativeInsights={vectorReadiness.alternative_insights}
          />
        )}

        {/* Step 1: Resume Input */}
        {step === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Resume & Job Description Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resume">Resume Text *</Label>
                <Textarea
                  id="resume"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  className="min-h-[200px]"
                />
              </div>
              <div>
                <Label htmlFor="job">Job Description (Optional)</Label>
                <Textarea
                  id="job"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here (optional)..."
                  className="min-h-[150px]"
                />
              </div>
              <Button onClick={handleResumeSubmit} className="w-full">
                Continue to Preferences
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preferences */}
        {step === 'preferences' && (
          <PreAnalysisForm
            onSubmit={handlePreferencesSubmit}
            isLoading={isLoading}
          />
        )}

        {/* Step 3: Analysis Results */}
        {step === 'analysis' && analysisResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisResult.executive_summary?.overall_score || 'N/A'}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold capitalize text-green-600">
                      {analysisResult.executive_summary?.recommendation || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Recommendation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {analysisResult.executive_summary?.confidence_level || 'N/A'}%
                    </div>
                    <div className="text-sm text-gray-600">Confidence</div>
                  </div>
                </div>

                {/* Key Strengths */}
                {analysisResult.executive_summary?.key_strengths && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Key Strengths:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.executive_summary.key_strengths.map((strength: string, index: number) => (
                        <li key={index} className="text-green-700">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Concerns */}
                {analysisResult.executive_summary?.key_concerns && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Areas for Improvement:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.executive_summary.key_concerns.map((concern: string, index: number) => (
                        <li key={index} className="text-orange-700">{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button onClick={() => setStep('feedback')} className="flex-1">
                    Provide Feedback & Refine
                  </Button>
                  <Button onClick={resetTest} variant="outline">
                    Start New Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Feedback */}
        {step === 'feedback' && analysisResult && (
          <div className="space-y-6">
            <IterativeFeedbackForm
              analysisResult={analysisResult}
              onSubmitFeedback={handleFeedbackSubmit}
              isLoading={isLoading}
              remainingIterations={remainingIterations}
            />
            
            <div className="flex gap-4">
              <Button onClick={() => setStep('analysis')} variant="outline">
                Back to Results
              </Button>
              <Button onClick={resetTest} variant="outline">
                Start New Test
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {step === 'preferences' ? 'Running enhanced analysis...' : 'Processing feedback and refining analysis...'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 