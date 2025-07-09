"use client"

import type React from "react"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Download,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react"

interface JobApplication {
  id: string
  company: string
  role: string
  location: string
  salary: string
  status: "applied" | "pending" | "interview" | "offer" | "rejected"
  appliedDate: string
  lastUpdate: string
  matchScore: number
  successProbability: number
  url: string
  notes: string
  priority: "high" | "medium" | "low"
  source: string
  contactPerson?: string
  followUpDate?: string
  interviewDate?: string
  requirements: string[]
  benefits: string[]
  companySize: string
  remote: boolean
  selected?: boolean
}

const jobApplications: JobApplication[] = [
  {
    id: "1",
    company: "TechCorp",
    role: "Senior Frontend Developer",
    location: "San Francisco, CA",
    salary: "$120k - $150k",
    status: "interview",
    appliedDate: "2024-01-15",
    lastUpdate: "2024-01-20",
    matchScore: 95,
    successProbability: 78,
    url: "https://techcorp.com/jobs/123",
    notes: "Great company culture, remote-friendly",
    priority: "high",
    source: "LinkedIn",
    contactPerson: "Sarah Johnson",
    followUpDate: "2024-01-25",
    interviewDate: "2024-01-22",
    requirements: ["React", "TypeScript", "Node.js"],
    benefits: ["Health Insurance", "401k", "Remote Work"],
    companySize: "500-1000",
    remote: true,
  },
  {
    id: "2",
    company: "StartupXYZ",
    role: "Full Stack Engineer",
    location: "New York, NY",
    salary: "$100k - $130k",
    status: "pending",
    appliedDate: "2024-01-10",
    lastUpdate: "2024-01-10",
    matchScore: 87,
    successProbability: 65,
    url: "https://startupxyz.com/careers/456",
    notes: "Fast-growing startup, equity options",
    priority: "medium",
    source: "Company Website",
    requirements: ["React", "Python", "AWS"],
    benefits: ["Equity", "Health Insurance"],
    companySize: "50-100",
    remote: false,
  },
  {
    id: "3",
    company: "BigTech Inc",
    role: "React Developer",
    location: "Seattle, WA",
    salary: "$110k - $140k",
    status: "rejected",
    appliedDate: "2024-01-05",
    lastUpdate: "2024-01-18",
    matchScore: 78,
    successProbability: 45,
    url: "https://bigtech.com/jobs/789",
    notes: "Competitive process, good benefits",
    priority: "low",
    source: "Indeed",
    requirements: ["React", "JavaScript", "GraphQL"],
    benefits: ["Health Insurance", "Stock Options"],
    companySize: "10000+",
    remote: true,
  },
  {
    id: "4",
    company: "InnovateLab",
    role: "UI/UX Developer",
    location: "Austin, TX",
    salary: "$90k - $120k",
    status: "applied",
    appliedDate: "2024-01-18",
    lastUpdate: "2024-01-18",
    matchScore: 92,
    successProbability: 72,
    url: "https://innovatelab.com/careers/101",
    notes: "Design-focused role, creative environment",
    priority: "high",
    source: "AngelList",
    requirements: ["React", "Figma", "CSS"],
    benefits: ["Health Insurance", "Creative Freedom"],
    companySize: "100-500",
    remote: true,
  },
  {
    id: "5",
    company: "DataFlow Systems",
    role: "Frontend Engineer",
    location: "Boston, MA",
    salary: "$105k - $135k",
    status: "pending",
    appliedDate: "2024-01-12",
    lastUpdate: "2024-01-19",
    matchScore: 83,
    successProbability: 58,
    url: "https://dataflow.com/jobs/202",
    notes: "Data visualization focus, interesting projects",
    priority: "medium",
    source: "Glassdoor",
    requirements: ["React", "D3.js", "TypeScript"],
    benefits: ["Health Insurance", "Learning Budget"],
    companySize: "200-500",
    remote: false,
  },
]

type SortField = keyof JobApplication
type SortDirection = "asc" | "desc"

interface ColumnConfig {
  key: SortField
  label: string
  width: number
  sortable: boolean
  editable: boolean
  type: "text" | "select" | "number" | "date" | "badge" | "progress" | "custom"
  options?: string[]
  visible: boolean
}

