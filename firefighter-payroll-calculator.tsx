"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Flame, Users, Calculator, FileText, Download } from "lucide-react"

// 事案の種類と手当単価
const INCIDENT_TYPES = {
  fire: { name: "火災出動", baseRate: 3000, riskMultiplier: 1.5 },
  rescue: { name: "救助出動", baseRate: 2500, riskMultiplier: 1.3 },
  emergency: { name: "救急支援", baseRate: 2000, riskMultiplier: 1.0 },
  training: { name: "訓練", baseRate: 1500, riskMultiplier: 1.0 },
  patrol: { name: "警戒巡視", baseRate: 1000, riskMultiplier: 1.0 },
  meeting: { name: "会議・点検", baseRate: 800, riskMultiplier: 1.0 },
}

// 階級と基本手当
const RANKS = {
  captain: { name: "団長", multiplier: 2.0 },
  deputy: { name: "副団長", multiplier: 1.8 },
  chief: { name: "分団長", multiplier: 1.6 },
  lieutenant: { name: "副分団長", multiplier: 1.4 },
  sergeant: { name: "部長", multiplier: 1.2 },
  member: { name: "団員", multiplier: 1.0 },
}

interface Incident {
  id: string
  name: string
  type: keyof typeof INCIDENT_TYPES
  date: string
  duration: number
  riskLevel: number
  description: string
}

interface Member {
  id: string
  name: string
  rank: keyof typeof RANKS
  yearsOfService: number
}

interface ActivityRecord {
  memberId: string
  incidentId: string
  participationHours: number
  leadershipRole: boolean
  specialEquipmentUsed: boolean
  notes: string
}

interface PayrollCalculation {
  memberId: string
  memberName: string
  rank: string
  totalHours: number
  baseAllowance: number
  riskAllowance: number
  leadershipAllowance: number
  equipmentAllowance: number
  totalPay: number
  incidents: Array<{
    incidentName: string
    hours: number
    pay: number
  }>
}

export default function Component() {
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
    },
    {
      id: "inc002",
      name: "交通事故救助",
      type: "rescue",
      date: "2024-01-18",
      duration: 2,
      riskLevel: 2,
      description: "車両事故による救助活動",
    },
    {
      id: "inc003",
      name: "月例訓練",
      type: "training",
      date: "2024-01-20",
      duration: 3,
      riskLevel: 1,
      description: "放水訓練・救助訓練",
    },
    {
      id: "inc004",
      name: "救急支援",
      type: "emergency",
      date: "2024-01-22",
      duration: 1,
      riskLevel: 1,
      description: "救急車支援活動",
    },
  ])

  const [members] = useState<Member[]>([
    { id: "mem001", name: "田中 太郎", rank: "chief", yearsOfService: 15 },
    { id: "mem002", name: "佐藤 次郎", rank: "lieutenant", yearsOfService: 8 },
    { id: "mem003", name: "鈴木 三郎", rank: "sergeant", yearsOfService: 5 },
    { id: "mem004", name: "高橋 四郎", rank: "member", yearsOfService: 3 },
    { id: "mem005", name: "渡辺 五郎", rank: "member", yearsOfService: 2 },
  ])

  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([])
  const [payrollCalculations, setPayrollCalculations] = useState<PayrollCalculation[]>([])

  const handleIncidentSelection = (incidentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIncidents([...selectedIncidents, incidentId])
    } else {
      setSelectedIncidents(selectedIncidents.filter((id) => id !== incidentId))
      // 関連する活動記録も削除
      setActivityRecords(activityRecords.filter((record) => record.incidentId !== incidentId))
    }
  }

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId])
    } else {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
      // 関連する活動記録も削除
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

  const calculatePayroll = () => {
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

        // 基本手当計算
        const basePayForIncident = incidentType.baseRate * rankMultiplier * hours
        baseAllowance += basePayForIncident

        // リスク手当計算
        const riskPayForIncident = basePayForIncident * (incidentType.riskMultiplier - 1) * incident.riskLevel * 0.1
        riskAllowance += riskPayForIncident

        // 指揮手当
        if (record.leadershipRole) {
          leadershipAllowance += basePayForIncident * 0.2
        }

        // 特殊装備手当
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

      const totalPay = baseAllowance + riskAllowance + leadershipAllowance + equipmentAllowance

      calculations.push({
        memberId,
        memberName: member.name,
        rank: RANKS[member.rank].name,
        totalHours,
        baseAllowance,
        riskAllowance,
        leadershipAllowance,
        equipmentAllowance,
        totalPay,
        incidents: incidentDetails,
      })
    })

    setPayrollCalculations(calculations)
  }

  useEffect(() => {
    if (selectedMembers.length > 0 && selectedIncidents.length > 0) {
      calculatePayroll()
    }
  }, [activityRecords, selectedMembers, selectedIncidents])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-red-600" />
          消防団員給与計算システム
        </h1>
        <p className="text-muted-foreground">事案別活動実績から団員の給与を一括計算します</p>
      </div>

      <Tabs defaultValue="selection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="selection">事案・団員選択</TabsTrigger>
          <TabsTrigger value="activity">活動実績入力</TabsTrigger>
          <TabsTrigger value="calculation">給与計算結果</TabsTrigger>
          <TabsTrigger value="summary">集計・出力</TabsTrigger>
        </TabsList>

        {/* 事案・団員選択 */}
        <TabsContent value="selection" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  対象事案選択
                </CardTitle>
                <CardDescription>給与計算対象とする事案を選択してください</CardDescription>
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
                        <p>{incident.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  対象団員選択
                </CardTitle>
                <CardDescription>給与計算対象とする団員を選択してください</CardDescription>
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
          </div>
        </TabsContent>

        {/* 活動実績入力 */}
        <TabsContent value="activity" className="space-y-6">
          {selectedMembers.length === 0 || selectedIncidents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">事案と団員を選択してから活動実績を入力してください</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>活動実績入力</CardTitle>
                <CardDescription>各団員の各事案での活動実績を入力してください</CardDescription>
              </CardHeader>
              <CardContent>
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
                                  onChange={(e) => updateActivityRecord(memberId, incidentId, "notes", e.target.value)}
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 給与計算結果 */}
        <TabsContent value="calculation" className="space-y-6">
          {payrollCalculations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">活動実績を入力すると給与計算結果が表示されます</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payrollCalculations.map((calc) => (
                <Card key={calc.memberId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{calc.memberName}</span>
                        <Badge>{calc.rank}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(calc.totalPay)}</div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">総活動時間</p>
                        <p className="font-semibold">{calc.totalHours}時間</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">基本手当</p>
                        <p className="font-semibold">{formatCurrency(calc.baseAllowance)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">危険手当</p>
                        <p className="font-semibold">{formatCurrency(calc.riskAllowance)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">指揮手当</p>
                        <p className="font-semibold">{formatCurrency(calc.leadershipAllowance)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">事案別詳細</h4>
                      <div className="space-y-2">
                        {calc.incidents.map((incident, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>
                              {incident.incidentName} ({incident.hours}時間)
                            </span>
                            <span className="font-mono">{formatCurrency(incident.pay)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 集計・出力 */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                給与計算集計
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">対象団員数</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedMembers.length}名</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">対象事案数</p>
                  <p className="text-2xl font-bold text-green-600">{selectedIncidents.length}件</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">総活動時間</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {payrollCalculations.reduce((sum, calc) => sum + calc.totalHours, 0)}時間
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">総支給額</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(payrollCalculations.reduce((sum, calc) => sum + calc.totalPay, 0))}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  給与明細一括出力
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  CSV形式でダウンロード
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
