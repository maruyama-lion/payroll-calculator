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
} from "lucide-react"

// 支払い種別
type PaymentType = "dispatch" | "annual"

// 支払い状態
type PaymentStatus = "draft" | "confirmed" | "paid" | "cancelled"

// 現在のページ
type CurrentPage = "management" | "calculation"

// 支払いバッチ
interface PaymentBatch {
  id: string
  name: string
  type: PaymentType
  status: PaymentStatus
  createdDate: string
  paymentDate?: string
  description: string
  totalAmount: number
  memberCount: number
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
  participants: string[] // 参加団員IDの配列を追加
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
  participationHours: number
  leadershipRole: boolean
  specialEquipmentUsed: boolean
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
  draft: "作成中",
  confirmed: "確定",
  paid: "支払済",
  cancelled: "取消",
}

const PAYMENT_STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  confirmed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function Component() {
  // ページ管理
  const [currentPage, setCurrentPage] = useState<CurrentPage>("management")
  const [selectedBatch, setSelectedBatch] = useState<PaymentBatch | null>(null)

  // サンプルデータ
  const [incidents] = useState<Incident[]>([
    {
      id: "inc001",
      name: "住宅火災（○○町）",
      type: "fire",
      date: "2024-01-15",
      duration: 4,
      riskLevel: 3,
      description: "2階建て住宅火災、延焼防止活動",
      participants: ["mem001", "mem002", "mem003", "mem004"], // 参加団員IDを追加
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
    {
      id: "inc004",
      name: "救急支援",
      type: "emergency",
      date: "2024-01-22",
      duration: 1,
      riskLevel: 1,
      description: "救急車支援活動",
      participants: ["mem002", "mem004"],
    },
  ])

  const [members] = useState<Member[]>([
    { id: "mem001", name: "田中 太郎", rank: "chief", yearsOfService: 15, joinDate: "2009-04-01" },
    { id: "mem002", name: "佐藤 次郎", rank: "lieutenant", yearsOfService: 8, joinDate: "2016-04-01" },
    { id: "mem003", name: "鈴木 三郎", rank: "sergeant", yearsOfService: 5, joinDate: "2019-04-01" },
    { id: "mem004", name: "高橋 四郎", rank: "member", yearsOfService: 3, joinDate: "2021-04-01" },
    { id: "mem005", name: "渡辺 五郎", rank: "member", yearsOfService: 2, joinDate: "2022-04-01" },
  ])

  // 支払いバッチ管理
  const [paymentBatches, setPaymentBatches] = useState<PaymentBatch[]>([
    {
      id: "pay001",
      name: "2024年1月出動報酬",
      type: "dispatch",
      status: "confirmed",
      createdDate: "2024-01-25",
      paymentDate: "2024-01-31",
      description: "1月の火災・救助出動に対する報酬",
      totalAmount: 125000,
      memberCount: 5,
    },
    {
      id: "pay002",
      name: "2024年度年額報酬",
      type: "annual",
      status: "draft",
      createdDate: "2024-01-01",
      description: "2024年度の年額基本報酬",
      totalAmount: 350000,
      memberCount: 5,
    },
    {
      id: "pay003",
      name: "2024年2月出動報酬",
      type: "dispatch",
      status: "draft",
      createdDate: "2024-02-01",
      description: "2月の訓練・出動に対する報酬",
      totalAmount: 0,
      memberCount: 0,
    },
  ])

  const [isCreatingBatch, setIsCreatingBatch] = useState(false)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const createPaymentBatch = () => {
    const newBatch: PaymentBatch = {
      id: `pay${Date.now()}`,
      name: newBatchData.name,
      type: newBatchData.type,
      status: "draft",
      createdDate: new Date().toISOString().split("T")[0],
      description: newBatchData.description,
      totalAmount: 0,
      memberCount: 0,
    }
    setPaymentBatches([...paymentBatches, newBatch])
    setIsCreatingBatch(false)
    setNewBatchData({ name: "", type: "dispatch", description: "" })
  }

  const updatePaymentBatchStatus = (batchId: string, status: PaymentStatus) => {
    setPaymentBatches((batches) => batches.map((batch) => (batch.id === batchId ? { ...batch, status } : batch)))
  }

  const deleteBatch = (batchId: string) => {
    setPaymentBatches((batches) => batches.filter((batch) => batch.id !== batchId))
  }

  const openCalculation = (batch: PaymentBatch) => {
    setSelectedBatch(batch)
    setCurrentPage("calculation")
    // 計算データをリセット
    setSelectedIncidents([])
    setSelectedMembers([])
    setActivityRecords([])
    setAnnualPaymentRecords([])
    setPayrollCalculations([])
  }

  const closeCalculation = () => {
    setCurrentPage("management")
    setSelectedBatch(null)
  }

  const handleIncidentSelection = (incidentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIncidents([...selectedIncidents, incidentId])

      // 選択された事案の参加団員を自動で追加
      const incident = incidents.find((i) => i.id === incidentId)
      if (incident) {
        const newParticipants = incident.participants.filter((memberId) => !selectedMembers.includes(memberId))
        setSelectedMembers([...selectedMembers, ...newParticipants])
      }
    } else {
      setSelectedIncidents(selectedIncidents.filter((id) => id !== incidentId))

      // 事案の選択を解除した場合、その事案にのみ参加していた団員を除外
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

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId])
    } else {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
      setActivityRecords(activityRecords.filter((record) => record.memberId !== memberId))
    }
  }

  const updateActivityRecord = (memberId: string, incidentId: string, field: keyof ActivityRecord, value: any) => {
    const existingIndex = activityRecords.findIndex(
      (record) => record.memberId === memberId && record.incidentId === incidentId,
    )

    if (existingIndex >= 0) {
      const updated = [...activityRecords]
      updated[existingIndex] = { ...updated[existingIndex], [field]: value }
      setActivityRecords(updated)
    } else {
      const newRecord: ActivityRecord = {
        memberId,
        incidentId,
        participationHours: 0,
        leadershipRole: false,
        specialEquipmentUsed: false,
        notes: "",
        [field]: value,
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
      let leadershipAllowance = 0
      let equipmentAllowance = 0
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

        if (record.leadershipRole) {
          leadershipAllowance += basePayForIncident * 0.2
        }

        if (record.specialEquipmentUsed) {
          equipmentAllowance += 1000 * hours
        }

        totalHours += hours
        const totalPayForIncident =
          basePayForIncident +
          riskPayForIncident +
          (record.leadershipRole ? basePayForIncident * 0.2 : 0) +
          (record.specialEquipmentUsed ? 1000 * hours : 0)

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
    // 模擬的な保存処理
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 支払いバッチの総額と人数を更新
    if (selectedBatch) {
      const totalAmount = payrollCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0)
      const memberCount = payrollCalculations.length

      setPaymentBatches((batches) =>
        batches.map((batch) => (batch.id === selectedBatch.id ? { ...batch, totalAmount, memberCount } : batch)),
      )
    }

    setIsSaving(false)
    alert("計算結果を保存しました")
  }

  const getStatusActions = (batch: PaymentBatch) => {
    switch (batch.status) {
      case "draft":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updatePaymentBatchStatus(batch.id, "confirmed")}
              className="bg-transparent"
            >
              確定
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updatePaymentBatchStatus(batch.id, "cancelled")}
              className="bg-transparent text-red-600 hover:text-red-700"
            >
              取消
            </Button>
          </div>
        )
      case "confirmed":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updatePaymentBatchStatus(batch.id, "paid")}
              className="bg-transparent text-green-600 hover:text-green-700"
            >
              支払完了
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updatePaymentBatchStatus(batch.id, "draft")}
              className="bg-transparent"
            >
              編集に戻す
            </Button>
          </div>
        )
      case "paid":
        return <Badge className="bg-green-100 text-green-800">支払済</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">取消済</Badge>
      default:
        return null
    }
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

  // selectedBatchが変更された時の処理を追加
  useEffect(() => {
    if (selectedBatch?.type === "annual") {
      // 年額報酬の場合は全団員を自動選択
      setSelectedMembers(members.map((m) => m.id))
    }
  }, [selectedBatch, members])

  // 支払い管理ページ
  if (currentPage === "management") {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            消防団員給与管理システム
          </h1>
          <p className="text-muted-foreground">支払いバッチの管理と給与計算</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  支払いバッチ管理
                </CardTitle>
                <CardDescription>出動報酬・年額報酬の支払いを管理します</CardDescription>
              </div>
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
                      <Label htmlFor="batchName">支払い名称</Label>
                      <Input
                        id="batchName"
                        value={newBatchData.name}
                        onChange={(e) => setNewBatchData({ ...newBatchData, name: e.target.value })}
                        placeholder="例: 2024年2月出動報酬"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batchType">支払い種別</Label>
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
                      <Label htmlFor="batchDescription">説明</Label>
                      <Input
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentBatches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">支払いバッチがありません</p>
                  <p className="text-sm text-muted-foreground">「新規支払い作成」ボタンから作成してください</p>
                </div>
              ) : (
                paymentBatches.map((batch) => (
                  <Card key={batch.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{batch.name}</h3>
                            <Badge variant="outline">{PAYMENT_TYPE_LABELS[batch.type]}</Badge>
                            <Badge className={PAYMENT_STATUS_COLORS[batch.status]}>
                              {PAYMENT_STATUS_LABELS[batch.status]}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{batch.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">作成日</p>
                              <p className="font-medium">{batch.createdDate}</p>
                            </div>
                            {batch.paymentDate && (
                              <div>
                                <p className="text-muted-foreground">支払日</p>
                                <p className="font-medium">{batch.paymentDate}</p>
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
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCalculation(batch)}
                              className="bg-transparent"
                            >
                              <Calculator className="h-4 w-4 mr-1" />
                              給与計算
                            </Button>
                            <Button variant="outline" size="sm" className="bg-transparent">
                              <Eye className="h-4 w-4 mr-1" />
                              詳細
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            {batch.status !== "cancelled" && batch.status !== "paid" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteBatch(batch.id)}
                                className="bg-transparent text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                削除
                              </Button>
                            )}
                          </div>
                          <div className="mt-2">{getStatusActions(batch)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">総支払いバッチ数</p>
              <p className="text-2xl font-bold text-blue-600">{paymentBatches.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">作成中</p>
              <p className="text-2xl font-bold text-gray-600">
                {paymentBatches.filter((b) => b.status === "draft").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">確定済</p>
              <p className="text-2xl font-bold text-blue-600">
                {paymentBatches.filter((b) => b.status === "confirmed").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">支払済</p>
              <p className="text-2xl font-bold text-green-600">
                {paymentBatches.filter((b) => b.status === "paid").length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 給与計算ページ
  if (currentPage === "calculation" && selectedBatch) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={closeCalculation} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                支払い管理に戻る
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calculator className="h-6 w-6 text-blue-600" />
                給与計算 - {selectedBatch.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</Badge>
              <span className="text-muted-foreground">{selectedBatch.description}</span>
            </div>
          </div>
          <Button onClick={saveCalculation} disabled={isSaving || payrollCalculations.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "計算結果を保存"}
          </Button>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">計算設定</TabsTrigger>
            <TabsTrigger value="input">詳細入力</TabsTrigger>
            <TabsTrigger value="results">計算結果</TabsTrigger>
          </TabsList>

          {/* 計算設定 */}
          <TabsContent value="setup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 年額報酬の場合のみ団員選択を表示 */}
              {selectedBatch.type === "annual" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      対象団員選択
                    </CardTitle>
                    <CardDescription>年額報酬の対象団員を選択してください</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={member.id}
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={(checked) => handleMemberSelection(member.id, !!checked)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={member.id} className="font-medium cursor-pointer">
                              {member.name}
                            </Label>
                            <Badge>{RANKS[member.rank].name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">勤続年数: {member.yearsOfService}年</p>
                        </div>
                      </div>
                    ))}
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
                      給与計算対象とする事案を選択してください（参加団員は自動で含まれます）
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {incidents.map((incident) => (
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
                          {selectedIncidents.includes(incident.id) && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-sm font-medium text-blue-800">参加団員:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {incident.participants.map((memberId) => {
                                  const member = members.find((m) => m.id === memberId)
                                  return member ? (
                                    <Badge key={memberId} variant="secondary" className="text-xs">
                                      {member.name}
                                    </Badge>
                                  ) : null
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 出動報酬で事案が選択されている場合、参加団員一覧を表示 */}
              {selectedBatch.type === "dispatch" && selectedIncidents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      参加団員一覧
                    </CardTitle>
                    <CardDescription>選択された事案に参加した団員一覧</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedMembers.map((memberId) => {
                        const member = members.find((m) => m.id === memberId)
                        if (!member) return null

                        // この団員が参加した事案を取得
                        const participatedIncidents = selectedIncidents.filter((incidentId) => {
                          const incident = incidents.find((i) => i.id === incidentId)
                          return incident?.participants.includes(memberId)
                        })

                        return (
                          <div key={memberId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              <Badge>{RANKS[member.rank].name}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              参加事案: {participatedIncidents.length}件
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

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
            </div>
          </TabsContent>

          {/* 詳細入力 */}
          <TabsContent value="input" className="space-y-6">
            {selectedMembers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">対象団員を選択してから詳細入力を行ってください</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>詳細入力</CardTitle>
                  <CardDescription>
                    {selectedBatch.type === "annual"
                      ? "年額報酬の詳細を入力してください"
                      : "活動実績の詳細を入力してください"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedBatch.type === "annual" ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>団員名</TableHead>
                            <TableHead>基本年額</TableHead>
                            <TableHead>勤続年数加算</TableHead>
                            <TableHead>特別手当</TableHead>
                            <TableHead>備考</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedMembers.map((memberId) => {
                            const member = members.find((m) => m.id === memberId)
                            const record = getAnnualPaymentRecord(memberId)
                            if (!member) return null

                            return (
                              <TableRow key={memberId}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={record?.baseAmount || RANKS[member.rank].annualBase}
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
                                  <Input
                                    type="number"
                                    value={record?.serviceYearBonus || member.yearsOfService * 2000}
                                    onChange={(e) =>
                                      updateAnnualPaymentRecord(
                                        memberId,
                                        "serviceYearBonus",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-32"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={record?.specialAllowance || 0}
                                    onChange={(e) =>
                                      updateAnnualPaymentRecord(
                                        memberId,
                                        "specialAllowance",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-32"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={record?.notes || ""}
                                    onChange={(e) => updateAnnualPaymentRecord(memberId, "notes", e.target.value)}
                                    placeholder="備考"
                                    className="w-40"
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : selectedIncidents.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">対象事案を選択してから活動実績を入力してください</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>団員名</TableHead>
                            <TableHead>事案名</TableHead>
                            <TableHead>参加時間</TableHead>
                            <TableHead>指揮役</TableHead>
                            <TableHead>特殊装備</TableHead>
                            <TableHead>備考</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedMembers.map((memberId) =>
                            selectedIncidents.map((incidentId) => {
                              const member = members.find((m) => m.id === memberId)
                              const incident = incidents.find((i) => i.id === incidentId)
                              const record = getActivityRecord(memberId, incidentId)

                              return (
                                <TableRow key={`${memberId}-${incidentId}`}>
                                  <TableCell className="font-medium">{member?.name}</TableCell>
                                  <TableCell>{incident?.name}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={incident?.duration}
                                      step="0.5"
                                      value={record?.participationHours || 0}
                                      onChange={(e) =>
                                        updateActivityRecord(
                                          memberId,
                                          incidentId,
                                          "participationHours",
                                          Number.parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-20"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Checkbox
                                      checked={record?.leadershipRole || false}
                                      onCheckedChange={(checked) =>
                                        updateActivityRecord(memberId, incidentId, "leadershipRole", !!checked)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Checkbox
                                      checked={record?.specialEquipmentUsed || false}
                                      onCheckedChange={(checked) =>
                                        updateActivityRecord(memberId, incidentId, "specialEquipmentUsed", !!checked)
                                      }
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
            )}
          </TabsContent>

          {/* 計算結果 */}
          <TabsContent value="results" className="space-y-6">
            {payrollCalculations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">計算設定と詳細入力を完了すると結果が表示されます</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* 集計情報 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>計算結果集計</span>
                      <div className="flex gap-2">
                        <Button variant="outline" className="bg-transparent">
                          <FileText className="h-4 w-4 mr-2" />
                          明細出力
                        </Button>
                        <Button variant="outline" className="bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          CSV出力
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">対象者数</p>
                        <p className="text-2xl font-bold text-blue-600">{payrollCalculations.length}名</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">総支給額</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(payrollCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0))}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">平均支給額</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(
                            payrollCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0) /
                              payrollCalculations.length,
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">支払い種別</p>
                        <p className="text-2xl font-bold text-purple-600">{PAYMENT_TYPE_LABELS[selectedBatch.type]}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 個別計算結果 */}
                {payrollCalculations.map((calc) => (
                  <Card key={calc.memberId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{calc.memberName}</span>
                          <Badge>{calc.rank}</Badge>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(calc.totalAmount)}</div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedBatch.type === "annual" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">基本年額</p>
                            <p className="font-semibold">{formatCurrency(calc.details.baseAmount)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">勤続年数加算</p>
                            <p className="font-semibold">{formatCurrency(calc.details.serviceYearBonus)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">特別手当</p>
                            <p className="font-semibold">{formatCurrency(calc.details.specialAllowance)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">勤続年数</p>
                            <p className="font-semibold">{calc.details.yearsOfService}年</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">総活動時間</p>
                              <p className="font-semibold">{calc.details.totalHours}時間</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">基本手当</p>
                              <p className="font-semibold">{formatCurrency(calc.details.baseAllowance)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">危険手当</p>
                              <p className="font-semibold">{formatCurrency(calc.details.riskAllowance)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">指揮手当</p>
                              <p className="font-semibold">{formatCurrency(calc.details.leadershipAllowance)}</p>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-semibold mb-2">事案別詳細</h4>
                            <div className="space-y-2">
                              {calc.details.incidents.map((incident: any, index: number) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span>
                                    {incident.incidentName} ({incident.hours}時間)
                                  </span>
                                  <span className="font-mono">{formatCurrency(incident.pay)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return null
}
