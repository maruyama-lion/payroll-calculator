"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  Flame,
  Users,
  Calculator,
  FileText,
  Download,
  Plus,
  Eye,
  ArrowLeft,
  Save,
  Calendar,
  Trash2,
  Upload,
  Edit,
  Receipt,
  Bell,
  RefreshCw,
  Search,
  Target,
  AlertTriangle,
  BarChart3,
} from "lucide-react"

// 支払い種別
type PaymentType = "dispatch" | "annual"

// 支払い状態
type PaymentStatus = "editing" | "confirmed" | "paid"

// 現在のページ
type CurrentPage = "management" | "calculation" | "member-detail" | "batch-detail" | "reward-selection"

// ユーザー権限
type UserRole = "admin" | "member"

// 活動種別
const ACTIVITY_TYPES = {
  dispatch: "出動",
  training: "訓練",
  meeting: "会議",
  inspection: "点検",
  patrol: "巡回",
  other: "その他",
}

// 支払いバッチ
interface PaymentBatch {
  id: string
  name: string
  type: PaymentType
  status: PaymentStatus
  createdDate: string
  confirmedDate?: string
  scheduledPaymentDate?: string
  paymentDate?: string
  description: string
  totalAmount: number
  memberCount: number
  createdBy: string
}

// 支払い明細
interface PaymentDetail {
  id: string
  batchId: string
  memberId: string
  memberName: string
  rank: string
  totalAmount: number
  breakdown: PaymentBreakdown
  notes: string
}

interface PaymentBreakdown {
  baseAmount: number
  allowances: Array<{ name: string; amount: number }>
  deductions: Array<{ name: string; amount: number }>
  incidents?: Array<{ name: string; hours: number; amount: number }>
}

// 外部データインポート
interface ImportData {
  source: string
  data: any[]
  mappingConfig: Record<string, string>
}

// 事案の種類と手当単価
const INCIDENT_TYPES = {
  fire: { name: "火災出動", baseRate: 3000, riskMultiplier: 1.5 },
  rescue: { name: "救助出動", baseRate: 2500, riskMultiplier: 1.3 },
  emergency: { name: "救急支援", baseRate: 2000, riskMultiplier: 1.0 },
  training: { name: "訓練", baseRate: 1500, riskMultiplier: 1.0 },
  patrol: { name: "警戒巡視", baseRate: 1000, riskMultiplier: 1.0 },
  meeting: { name: "会議・点検", baseRate: 800, riskMultiplier: 1.0 },
}

// 階級と基本手当・年額報酬
const RANKS = {
  captain: { name: "団長", multiplier: 2.0, annualBase: 120000 },
  deputy: { name: "副団長", multiplier: 1.8, annualBase: 100000 },
  chief: { name: "分団長", multiplier: 1.6, annualBase: 80000 },
  lieutenant: { name: "副分団長", multiplier: 1.4, annualBase: 60000 },
  sergeant: { name: "部長", multiplier: 1.2, annualBase: 50000 },
  member: { name: "団員", multiplier: 1.0, annualBase: 40000 },
}

interface Incident {
  id: string
  name: string
  type: keyof typeof INCIDENT_TYPES
  date: string
  duration: number
  riskLevel: number
  description: string
  participants: string[]
}

interface Member {
  id: string
  name: string
  rank: keyof typeof RANKS
  yearsOfService: number
  joinDate: string
}

interface ActivityRecord {
  memberId: string
  incidentId: string
  activityType: keyof typeof ACTIVITY_TYPES
  participationHours: number
  rewardAmount: number
  withholdingTax: number
  otherDeductions: number
  transferAmount: number
  notes: string
}

interface AnnualPaymentRecord {
  memberId: string
  year: number
  baseAmount: number
  serviceYearBonus: number
  specialAllowance: number
  notes: string
}

interface PayrollCalculation {
  memberId: string
  memberName: string
  rank: string
  totalAmount: number
  details: any
}

const PAYMENT_TYPE_LABELS = {
  dispatch: "出動報酬",
  annual: "年額報酬",
}

const PAYMENT_STATUS_LABELS = {
  editing: "編集中",
  confirmed: "確定済",
  paid: "支払済",
}

const PAYMENT_STATUS_COLORS = {
  editing: "bg-gray-100 text-gray-800",
  confirmed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
}

