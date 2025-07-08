"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { ListVerificationBadge, ProfileVerificationBadge } from "@/components/ui/verification-badge"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, StarHalf, Loader2, Filter, Users, ChevronDown } from "lucide-react"
import Link from "next/link"
import { EmployeeAPI, type Employee, type EmployeeSearchParams } from "@/lib/api/employees"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  
  // Search params
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"rating" | "name" | "experience">("rating")
  const [currentPage, setCurrentPage] = useState(0)
  const ITEMS_PER_PAGE = 10

  const searchEmployees = useCallback(async (params: EmployeeSearchParams) => {
    try {
      setSearching(true)
      setError(null)
      
      const response = await EmployeeAPI.searchEmployees({
        ...params,
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
      })
      
      setEmployees(response.employees)
      setTotalCount(response.total_count)
      setCompanies(response.companies)
      setDepartments(response.departments)
    } catch (err) {
      console.error('Search failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to search employees')
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }, [currentPage])

  // Initial load
  useEffect(() => {
    searchEmployees({
      sort_by: sortBy,
    })
  }, [searchEmployees, sortBy])

  // Search when filters change
  useEffect(() => {
    if (!loading) {
      setCurrentPage(0)
      const params: EmployeeSearchParams = {
        sort_by: sortBy,
      }
      
      if (searchTerm.trim()) params.search = searchTerm.trim()
      if (selectedCompany !== "all") params.company = selectedCompany
      if (selectedDepartment !== "all") params.department = selectedDepartment
      
      searchEmployees(params)
    }
  }, [searchTerm, selectedCompany, selectedDepartment, sortBy, searchEmployees, loading])

  const handleSearch = () => {
    setCurrentPage(0)
    const params: EmployeeSearchParams = {
      sort_by: sortBy,
    }
    
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (selectedCompany !== "all") params.company = selectedCompany
    if (selectedDepartment !== "all") params.department = selectedDepartment
    
    searchEmployees(params)
  }

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1)
  }

  const renderStars = (rating: number) => {
    if (rating >= 4.5) {
      return <Star className="h-4 w-4 fill-primary text-primary" />
    } else {
      return <StarHalf className="h-4 w-4 fill-primary text-primary" />
    }
  }

  const renderEmployeeSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Find Employees</h1>
          <p className="text-muted-foreground">Connect with employees at your target companies for referrals</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Employees
            </CardTitle>
            <CardDescription>Find employees by name, role, company, or expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search by name, role, department, or company..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: "rating" | "name" | "experience") => setSortBy(value)}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">By Rating</SelectItem>
                  <SelectItem value="name">By Name</SelectItem>
                  <SelectItem value="experience">By Experience</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} disabled={searching} className="w-full lg:w-auto">
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            {totalCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Found {totalCount} employee{totalCount !== 1 ? 's' : ''}
                {selectedCompany !== "all" && ` at ${selectedCompany}`}
                {selectedDepartment !== "all" && ` in ${selectedDepartment}`}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {loading ? (
            // Show skeleton loaders
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>{renderEmployeeSkeleton()}</div>
            ))
          ) : employees.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("")
                  setSelectedCompany("all")
                  setSelectedDepartment("all")
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            employees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative">
                      <UserAvatar
                        src={employee.avatar_url}
                        alt={employee.name}
                        name={employee.name}
                        size="lg"
                      />
                      <ProfileVerificationBadge isVerified={employee.is_verified || false} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{employee.name}</h3>
                        <ListVerificationBadge isVerified={employee.is_verified || false} />
                      </div>
                      <p className="text-muted-foreground">
                        {employee.position} {employee.company && `at ${employee.company}`}
                      </p>
                      {employee.department && (
                        <p className="text-sm text-muted-foreground">Department: {employee.department}</p>
                      )}
                      {employee.skills && employee.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {employee.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                          {employee.skills.length > 4 && (
                            <Badge variant="outline">
                              +{employee.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center">
                        {employee.rating && renderStars(employee.rating)}
                        <span className="ml-1 text-sm font-medium">
                          {employee.rating ? employee.rating.toFixed(1) : 'N/A'}
                        </span>
                        {employee.total_referrals && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({employee.total_referrals} referrals)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/employees/${employee.id}`}>
                          <Button size="sm">View Profile</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load more button */}
        {!loading && employees.length > 0 && employees.length < totalCount && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={searching}
              className="w-full max-w-sm"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Load More ({employees.length} of {totalCount})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