const defaultColumns: ColumnConfig[] = [
  { key: "company", label: "Company", width: 150, sortable: true, editable: true, type: "text", visible: true },
  { key: "role", label: "Role", width: 200, sortable: true, editable: true, type: "text", visible: true },
  { key: "location", label: "Location", width: 150, sortable: true, editable: true, type: "text", visible: true },
  { key: "salary", label: "Salary", width: 130, sortable: true, editable: true, type: "text", visible: true },
  {
    key: "status",
    label: "Status",
    width: 120,
    sortable: true,
    editable: true,
    type: "select",
    options: ["applied", "pending", "interview", "offer", "rejected"],
    visible: true,
  },
  { key: "appliedDate", label: "Applied", width: 110, sortable: true, editable: true, type: "date", visible: true },
  { key: "matchScore", label: "Match %", width: 100, sortable: true, editable: false, type: "progress", visible: true },
  {
    key: "successProbability",
    label: "Success %",
    width: 110,
    sortable: true,
    editable: false,
    type: "progress",
    visible: true,
  },
  {
    key: "priority",
    label: "Priority",
    width: 100,
    sortable: true,
    editable: true,
    type: "select",
    options: ["high", "medium", "low"],
    visible: true,
  },
  { key: "source", label: "Source", width: 120, sortable: true, editable: true, type: "text", visible: true },
  { key: "notes", label: "Notes", width: 200, sortable: false, editable: true, type: "text", visible: true },
]

