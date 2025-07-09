"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, BrainCircuit, CheckCircle, AlertTriangle, Lightbulb, Download, Zap } from "lucide-react"

export function AIResumeAnalyzer() {
  const [hasResume, setHasResume] = useState(true) // Simulating uploaded resume
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 3000)
  }

  if (!hasResume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Upload Your Resume</h3>
          <p className="text-muted-foreground max-w-md">
            Upload your resume to get AI-powered analysis and optimization suggestions
          </p>
        </div>
        <Button onClick={() => setHasResume(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Resume
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">john_doe_resume.pdf</h3>
            <p className="text-sm text-muted-foreground">Last analyzed 2 hours ago</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            <BrainCircuit className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Overall Resume Score
          </CardTitle>
          <CardDescription>AI-powered analysis of your resume's effectiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">8.7</div>
              <div className="text-sm text-muted-foreground">out of 10</div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Content Quality</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>ATS Compatibility</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>Keyword Optimization</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="formatting">Formatting</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Strong Technical Skills</p>
                    <p className="text-xs text-muted-foreground">Comprehensive list of relevant technologies</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Quantified Achievements</p>
                    <p className="text-xs text-muted-foreground">Good use of metrics and numbers</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Clear Structure</p>
                    <p className="text-xs text-muted-foreground">Well-organized sections and layout</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Missing Keywords</p>
                    <p className="text-xs text-muted-foreground">
                      Add "React", "Node.js", "AWS" for better ATS matching
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Weak Action Verbs</p>
                    <p className="text-xs text-muted-foreground">Replace "responsible for" with stronger verbs</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Length Optimization</p>
                    <p className="text-xs text-muted-foreground">Consider condensing to 1-2 pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              These suggestions are based on analysis of 10,000+ successful resumes in your field.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {[
              {
                priority: "High",
                title: "Add React and TypeScript to Skills",
                description: "These keywords appear in 85% of frontend developer job postings",
                impact: "+15% ATS match rate",
              },
              {
                priority: "High",
                title: "Quantify Project Impact",
                description: "Add metrics to your project descriptions (e.g., 'Improved load time by 40%')",
                impact: "+12% recruiter interest",
              },
              {
                priority: "Medium",
                title: "Strengthen Action Verbs",
                description: "Replace 'Worked on' with 'Developed', 'Built', or 'Implemented'",
                impact: "+8% readability score",
              },
              {
                priority: "Medium",
                title: "Add Portfolio Links",
                description: "Include links to GitHub and live projects",
                impact: "+20% callback rate",
              },
              {
                priority: "Low",
                title: "Optimize White Space",
                description: "Improve visual hierarchy with better spacing",
                impact: "+5% visual appeal",
              },
            ].map((suggestion, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            suggestion.priority === "High"
                              ? "destructive"
                              : suggestion.priority === "Medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {suggestion.priority} Priority
                        </Badge>
                        <span className="text-sm text-green-600 font-medium">{suggestion.impact}</span>
                      </div>
                      <h4 className="font-medium mb-1">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Analysis</CardTitle>
              <CardDescription>Keywords found in your resume vs. common job requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Present Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {["JavaScript", "HTML", "CSS", "Git", "Agile", "Problem Solving"].map((keyword) => (
                      <Badge key={keyword} variant="outline" className="bg-green-50">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-orange-600">Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {["React", "TypeScript", "Node.js", "AWS", "Docker", "Testing"].map((keyword) => (
                      <Badge key={keyword} variant="outline" className="bg-orange-50">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formatting" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ATS Compatibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Format</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">PDF ✓</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Font Readability</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Good ✓</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Section Headers</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Needs Work</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Design</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Layout Balance</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Excellent ✓</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">White Space</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Good ✓</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consistency</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Very Good ✓</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