export default function Component() {
  // ページ管理
  const [currentPage, setCurrentPage] = useState<CurrentPage>("management")
  const [selectedBatch, setSelectedBatch] = useState<PaymentBatch | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [userRole] = useState<UserRole>("admin") // 実際にはログイン情報から取得



  // APIフェッチ関連の状態
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false)
  const [incidentSearchTerm, setIncidentSearchTerm] = useState("")
  const [incidentTypeFilter, setIncidentTypeFilter] = useState("all")
  const [dateRangeFilter, setDateRangeFilter] = useState("")

  // サンプルデータ
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "inc001",
      name: "住宅火災（○○町）",
      type: "fire",
      date: "2024-01-15",
      duration: 4,
      riskLevel: 3,
      description: "2階建て住宅火災、延焼防止活動",
      participants: ["mem001", "mem002", "mem003", "mem004"],
    },
    {
      id: "inc002",
      name: "交通事故救助",
      type: "rescue",
      date: "2024-01-18",
      duration: 2,
      riskLevel: 2,
      description: "車両事故による救助活動",
      participants: ["mem001", "mem003", "mem005"],
    },
    {
      id: "inc003",
      name: "月例訓練",
      type: "training",
      date: "2024-01-20",
      duration: 3,
      riskLevel: 1,
      description: "放水訓練・救助訓練",
      participants: ["mem001", "mem002", "mem003", "mem004", "mem005"],
    },
  ])

  const [members] = useState<Member[]>([
    {
      id: "mem001",
      name: "田中 太郎",
      rank: "chief",
      yearsOfService: 15,
      joinDate: "2009-04-01",
    },
    {
      id: "mem002",
      name: "佐藤 次郎",
      rank: "lieutenant",
      yearsOfService: 8,
      joinDate: "2016-04-01",
    },
    {
      id: "mem003",
      name: "鈴木 三郎",
      rank: "sergeant",
      yearsOfService: 5,
      joinDate: "2019-04-01",
    },
    {
      id: "mem004",
      name: "高橋 四郎",
      rank: "member",
      yearsOfService: 3,
      joinDate: "2021-04-01",
    },
    {
      id: "mem005",
      name: "渡辺 五郎",
      rank: "member",
      yearsOfService: 2,
      joinDate: "2022-04-01",
    },
  ])

  // 支払いバッチ管理
  const [paymentBatches, setPaymentBatches] = useState<PaymentBatch[]>([
    {
      id: "pay001",
      name: "2024年1月出動報酬",
      type: "dispatch",
      status: "paid",
      createdDate: "2024-01-25",
      confirmedDate: "2024-01-28",
      scheduledPaymentDate: "2024-01-31",
      paymentDate: "2024-01-31",
      description: "1月の火災・救助出動に対する報酬",
      totalAmount: 125000,
      memberCount: 5,
      createdBy: "admin",
    },
    {
      id: "pay002",
      name: "2024年度年額報酬",
      type: "annual",
      status: "confirmed",
      createdDate: "2024-01-01",
      confirmedDate: "2024-01-02",
      scheduledPaymentDate: "2024-03-31",
      description: "2024年度の年額基本報酬",
      totalAmount: 350000,
      memberCount: 5,
      createdBy: "admin",
    },
    {
      id: "pay003",
      name: "2024年2月出動報酬",
      type: "dispatch",
      status: "editing",
      createdDate: "2024-02-25",
      description: "2月の火災・救助出動に対する報酬（作成中）",
      totalAmount: 0,
      memberCount: 0,
      createdBy: "admin",
    },
  ])

  // 支払い明細データ
  const [paymentDetails] = useState<PaymentDetail[]>([
    {
      id: "detail001",
      batchId: "pay001",
      memberId: "mem001",
      memberName: "田中 太郎",
      rank: "分団長",
      totalAmount: 35000,
      breakdown: {
        baseAmount: 30000,
        allowances: [
          { name: "指揮手当", amount: 3000 },
          { name: "危険手当", amount: 2000 },
        ],
        deductions: [],
        incidents: [
          { name: "住宅火災（○○町）", hours: 4, amount: 20000 },
          { name: "月例訓練", hours: 3, amount: 15000 },
        ],
      },
      notes: "",
    },
    {
      id: "detail002",
      batchId: "pay001",
      memberId: "mem002",
      memberName: "佐藤 次郎",
      rank: "副分団長",
      totalAmount: 25000,
      breakdown: {
        baseAmount: 25000,
        allowances: [],
        deductions: [],
        incidents: [
          { name: "住宅火災（○○町）", hours: 4, amount: 15000 },
          { name: "月例訓練", hours: 3, amount: 10000 },
        ],
      },
      notes: "",
    },
  ])

  const [isCreatingBatch, setIsCreatingBatch] = useState(false)
  const [isEditingBatch, setIsEditingBatch] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [newBatchData, setNewBatchData] = useState({
    name: "",
    type: "dispatch" as PaymentType,
    description: "",
  })

  // 給与計算用データ
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([])
  const [annualPaymentRecords, setAnnualPaymentRecords] = useState<AnnualPaymentRecord[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [payrollCalculations, setPayrollCalculations] = useState<PayrollCalculation[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // フィルタリング用の状態
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  
  // ステータス変更用の状態
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false)
  const [scheduledPaymentDate, setScheduledPaymentDate] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // APIから事案データを取得する関数（模擬）
  const fetchIncidents = async () => {
    setIsLoadingIncidents(true)
    // 実際のAPIコール
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // フィルタリング処理
    let filteredIncidents = incidents

    if (incidentSearchTerm) {
      filteredIncidents = filteredIncidents.filter((incident) =>
        incident.name.toLowerCase().includes(incidentSearchTerm.toLowerCase()),
      )
    }

    if (incidentTypeFilter !== "all") {
      filteredIncidents = filteredIncidents.filter((incident) => incident.type === incidentTypeFilter)
    }

    if (dateRangeFilter) {
      filteredIncidents = filteredIncidents.filter((incident) => incident.date >= dateRangeFilter)
    }

    setIncidents(filteredIncidents)
    setIsLoadingIncidents(false)
  }

  const createPaymentBatch = () => {
    const newBatch: PaymentBatch = {
      id: `pay${Date.now()}`,
      name: newBatchData.name,
      type: newBatchData.type,
      status: "editing",
      createdDate: new Date().toISOString().split("T")[0],
      description: newBatchData.description,
      totalAmount: 0,
      memberCount: 0,
      createdBy: "admin",
    }
    setPaymentBatches([...paymentBatches, newBatch])
    setIsCreatingBatch(false)
    setNewBatchData({ name: "", type: "dispatch", description: "" })
  }

  const updatePaymentBatch = () => {
    if (!selectedBatch) return

    setPaymentBatches((batches) =>
      batches.map((batch) =>
        batch.id === selectedBatch.id
          ? { ...batch, name: newBatchData.name, description: newBatchData.description }
          : batch,
      ),
    )
    setIsEditingBatch(false)
  }

  const updatePaymentBatchStatus = (batchId: string, status: PaymentStatus, scheduledPaymentDateInput?: string) => {
    const updateData: Partial<PaymentBatch> = { status }

    if (status === "confirmed") {
      updateData.confirmedDate = new Date().toISOString().split("T")[0]
      if (scheduledPaymentDateInput) {
        updateData.scheduledPaymentDate = scheduledPaymentDateInput
      }
    } else if (status === "paid") {
      updateData.paymentDate = new Date().toISOString().split("T")[0]
    }

    setPaymentBatches((batches) => batches.map((batch) => (batch.id === batchId ? { ...batch, ...updateData } : batch)))
  }

  // ステータス確定処理
  const handleConfirmStatus = () => {
    if (selectedBatch && scheduledPaymentDate) {
      updatePaymentBatchStatus(selectedBatch.id, "confirmed", scheduledPaymentDate)
      setIsConfirmingStatus(false)
      setScheduledPaymentDate("")
      // 詳細画面のバッチ情報も更新
      setSelectedBatch({
        ...selectedBatch,
        status: "confirmed",
        confirmedDate: new Date().toISOString().split("T")[0],
        scheduledPaymentDate: scheduledPaymentDate
      })
    }
  }

  // 支払い済み処理
  const handleMarkAsPaid = () => {
    if (selectedBatch) {
      updatePaymentBatchStatus(selectedBatch.id, "paid")
      setSelectedBatch({
        ...selectedBatch,
        status: "paid",
        paymentDate: new Date().toISOString().split("T")[0]
      })
    }
  }

  // 一括明細出力
  const handleBulkExport = () => {
    alert("一括明細出力機能は開発中です")
  }

  const deleteBatch = (batchId: string) => {
    setPaymentBatches((batches) => batches.filter((batch) => batch.id !== batchId))
  }

  const openCalculation = (batch: PaymentBatch) => {
    setSelectedBatch(batch)
    setCurrentPage("calculation")
    setNewBatchData({
      name: batch.name,
      type: batch.type,
      description: batch.description,
    })
    // 計算データをリセット
    setSelectedIncidents([])
    setSelectedMembers([])
    setActivityRecords([])
    setAnnualPaymentRecords([])
    setPayrollCalculations([])
  }

  const openMemberDetail = (memberId: string) => {
    setSelectedMemberId(memberId)
    setCurrentPage("member-detail")
  }

  // 支払いバッチ詳細を開く関数を追加
  const openBatchDetail = (batch: PaymentBatch) => {
    setSelectedBatch(batch)
    setCurrentPage("batch-detail")
  }

  // 支払いバッチ詳細を閉じる関数を追加
  const closeBatchDetail = () => {
    setCurrentPage("management")
    setSelectedBatch(null)
  }

  // 支払いバッチの団員明細を取得する関数を追加
  const getBatchPaymentDetails = (batchId: string) => {
    return paymentDetails.filter((detail) => detail.batchId === batchId)
  }

  const closeCalculation = () => {
    setCurrentPage("batch-detail")
  }

  // 報酬対象選択画面を開く
  const openRewardSelection = (batch: PaymentBatch) => {
    setSelectedBatch(batch)
    setCurrentPage("reward-selection")
  }

  // 報酬対象選択画面を閉じる
  const closeRewardSelection = () => {
    setCurrentPage("calculation")
  }

  const closeMemberDetail = () => {
    setCurrentPage("management")
    setSelectedMemberId(null)
  }

  const handleIncidentSelection = (incidentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIncidents([...selectedIncidents, incidentId])
      const incident = incidents.find((i) => i.id === incidentId)
      if (incident) {
        const newParticipants = incident.participants.filter((memberId) => !selectedMembers.includes(memberId))
        setSelectedMembers([...selectedMembers, ...newParticipants])
      }
    } else {
      setSelectedIncidents(selectedIncidents.filter((id) => id !== incidentId))
      const incident = incidents.find((i) => i.id === incidentId)
      if (incident) {
        const remainingIncidents = selectedIncidents.filter((id) => id !== incidentId)
        const remainingParticipants = new Set<string>()
        remainingIncidents.forEach((remainingIncidentId) => {
          const remainingIncident = incidents.find((i) => i.id === remainingIncidentId)
          if (remainingIncident) {
            remainingIncident.participants.forEach((memberId) => {
              remainingParticipants.add(memberId)
            })
          }
        })
        setSelectedMembers(Array.from(remainingParticipants))
      }
      setActivityRecords(activityRecords.filter((record) => record.incidentId !== incidentId))
    }
  }

  const updateActivityRecord = (memberId: string, incidentId: string, field: keyof ActivityRecord, value: any) => {
    const existingIndex = activityRecords.findIndex(
      (record) => record.memberId === memberId && record.incidentId === incidentId,
    )

    if (existingIndex >= 0) {
      const updated = [...activityRecords]
      updated[existingIndex] = { ...updated[existingIndex], [field]: value }

      // 報酬額が変更された場合、源泉徴収額と振込額を自動計算
      if (field === "rewardAmount" || field === "otherDeductions") {
        const record = updated[existingIndex]
        record.withholdingTax = Math.floor(record.rewardAmount * 0.1021)
        record.transferAmount = record.rewardAmount - record.withholdingTax - record.otherDeductions
      }

      setActivityRecords(updated)
    } else {
      const newRecord: ActivityRecord = {
        memberId,
        incidentId,
        activityType: "dispatch",
        participationHours: 0,
        rewardAmount: 0,
        withholdingTax: 0,
        otherDeductions: 0,
        transferAmount: 0,
        notes: "",
        [field]: value,
      }

      // 新規作成時も自動計算
      if (field === "rewardAmount") {
        newRecord.withholdingTax = Math.floor(newRecord.rewardAmount * 0.1021)
        newRecord.transferAmount = newRecord.rewardAmount - newRecord.withholdingTax - newRecord.otherDeductions
      }

      setActivityRecords([...activityRecords, newRecord])
    }
  }

  const getActivityRecord = (memberId: string, incidentId: string): ActivityRecord | undefined => {
    return activityRecords.find((record) => record.memberId === memberId && record.incidentId === incidentId)
  }

  const updateAnnualPaymentRecord = (memberId: string, field: keyof AnnualPaymentRecord, value: any) => {
    const existingIndex = annualPaymentRecords.findIndex(
      (record) => record.memberId === memberId && record.year === selectedYear,
    )

    if (existingIndex >= 0) {
      const updated = [...annualPaymentRecords]
      updated[existingIndex] = { ...updated[existingIndex], [field]: value }
      setAnnualPaymentRecords(updated)
    } else {
      const member = members.find((m) => m.id === memberId)
      if (!member) return

      const newRecord: AnnualPaymentRecord = {
        memberId,
        year: selectedYear,
        baseAmount: RANKS[member.rank].annualBase,
        serviceYearBonus: member.yearsOfService * 2000,
        specialAllowance: 0,
        notes: "",
        [field]: value,
      }
      setAnnualPaymentRecords([...annualPaymentRecords, newRecord])
    }
  }

  const getAnnualPaymentRecord = (memberId: string): AnnualPaymentRecord | undefined => {
    return annualPaymentRecords.find((record) => record.memberId === memberId && record.year === selectedYear)
  }

  // 出動報酬計算
  const calculateDispatchPayroll = () => {
    const calculations: PayrollCalculation[] = []

    selectedMembers.forEach((memberId) => {
      const member = members.find((m) => m.id === memberId)
      if (!member) return

      let totalHours = 0
      let baseAllowance = 0
      let riskAllowance = 0
      const leadershipAllowance = 0
      const equipmentAllowance = 0
      const incidentDetails: Array<{ incidentName: string; hours: number; pay: number }> = []

      selectedIncidents.forEach((incidentId) => {
        const incident = incidents.find((i) => i.id === incidentId)
        const record = getActivityRecord(memberId, incidentId)

        if (!incident || !record || record.participationHours === 0) return

        const incidentType = INCIDENT_TYPES[incident.type]
        const rankMultiplier = RANKS[member.rank].multiplier
        const hours = record.participationHours

        const basePayForIncident = incidentType.baseRate * rankMultiplier * hours
        baseAllowance += basePayForIncident

        const riskPayForIncident = basePayForIncident * (incidentType.riskMultiplier - 1) * incident.riskLevel * 0.1
        riskAllowance += riskPayForIncident

        totalHours += hours
        const totalPayForIncident = basePayForIncident + riskPayForIncident

        incidentDetails.push({
          incidentName: incident.name,
          hours,
          pay: totalPayForIncident,
        })
      })

      const totalAmount = baseAllowance + riskAllowance + leadershipAllowance + equipmentAllowance

      calculations.push({
        memberId,
        memberName: member.name,
        rank: RANKS[member.rank].name,
        totalAmount,
        details: {
          totalHours,
          baseAllowance,
          riskAllowance,
          leadershipAllowance,
          equipmentAllowance,
          incidents: incidentDetails,
        },
      })
    })

    setPayrollCalculations(calculations)
  }

  // 年額報酬計算
  const calculateAnnualPayroll = () => {
    const calculations: PayrollCalculation[] = []

    selectedMembers.forEach((memberId) => {
      const member = members.find((m) => m.id === memberId)
      if (!member) return

      const record = getAnnualPaymentRecord(memberId)
      const baseAmount = record?.baseAmount || RANKS[member.rank].annualBase

      const serviceYearBonus = record?.serviceYearBonus || member.yearsOfService * 2000
      const specialAllowance = record?.specialAllowance || 0

      const totalAmount = baseAmount + serviceYearBonus + specialAllowance

      calculations.push({
        memberId,
        memberName: member.name,
        rank: RANKS[member.rank].name,
        totalAmount,
        details: {
          year: selectedYear,
          baseAmount,
          serviceYearBonus,
          specialAllowance,
          yearsOfService: member.yearsOfService,
          notes: record?.notes || "",
        },
      })
    })

    setPayrollCalculations(calculations)
  }

  const saveCalculation = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (selectedBatch) {
      const totalAmount = payrollCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0)
      const memberCount = payrollCalculations.length

      setPaymentBatches((batches) =>
        batches.map((batch) =>
          batch.id === selectedBatch.id
            ? {
                ...batch,
                totalAmount,
                memberCount,
                status: "editing" as PaymentStatus,
                
              }
            : batch,
        ),
      )
    }

    setIsSaving(false)
    alert("計算結果を保存しました")
  }

  // フィルタリングされた支払いバッチを取得
  const getFilteredBatches = () => {
    if (statusFilter === "all") {
      return paymentBatches
    }
    return paymentBatches.filter(batch => batch.status === statusFilter)
  }

  // サマリー統計を取得
  const getSummaryStats = () => {
    const total = paymentBatches.length
    const editing = paymentBatches.filter(b => b.status === "editing").length
    const confirmed = paymentBatches.filter(b => b.status === "confirmed").length
    const paid = paymentBatches.filter(b => b.status === "paid").length
    
    return { total, editing, confirmed, paid }
  }

  const getMemberPaymentHistory = (memberId: string) => {
    return paymentDetails.filter((detail) => detail.memberId === memberId)
  }

  useEffect(() => {
    if (selectedBatch && selectedMembers.length > 0) {
      if (selectedBatch.type === "dispatch" && selectedIncidents.length > 0) {
        calculateDispatchPayroll()
      } else if (selectedBatch.type === "annual") {
        calculateAnnualPayroll()
      }
    }
  }, [selectedBatch, selectedMembers, selectedIncidents, activityRecords, annualPaymentRecords, selectedYear])

  useEffect(() => {
    if (selectedBatch?.type === "annual") {
      setSelectedMembers(members.map((m) => m.id))
    }
  }, [selectedBatch, members])

  // 支払い管理ページ（デフォルト画面）
  if (currentPage === "management") {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            消防団員支払い管理システム
          </h1>
          <p className="text-muted-foreground">支払いバッチの管理と団員明細の閲覧</p>
        </div>

        {/* 支払いバッチ一覧サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const stats = getSummaryStats()
            return (
              <>
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "all" ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">総支払いバッチ数</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "editing" ? "ring-2 ring-gray-500" : ""}`}
                  onClick={() => setStatusFilter("editing")}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">編集中</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.editing}</p>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "confirmed" ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => setStatusFilter("confirmed")}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">確定済</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "paid" ? "ring-2 ring-green-500" : ""}`}
                  onClick={() => setStatusFilter("paid")}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">支払済</p>
                    <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                  </CardContent>
                </Card>
              </>
            )
          })()}
        </div>

        {/* 支払いバッチ一覧 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  支払いバッチ一覧
                  {statusFilter !== "all" && (
                    <Badge className={PAYMENT_STATUS_COLORS[statusFilter]}>
                      {PAYMENT_STATUS_LABELS[statusFilter]}でフィルタ中
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>出動報酬・年額報酬の支払いを管理します</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-transparent">
                      <Upload className="h-4 w-4 mr-2" />
                      外部データ取込
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>外部データインポート</DialogTitle>
                      <DialogDescription>自治体システムや退職金報酬システムからデータを取り込みます</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>データソース</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="データソースを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="municipality">自治体システム</SelectItem>
                            <SelectItem value="retirement">退職金報酬システム</SelectItem>
                            <SelectItem value="csv">CSVファイル</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>ファイル選択</Label>
                        <Input type="file" accept=".csv,.xlsx" />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1">インポート実行</Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsImportDialogOpen(false)}
                          className="flex-1 bg-transparent"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isCreatingBatch} onOpenChange={setIsCreatingBatch}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      新規支払い作成
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新規支払いバッチ作成</DialogTitle>
                      <DialogDescription>新しい支払いバッチを作成します</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="batchName">支払い名</Label>
                        <Input
                          id="batchName"
                          value={newBatchData.name}
                          onChange={(e) => setNewBatchData({ ...newBatchData, name: e.target.value })}
                          placeholder="例: 2024年2月出動報酬"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="batchType">報酬種別</Label>
                        <Select
                          value={newBatchData.type}
                          onValueChange={(value: PaymentType) => setNewBatchData({ ...newBatchData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dispatch">出動報酬</SelectItem>
                            <SelectItem value="annual">年額報酬</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="batchDescription">説明（任意）</Label>
                        <Textarea
                          id="batchDescription"
                          value={newBatchData.description}
                          onChange={(e) => setNewBatchData({ ...newBatchData, description: e.target.value })}
                          placeholder="支払いの詳細説明"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={createPaymentBatch} className="flex-1">
                          作成
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreatingBatch(false)}
                          className="flex-1 bg-transparent"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const filteredBatches = getFilteredBatches()
                if (filteredBatches.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {statusFilter === "all" 
                          ? "支払いバッチがありません" 
                          : `${PAYMENT_STATUS_LABELS[statusFilter]}の支払いバッチがありません`}
                      </p>
                      <p className="text-sm text-muted-foreground">「新規支払い作成」ボタンから作成してください</p>
                    </div>
                  )
                }
                
                return filteredBatches.map((batch) => (
                  <Card 
                    key={batch.id} 
                    className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openBatchDetail(batch)}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* ヘッダー行 */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{batch.name}</h3>
                              <Badge variant="outline">{PAYMENT_TYPE_LABELS[batch.type]}</Badge>
                              <Badge className={PAYMENT_STATUS_COLORS[batch.status]}>
                                {PAYMENT_STATUS_LABELS[batch.status]}
                              </Badge>
                            </div>
                            {/* 説明文（レスポンシブ省略） */}
                            <p className="text-muted-foreground text-sm overflow-hidden text-ellipsis whitespace-nowrap md:whitespace-normal md:line-clamp-2">
                              {batch.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* 詳細情報 */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">作成日</p>
                            <p className="font-medium">{batch.createdDate.replace(/-/g, '/')}</p>
                          </div>
                          {batch.confirmedDate && (
                            <div>
                              <p className="text-muted-foreground">計算日（確定日）</p>
                              <p className="font-medium">{batch.confirmedDate.replace(/-/g, '/')}</p>
                            </div>
                          )}
                          {batch.scheduledPaymentDate && (
                            <div>
                              <p className="text-muted-foreground">支払い予定日</p>
                              <p className="font-medium">{batch.scheduledPaymentDate.replace(/-/g, '/')}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">対象者数</p>
                            <p className="font-medium">{batch.memberCount}名</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">総支給額</p>
                            <p className="font-medium text-lg">{formatCurrency(batch.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 報酬対象選択画面
  if (currentPage === "reward-selection" && selectedBatch) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeRewardSelection} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                報酬計算に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                報酬対象選択 - {selectedBatch.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</Badge>
              <Badge className={PAYMENT_STATUS_COLORS[selectedBatch.status]}>
                {PAYMENT_STATUS_LABELS[selectedBatch.status]}
              </Badge>
              <span className="text-muted-foreground">{selectedBatch.description}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={closeRewardSelection}
              disabled={selectedBatch.type === "dispatch" && selectedIncidents.length === 0}
            >
              選択完了
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* 年額報酬の場合の年度選択 */}
          {selectedBatch.type === "annual" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  対象年度設定
                </CardTitle>
                <CardDescription>年額報酬の対象年度を設定してください</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetYear">対象年度</Label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}年度
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 出動報酬の場合は事案選択のみ */}
          {selectedBatch.type === "dispatch" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  対象事案選択
                </CardTitle>
                <CardDescription>
                  報酬計算対象とする事案を選択してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 事案検索フィルター */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="incidentSearch">事案名検索</Label>
                    <Input
                      id="incidentSearch"
                      placeholder="事案名で検索..."
                      className="bg-white"
                      value={incidentSearchTerm}
                      onChange={(e) => setIncidentSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incidentType">事案種別</Label>
                    <Select value={incidentTypeFilter} onValueChange={setIncidentTypeFilter}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="すべて" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="fire">火災出動</SelectItem>
                        <SelectItem value="rescue">救助出動</SelectItem>
                        <SelectItem value="emergency">救急支援</SelectItem>
                        <SelectItem value="training">訓練</SelectItem>
                        <SelectItem value="patrol">警戒巡視</SelectItem>
                        <SelectItem value="meeting">会議・点検</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateRange">期間</Label>
                    <Input
                      id="dateRange"
                      type="date"
                      className="bg-white"
                      value={dateRangeFilter}
                      onChange={(e) => setDateRangeFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>データ取得</Label>
                    <Button onClick={fetchIncidents} disabled={isLoadingIncidents} className="w-full">
                      {isLoadingIncidents ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          取得中...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          事案検索
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 選択状況表示 */}
                {selectedIncidents.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      選択中の事案: {selectedIncidents.length}件
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedIncidents.map((incidentId) => {
                        const incident = incidents.find(i => i.id === incidentId)
                        return incident ? (
                          <Badge key={incidentId} variant="secondary" className="text-xs">
                            {incident.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {/* 事案一覧 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {isLoadingIncidents ? "検索中..." : `検索結果: ${incidents.length}件`}
                    </span>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      新規事案登録
                    </Button>
                  </div>

                  {isLoadingIncidents ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">事案データを取得中...</p>
                    </div>
                  ) : (
                    incidents.map((incident) => (
                      <div key={incident.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={incident.id}
                          checked={selectedIncidents.includes(incident.id)}
                          onCheckedChange={(checked) => handleIncidentSelection(incident.id, !!checked)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={incident.id} className="font-medium cursor-pointer">
                              {incident.name}
                            </Label>
                            <Badge variant="outline">{INCIDENT_TYPES[incident.type].name}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              日時: {incident.date} ({incident.duration}時間)
                            </p>
                            <p>危険度: レベル{incident.riskLevel}</p>
                            <p>参加者: {incident.participants.length}名</p>
                            <p>{incident.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // 報酬集計機能画面（旧：支払いバッチ詳細画面）
  if (currentPage === "batch-detail" && selectedBatch) {
    const batchDetails = getBatchPaymentDetails(selectedBatch.id)

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeBatchDetail} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                支払い管理に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                報酬集計 - {selectedBatch.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</Badge>
              <Badge className={PAYMENT_STATUS_COLORS[selectedBatch.status]}>
                {PAYMENT_STATUS_LABELS[selectedBatch.status]}
              </Badge>
              <span className="text-muted-foreground">{selectedBatch.description}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openCalculation(selectedBatch)}
              className="bg-transparent"
            >
              <Calculator className="h-4 w-4 mr-2" />
              報酬計算
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBulkExport}
              className="bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              一括で明細を出力する
            </Button>
            
            {/* ステータス別の操作ボタン */}
            {selectedBatch.status === "editing" && (
              <>
                <Dialog open={isConfirmingStatus} onOpenChange={setIsConfirmingStatus}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      支払いを確定する
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>支払い確定の確認</DialogTitle>
                      <DialogDescription>
                        支払いを確定すると、内容の編集ができなくなります。支払い予定日を入力して確定してください。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduledDate">支払い予定日</Label>
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={scheduledPaymentDate}
                          onChange={(e) => setScheduledPaymentDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleConfirmStatus} 
                          disabled={!scheduledPaymentDate}
                          className="flex-1"
                        >
                          確定する
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsConfirmingStatus(false)
                            setScheduledPaymentDate("")
                          }}
                          className="flex-1 bg-transparent"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  onClick={() => {
                    deleteBatch(selectedBatch.id)
                    closeBatchDetail()
                  }}
                  className="bg-transparent text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </>
            )}
            
            {selectedBatch.status === "confirmed" && (
              <Button 
                onClick={handleMarkAsPaid}
                className="bg-green-600 hover:bg-green-700"
              >
                支払い済みにする
              </Button>
            )}
          </div>
        </div>

        {/* 報酬集計（全体サマリー） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              報酬集計（全体サマリー）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">対象者</p>
                <p className="text-3xl font-bold text-blue-600">{batchDetails.length}<span className="text-lg text-muted-foreground ml-1">名</span></p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">総支給額</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(batchDetails.reduce((sum, detail) => sum + detail.totalAmount, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">平均支給額</p>
                <p className="text-3xl font-bold text-orange-600">
                  {batchDetails.length > 0
                    ? formatCurrency(
                        batchDetails.reduce((sum, detail) => sum + detail.totalAmount, 0) / batchDetails.length,
                      )
                    : formatCurrency(0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">報酬種別</p>
                <p className="text-3xl font-bold text-purple-600">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 団員ごとの報酬サマリー */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              団員ごとの報酬サマリー
            </CardTitle>
            <CardDescription>団員一人ひとりの支払い合計額を一覧表示します</CardDescription>
          </CardHeader>
          <CardContent>
            {batchDetails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">このバッチには支払い明細がありません</p>
                <p className="text-sm text-muted-foreground">報酬計算を実行して明細を作成してください</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>団員名</TableHead>
                      <TableHead>階級</TableHead>
                      {selectedBatch.type === "dispatch" && (
                        <TableHead>総活動時間</TableHead>
                      )}
                      <TableHead>報酬額</TableHead>
                      <TableHead>源泉徴収額</TableHead>
                      <TableHead>その他控除額</TableHead>
                      <TableHead>振込額</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchDetails.map((detail) => {
                      // 合計値を計算
                      const totalAllowances = detail.breakdown.allowances.reduce((sum, a) => sum + a.amount, 0)
                      const totalDeductions = detail.breakdown.deductions.reduce((sum, d) => sum + d.amount, 0)
                      const totalIncidentHours = detail.breakdown.incidents?.reduce((sum, i) => sum + i.hours, 0) || 0
                      // 源泉徴収額を計算（報酬額の10.21%と仮定）
                      const withholdingTax = Math.floor((detail.breakdown.baseAmount + totalAllowances) * 0.1021)
                      const transferAmount = detail.breakdown.baseAmount + totalAllowances - withholdingTax - totalDeductions
                      
                      return (
                        <TableRow 
                          key={detail.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => openMemberDetail(detail.memberId)}
                        >
                          <TableCell className="font-medium">{detail.memberName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{detail.rank}</Badge>
                          </TableCell>
                          {selectedBatch.type === "dispatch" && (
                            <TableCell>{totalIncidentHours}時間</TableCell>
                          )}
                          <TableCell>{formatCurrency(detail.breakdown.baseAmount + totalAllowances)}</TableCell>
                          <TableCell>{formatCurrency(withholdingTax)}</TableCell>
                          <TableCell>{formatCurrency(totalDeductions)}</TableCell>
                          <TableCell className="font-semibold text-blue-600">
                            {formatCurrency(transferAmount)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation()
                                openMemberDetail(detail.memberId)
                              }}
                            >
                              <Receipt className="h-4 w-4 mr-1" />
                              明細
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 団員個人の明細閲覧ページ
  if (currentPage === "member-detail" && selectedMemberId) {
    const member = members.find((m) => m.id === selectedMemberId)
    const memberPayments = getMemberPaymentHistory(selectedMemberId)

    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeMemberDetail} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                一覧に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6 text-green-600" />
                報酬明細 - {member?.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{member ? RANKS[member.rank].name : ""}</Badge>
              <span className="text-muted-foreground">勤続年数: {member?.yearsOfService}年</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => alert("明細出力機能は開発中です")}
              className="bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              明細を出力する
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">今年度支給総額</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(memberPayments.reduce((sum, payment) => sum + payment.totalAmount, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">支給回数</p>
              <p className="text-2xl font-bold text-green-600">{memberPayments.length}回</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">最新支給日</p>
              <p className="text-2xl font-bold text-orange-600">
                {paymentBatches.find((b) => b.id === memberPayments[0]?.batchId)?.paymentDate || "未支給"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {memberPayments.map((payment) => {
            const batch = paymentBatches.find((b) => b.id === payment.batchId)
            return (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {batch?.name}
                        <Badge variant="outline">{PAYMENT_TYPE_LABELS[batch?.type || "dispatch"]}</Badge>
                      </CardTitle>
                      <CardDescription>
                        支給日: {batch?.paymentDate || "未支給"} | 総額: {formatCurrency(payment.totalAmount)}
                      </CardDescription>
                    </div>
                    <Badge className={PAYMENT_STATUS_COLORS[batch?.status || "editing"]}>
                      {PAYMENT_STATUS_LABELS[batch?.status || "editing"]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">基本額</p>
                        <p className="font-semibold">{formatCurrency(payment.breakdown.baseAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">手当合計</p>
                        <p className="font-semibold">
                          {formatCurrency(payment.breakdown.allowances.reduce((sum, a) => sum + a.amount, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">控除合計</p>
                        <p className="font-semibold">
                          {formatCurrency(payment.breakdown.deductions.reduce((sum, d) => sum + d.amount, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">支給額</p>
                        <p className="font-semibold text-lg">{formatCurrency(payment.totalAmount)}</p>
                      </div>
                    </div>

                    {payment.breakdown.allowances.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">手当詳細</h4>
                        <div className="space-y-1">
                          {payment.breakdown.allowances.map((allowance, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{allowance.name}</span>
                              <span>{formatCurrency(allowance.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {payment.breakdown.incidents && payment.breakdown.incidents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">出動詳細</h4>
                        <div className="space-y-1">
                          {payment.breakdown.incidents.map((incident, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {incident.name} ({incident.hours}時間)
                              </span>
                              <span>{formatCurrency(incident.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // 報酬計算機能画面（旧：給与計算画面）
  if (currentPage === "calculation" && selectedBatch) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeCalculation} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                報酬集計に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calculator className="h-6 w-6 text-blue-600" />
                報酬計算 - {selectedBatch.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</Badge>
              <Badge className={PAYMENT_STATUS_COLORS[selectedBatch.status]}>
                {PAYMENT_STATUS_LABELS[selectedBatch.status]}
              </Badge>
              <span className="text-muted-foreground">{selectedBatch.description}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleBulkExport}
              className="bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              一括で明細を出力する
            </Button>
            
            {/* ステータス別の操作ボタン */}
            {selectedBatch.status === "editing" && (
              <>
                <Dialog open={isConfirmingStatus} onOpenChange={setIsConfirmingStatus}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      支払いを確定する
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>支払い確定の確認</DialogTitle>
                      <DialogDescription>
                        支払いを確定すると、内容の編集ができなくなります。支払い予定日を入力して確定してください。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduledDate">支払い予定日</Label>
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={scheduledPaymentDate}
                          onChange={(e) => setScheduledPaymentDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleConfirmStatus} 
                          disabled={!scheduledPaymentDate}
                          className="flex-1"
                        >
                          確定する
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsConfirmingStatus(false)
                            setScheduledPaymentDate("")
                          }}
                          className="flex-1 bg-transparent"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  onClick={() => {
                    deleteBatch(selectedBatch.id)
                    closeCalculation()
                  }}
                  className="bg-transparent text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </>
            )}
            
            {selectedBatch.status === "confirmed" && (
              <Button 
                onClick={handleMarkAsPaid}
                className="bg-green-600 hover:bg-green-700"
              >
                支払い済みにする
              </Button>
            )}
            
            {selectedBatch.status === "editing" && (
              <Button onClick={saveCalculation} disabled={isSaving || payrollCalculations.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : "計算結果を保存"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">{/* タブを削除して一画面表示に変更 */}

          {/* 選択済み報酬対象の表示 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    選択済み報酬対象
                  </CardTitle>
                  <CardDescription>
                    現在選択されている報酬対象を表示します
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => openRewardSelection(selectedBatch)}
                  className="bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  報酬対象を選択
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* 選択状況の表示 */}
              {selectedBatch.type === "dispatch" ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    選択中の事案: {selectedIncidents.length}件
                  </p>
                  {selectedIncidents.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedIncidents.map((incidentId) => {
                        const incident = incidents.find(i => i.id === incidentId)
                        return incident ? (
                          <Badge key={incidentId} variant="secondary" className="text-xs">
                            {incident.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    対象年度: {selectedYear}年度
                  </p>
                  <p className="text-sm text-muted-foreground">
                    対象者: {selectedMembers.length}名
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 報酬計算一覧 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                報酬計算一覧
              </CardTitle>
              <CardDescription>
                {selectedBatch.type === "annual" ? "年額報酬の支給計算を行います" : "出動報酬の支給計算を行います"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedBatch.type === "dispatch" && selectedIncidents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">報酬対象を選択してから計算を行ってください</p>
                </div>
              ) : selectedBatch.type === "annual" && selectedMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">対象年度を設定してから計算を行ってください</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>団員名</TableHead>
                        {selectedBatch.type === "annual" && <TableHead>年額報酬名</TableHead>}
                        {selectedBatch.type === "dispatch" && <TableHead>事案名</TableHead>}
                        {selectedBatch.type === "dispatch" && <TableHead>活動種別</TableHead>}
                        {selectedBatch.type === "dispatch" && <TableHead>活動時間</TableHead>}
                        <TableHead>報酬額</TableHead>
                        <TableHead>源泉徴収額</TableHead>
                        <TableHead>その他控除額</TableHead>
                        <TableHead>振込額</TableHead>
                        <TableHead>備考</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBatch.type === "annual"
                        ? selectedMembers.map((memberId) => {
                            const member = members.find((m) => m.id === memberId)
                            const record = getAnnualPaymentRecord(memberId)
                            if (!member) return null

                            const baseAmount = record?.baseAmount || RANKS[member.rank].annualBase
                            const serviceYearBonus = record?.serviceYearBonus || member.yearsOfService * 2000
                            const specialAllowance = record?.specialAllowance || 0
                            const totalReward = baseAmount + serviceYearBonus + specialAllowance
                            const withholdingTax = Math.floor(totalReward * 0.1021)
                            const otherDeductions = 0
                            const transferAmount = totalReward - withholdingTax - otherDeductions

                            return (
                              <TableRow key={memberId}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>年額報酬</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={totalReward}
                                    onChange={(e) =>
                                      updateAnnualPaymentRecord(
                                        memberId,
                                        "baseAmount",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-32"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" value={withholdingTax} className="w-32" readOnly />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" value={otherDeductions} className="w-32" />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={transferAmount}
                                    className="w-32 font-bold"
                                    readOnly
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={record?.notes || ""}
                                    onChange={(e) => updateAnnualPaymentRecord(memberId, "notes", e.target.value)}
                                    placeholder="備考"
                                    className="w-32"
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })
                        : selectedMembers.map((memberId) =>
                            selectedIncidents.map((incidentId) => {
                              const member = members.find((m) => m.id === memberId)
                              const incident = incidents.find((i) => i.id === incidentId)
                              const record = getActivityRecord(memberId, incidentId)

                              if (!member || !incident) return null

                              const hours = record?.participationHours || 0
                              const incidentType = INCIDENT_TYPES[incident.type]
                              const rankMultiplier = RANKS[member.rank].multiplier
                              const baseReward = incidentType.baseRate * rankMultiplier * hours
                              const riskReward =
                                baseReward * (incidentType.riskMultiplier - 1) * incident.riskLevel * 0.1
                              const totalReward = baseReward + riskReward
                              const withholdingTax = record?.withholdingTax || Math.floor(totalReward * 0.1021)
                              const otherDeductions = record?.otherDeductions || 0
                              const transferAmount = totalReward - withholdingTax - otherDeductions

                              return (
                                <TableRow key={`${memberId}-${incidentId}`}>
                                  <TableCell className="font-medium">{member.name}</TableCell>
                                  <TableCell>{incident.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{INCIDENT_TYPES[incident.type].name}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={incident.duration}
                                      step="0.5"
                                      value={hours}
                                      onChange={(e) => {
                                        const newHours = Number.parseFloat(e.target.value) || 0
                                        updateActivityRecord(memberId, incidentId, "participationHours", newHours)
                                        // 時間変更時に報酬額も自動更新
                                        const newBaseReward = incidentType.baseRate * rankMultiplier * newHours
                                        const newRiskReward =
                                          newBaseReward * (incidentType.riskMultiplier - 1) * incident.riskLevel * 0.1
                                        const newTotalReward = newBaseReward + newRiskReward
                                        updateActivityRecord(memberId, incidentId, "rewardAmount", newTotalReward)
                                      }}
                                      className="w-20"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={record?.rewardAmount || totalReward}
                                      onChange={(e) =>
                                        updateActivityRecord(
                                          memberId,
                                          incidentId,
                                          "rewardAmount",
                                          Number.parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-32"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={withholdingTax}
                                      onChange={(e) =>
                                        updateActivityRecord(
                                          memberId,
                                          incidentId,
                                          "withholdingTax",
                                          Number.parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-32"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={otherDeductions}
                                      onChange={(e) =>
                                        updateActivityRecord(
                                          memberId,
                                          incidentId,
                                          "otherDeductions",
                                          Number.parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-32"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={record?.transferAmount || transferAmount}
                                      onChange={(e) =>
                                        updateActivityRecord(
                                          memberId,
                                          incidentId,
                                          "transferAmount",
                                          Number.parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-32 font-bold"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={record?.notes || ""}
                                      onChange={(e) =>
                                        updateActivityRecord(memberId, incidentId, "notes", e.target.value)
                                      }
                                      placeholder="備考"
                                      className="w-32"
                                    />
                                  </TableCell>
                                </TableRow>
                              )
                            }),
                          )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 報酬対象選択画面
  if (currentPage === "reward-selection" && selectedBatch) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeRewardSelection} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                報酬計算に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                報酬対象選択 - {selectedBatch.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</Badge>
              <Badge className={PAYMENT_STATUS_COLORS[selectedBatch.status]}>
                {PAYMENT_STATUS_LABELS[selectedBatch.status]}
              </Badge>
            </div>
          </div>
        </div>

        {selectedBatch.type === "dispatch" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                出動事案選択
              </CardTitle>
              <CardDescription>出動報酬の対象となる事案を選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <Card key={incident.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedIncidents.includes(incident.id)}
                            onCheckedChange={(checked) => 
                              handleIncidentSelection(incident.id, checked as boolean)
                            }
                          />
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{incident.name}</h4>
                              <Badge variant="outline">
                                {INCIDENT_TYPES[incident.type].name}
                              </Badge>
                              <Badge variant={incident.riskLevel > 3 ? "destructive" : "secondary"}>
                                危険度{incident.riskLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{incident.description}</p>
                            <div className="flex gap-4 text-sm">
                              <span>日時: {incident.date}</span>
                              <span>活動時間: {incident.duration}時間</span>
                              <span>参加者: {incident.participants.length}名</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                対象年度設定
              </CardTitle>
              <CardDescription>年額報酬の対象年度を設定してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetYear">対象年度</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}年度
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // 支払いバッチ詳細画面（報酬集計）
  if (currentPage === "batch-detail" && selectedBatch) {
    const batchPaymentDetails = getBatchPaymentDetails(selectedBatch.id)
    
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeBatchDetail} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                一覧に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-green-600" />
                報酬集計 - {selectedBatch.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</Badge>
              <Badge className={PAYMENT_STATUS_COLORS[selectedBatch.status]}>
                {PAYMENT_STATUS_LABELS[selectedBatch.status]}
              </Badge>
              <span className="text-muted-foreground">{selectedBatch.description}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleBulkExport}
              className="bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              一括で明細を出力する
            </Button>
            
            {/* ステータス別の操作ボタン */}
            {selectedBatch.status === "editing" && (
              <>
                <Button 
                  onClick={() => openCalculation(selectedBatch)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  報酬計算
                </Button>
                <Dialog open={isConfirmingStatus} onOpenChange={setIsConfirmingStatus}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      支払いを確定する
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>支払い確定の確認</DialogTitle>
                      <DialogDescription>
                        支払いを確定すると、内容の編集ができなくなります。支払い予定日を入力して確定してください。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduledDate">支払い予定日</Label>
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={scheduledPaymentDate}
                          onChange={(e) => setScheduledPaymentDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleConfirmStatus} 
                          disabled={!scheduledPaymentDate}
                          className="flex-1"
                        >
                          確定する
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsConfirmingStatus(false)
                            setScheduledPaymentDate("")
                          }}
                          className="flex-1 bg-transparent"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  onClick={() => {
                    deleteBatch(selectedBatch.id)
                    closeBatchDetail()
                  }}
                  className="bg-transparent text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </>
            )}
            
            {selectedBatch.status === "confirmed" && (
              <Button 
                onClick={handleMarkAsPaid}
                className="bg-green-600 hover:bg-green-700"
              >
                支払い済みにする
              </Button>
            )}
          </div>
        </div>

        {/* 集計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">対象者数</p>
              <p className="text-2xl font-bold text-blue-600">{selectedBatch.memberCount}名</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">総支給額</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedBatch.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">平均支給額</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(Math.floor(selectedBatch.totalAmount / selectedBatch.memberCount))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">支払い予定日</p>
              <p className="text-2xl font-bold text-purple-600">
                {selectedBatch.scheduledPaymentDate?.replace(/-/g, '/') || "未設定"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 団員別支給明細 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              団員別支給明細
            </CardTitle>
            <CardDescription>各団員の支給詳細を確認できます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>団員名</TableHead>
                    <TableHead>階級</TableHead>
                    <TableHead>基本額</TableHead>
                    <TableHead>手当合計</TableHead>
                    <TableHead>控除合計</TableHead>
                    <TableHead>支給額</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchPaymentDetails.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell className="font-medium">{detail.memberName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{detail.rank}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(detail.breakdown.baseAmount)}</TableCell>
                      <TableCell>
                        {formatCurrency(detail.breakdown.allowances.reduce((sum, a) => sum + a.amount, 0))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(detail.breakdown.deductions.reduce((sum, d) => sum + d.amount, 0))}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(detail.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMemberDetail(detail.memberId)}
                          className="bg-transparent"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 団員個人の明細閲覧ページ
  if (currentPage === "member-detail" && selectedMemberId) {
    const member = members.find((m) => m.id === selectedMemberId)
    const memberPayments = getMemberPaymentHistory(selectedMemberId)

    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeMemberDetail} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                一覧に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6 text-green-600" />
                報酬明細 - {member?.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{member ? RANKS[member.rank].name : ""}</Badge>
              <span className="text-muted-foreground">勤続年数: {member?.yearsOfService}年</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => alert("明細出力機能は開発中です")}
              className="bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              明細を出力する
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">今年度支給総額</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(memberPayments.reduce((sum, payment) => sum + payment.totalAmount, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">支給回数</p>
              <p className="text-2xl font-bold text-green-600">{memberPayments.length}回</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">最新支給日</p>
              <p className="text-2xl font-bold text-orange-600">
                {paymentBatches.find((b) => b.id === memberPayments[0]?.batchId)?.paymentDate || "未支給"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {memberPayments.map((payment) => {
            const batch = paymentBatches.find((b) => b.id === payment.batchId)
            return (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {batch?.name}
                        <Badge variant="outline">{PAYMENT_TYPE_LABELS[batch?.type || "dispatch"]}</Badge>
                      </CardTitle>
                      <CardDescription>
                        支給日: {batch?.paymentDate || "未支給"} | 総額: {formatCurrency(payment.totalAmount)}
                      </CardDescription>
                    </div>
                    <Badge className={PAYMENT_STATUS_COLORS[batch?.status || "editing"]}>
                      {PAYMENT_STATUS_LABELS[batch?.status || "editing"]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">基本額</p>
                        <p className="font-semibold">{formatCurrency(payment.breakdown.baseAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">手当合計</p>
                        <p className="font-semibold">
                          {formatCurrency(payment.breakdown.allowances.reduce((sum, a) => sum + a.amount, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">控除合計</p>
                        <p className="font-semibold">
                          {formatCurrency(payment.breakdown.deductions.reduce((sum, d) => sum + d.amount, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">支給額</p>
                        <p className="font-semibold text-lg">{formatCurrency(payment.totalAmount)}</p>
                      </div>
                    </div>

                    {payment.breakdown.allowances.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">手当詳細</h4>
                        <div className="space-y-1">
                          {payment.breakdown.allowances.map((allowance, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{allowance.name}</span>
                              <span>{formatCurrency(allowance.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {payment.breakdown.incidents && payment.breakdown.incidents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">出動詳細</h4>
                        <div className="space-y-1">
                          {payment.breakdown.incidents.map((incident, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {incident.name} ({incident.hours}時間)
                              </span>
                              <span>{formatCurrency(incident.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }



  return null
}