export function AdvancedJobGrid() {
  const [data, setData] = useState<JobApplication[]>(jobApplications)
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns)
  const [sortField, setSortField] = useState<SortField>("appliedDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: SortField } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowId: string } | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  // Filtered and sorted data
  const processedData = useMemo(() => {
    const filtered = data.filter((job) => {
      const matchesSearch =
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      return matchesSearch && matchesStatus
    })

    return filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }

      return 0
    })
  }, [data, searchTerm, statusFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleCellEdit = (rowId: string, field: SortField, value: any) => {
    setData((prev) => prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)))
    setEditingCell(null)
  }

  const handleRowSelect = (rowId: string, selected: boolean) => {
    const newSelected = new Set(selectedRows)
    if (selected) {
      newSelected.add(rowId)
    } else {
      newSelected.delete(rowId)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(processedData.map((row) => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleBulkAction = (action: string) => {
    const selectedIds = Array.from(selectedRows)
    switch (action) {
      case "delete":
        setData((prev) => prev.filter((row) => !selectedIds.includes(row.id)))
        setSelectedRows(new Set())
        break
      case "mark-interview":
        setData((prev) =>
          prev.map((row) => (selectedIds.includes(row.id) ? { ...row, status: "interview" as const } : row)),
        )
        break
      case "mark-rejected":
        setData((prev) =>
          prev.map((row) => (selectedIds.includes(row.id) ? { ...row, status: "rejected" as const } : row)),
        )
        break
    }
  }

  const handleContextMenu = (e: React.MouseEvent, rowId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, rowId })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "interview":
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-3 w-3 text-red-600" />
      case "applied":
        return <AlertCircle className="h-3 w-3 text-blue-600" />
      case "offer":
        return <Star className="h-3 w-3 text-purple-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "interview":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "applied":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "offer":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const renderCell = (row: JobApplication, column: ColumnConfig) => {
    const value = row[column.key]
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === column.key

    if (isEditing && column.editable) {
      if (column.type === "select" && column.options) {
        return (
          <Select value={value as string} onValueChange={(newValue) => handleCellEdit(row.id, column.key, newValue)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }

      return (
        <Input
          className="h-8 text-xs"
          value={value as string}
          onChange={(e) => handleCellEdit(row.id, column.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditingCell(null)
            if (e.key === "Escape") setEditingCell(null)
          }}
          autoFocus
        />
      )
    }

    switch (column.type) {
      case "badge":
        if (column.key === "status") {
          return (
            <Badge className={`text-xs ${getStatusColor(value as string)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(value as string)}
                {value as string}
              </div>
            </Badge>
          )
        }
        if (column.key === "priority") {
          return <Badge className={`text-xs ${getPriorityColor(value as string)}`}>{value as string}</Badge>
        }
        break
      case "progress":
        return (
          <div className="flex items-center gap-2">
            <Progress value={value as number} className="h-2 w-12" />
            <span className="text-xs font-medium">{value}%</span>
          </div>
        )
      case "number":
        return <span className="text-xs font-mono">{value}</span>
      default:
        return (
          <span
            className="text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onClick={() => column.editable && setEditingCell({ rowId: row.id, field: column.key })}
          >
            {value as string}
          </span>
        )
    }
  }

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return (
    <div className="space-y-4">
      {/* Advanced Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Advanced Job Grid
              </CardTitle>
              <CardDescription>Excel-like interface with advanced features</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {processedData.length} jobs
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedRows.size} selected
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies, roles, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setIsColumnSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Columns
            </Button>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-800">
                {selectedRows.size} row{selectedRows.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-1 ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("mark-interview")}>
                  Mark Interview
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("mark-rejected")}>
                  Mark Rejected
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
          <div className="min-w-full" ref={gridRef}>
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
              <div className="flex">
                {/* Select All Checkbox */}
                <div className="w-12 p-2 border-r border-gray-200 flex items-center justify-center">
                  <Checkbox
                    checked={selectedRows.size === processedData.length && processedData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </div>

                {/* Column Headers */}
                {columns
                  .filter((col) => col.visible)
                  .map((column) => (
                    <div
                      key={column.key}
                      className="border-r border-gray-200 p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none"
                      style={{ width: column.width, minWidth: column.width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            {sortField === column.key ? (
                              sortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                {/* Actions Column */}
                <div className="w-16 p-2 bg-gray-50 text-xs font-medium text-gray-700">Actions</div>
              </div>
            </div>

            {/* Data Rows */}
            <div>
              {processedData.map((row, index) => (
                <div
                  key={row.id}
                  className={`flex hover:bg-gray-50 border-b border-gray-100 ${
                    selectedRows.has(row.id) ? "bg-blue-50" : index % 2 === 0 ? "bg-white" : "bg-gray-25"
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, row.id)}
                >
                  {/* Row Checkbox */}
                  <div className="w-12 p-2 border-r border-gray-100 flex items-center justify-center">
                    <Checkbox
                      checked={selectedRows.has(row.id)}
                      onCheckedChange={(checked) => handleRowSelect(row.id, checked as boolean)}
                    />
                  </div>

                  {/* Data Cells */}
                  {columns
                    .filter((col) => col.visible)
                    .map((column) => (
                      <div
                        key={`${row.id}-${column.key}`}
                        className="border-r border-gray-100 p-2 flex items-center"
                        style={{ width: column.width, minWidth: column.width }}
                      >
                        {renderCell(row, column)}
                      </div>
                    ))}

                  {/* Actions */}
                  <div className="w-16 p-2 flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={row.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Job
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100">
            <Edit className="h-4 w-4 mr-2 inline" />
            Edit Row
          </button>
          <button className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100">
            <Copy className="h-4 w-4 mr-2 inline" />
            Duplicate
          </button>
          <hr className="my-1" />
          <button className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 text-red-600">
            <Trash2 className="h-4 w-4 mr-2 inline" />
            Delete
          </button>
        </div>
      )}

      {/* Column Settings Dialog */}
      <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Column Settings</DialogTitle>
            <DialogDescription>Customize which columns to show and their order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-auto">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={column.visible}
                    onCheckedChange={(checked) =>
                      setColumns((prev) =>
                        prev.map((col) => (col.key === column.key ? { ...col, visible: checked as boolean } : col)),
                      )
                    }
                  />
                  <span className="text-sm">{column.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={column.width}
                    onChange={(e) =>
                      setColumns((prev) =>
                        prev.map((col) =>
                          col.key === column.key ? { ...col, width: Number.parseInt(e.target.value) || 100 } : col,
                        ),
                      )
                    }
                    className="w-20 h-8"
                    min="50"
                    max="500"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grid Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">{processedData.length}</div>
                <p className="text-xs text-muted-foreground">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">
                  {Math.round(
                    processedData.reduce((acc, job) => acc + job.successProbability, 0) / processedData.length,
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Avg Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-lg font-bold">
                  {Math.round(processedData.reduce((acc, job) => acc + job.matchScore, 0) / processedData.length)}%
                </div>
                <p className="text-xs text-muted-foreground">Avg Match Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-bold">
                  {processedData.filter((job) => job.status === "interview" || job.status === "offer").length}
                </div>
                <p className="text-xs text-muted-foreground">Active Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
