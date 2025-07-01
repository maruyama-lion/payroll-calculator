"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calculator, FileText, Download } from "lucide-react"

interface PayrollData {
  baseSalary: number
  overtimeHours: number
  overtimeRate: number
  transportationAllowance: number
  housingAllowance: number
  otherAllowances: number
  incomeTaxRate: number
  residentTaxRate: number
  socialInsuranceRate: number
  employmentInsuranceRate: number
}

export default function Component() {
  const [payrollData, setPayrollData] = useState<PayrollData>({
    baseSalary: 300000,
    overtimeHours: 20,
    overtimeRate: 1.25,
    transportationAllowance: 10000,
    housingAllowance: 20000,
    otherAllowances: 5000,
    incomeTaxRate: 10.21,
    residentTaxRate: 10,
    socialInsuranceRate: 15,
    employmentInsuranceRate: 0.6,
  })

  const [calculations, setCalculations] = useState({
    overtimePay: 0,
    totalAllowances: 0,
    grossSalary: 0,
    incomeTax: 0,
    residentTax: 0,
    socialInsurance: 0,
    employmentInsurance: 0,
    totalDeductions: 0,
    netSalary: 0,
  })

  const handleInputChange = (field: keyof PayrollData, value: string) => {
    setPayrollData((prev) => ({
      ...prev,
      [field]: Number.parseFloat(value) || 0,
    }))
  }

  const calculatePayroll = () => {
    const hourlyRate = payrollData.baseSalary / 160 // 月160時間想定
    const overtimePay = hourlyRate * payrollData.overtimeHours * payrollData.overtimeRate
    const totalAllowances =
      payrollData.transportationAllowance + payrollData.housingAllowance + payrollData.otherAllowances
    const grossSalary = payrollData.baseSalary + overtimePay + totalAllowances

    const incomeTax = Math.floor(grossSalary * (payrollData.incomeTaxRate / 100))
    const residentTax = Math.floor(grossSalary * (payrollData.residentTaxRate / 100))
    const socialInsurance = Math.floor(grossSalary * (payrollData.socialInsuranceRate / 100))
    const employmentInsurance = Math.floor(grossSalary * (payrollData.employmentInsuranceRate / 100))

    const totalDeductions = incomeTax + residentTax + socialInsurance + employmentInsurance
    const netSalary = grossSalary - totalDeductions

    setCalculations({
      overtimePay,
      totalAllowances,
      grossSalary,
      incomeTax,
      residentTax,
      socialInsurance,
      employmentInsurance,
      totalDeductions,
      netSalary,
    })
  }

  useEffect(() => {
    calculatePayroll()
  }, [payrollData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8" />
          給与計算システム
        </h1>
        <p className="text-muted-foreground">基本給、手当、控除を入力して給与を自動計算します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 入力フォーム */}
        <div className="space-y-6">
          {/* 基本給与 */}
          <Card>
            <CardHeader>
              <CardTitle>基本給与</CardTitle>
              <CardDescription>基本給与と残業代の設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">基本給 (円)</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={payrollData.baseSalary}
                    onChange={(e) => handleInputChange("baseSalary", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtimeHours">残業時間 (時間)</Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    value={payrollData.overtimeHours}
                    onChange={(e) => handleInputChange("overtimeHours", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtimeRate">残業割増率</Label>
                <Input
                  id="overtimeRate"
                  type="number"
                  step="0.01"
                  value={payrollData.overtimeRate}
                  onChange={(e) => handleInputChange("overtimeRate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 各種手当 */}
          <Card>
            <CardHeader>
              <CardTitle>各種手当</CardTitle>
              <CardDescription>交通費、住宅手当などの設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transportationAllowance">交通費 (円)</Label>
                <Input
                  id="transportationAllowance"
                  type="number"
                  value={payrollData.transportationAllowance}
                  onChange={(e) => handleInputChange("transportationAllowance", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housingAllowance">住宅手当 (円)</Label>
                <Input
                  id="housingAllowance"
                  type="number"
                  value={payrollData.housingAllowance}
                  onChange={(e) => handleInputChange("housingAllowance", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherAllowances">その他手当 (円)</Label>
                <Input
                  id="otherAllowances"
                  type="number"
                  value={payrollData.otherAllowances}
                  onChange={(e) => handleInputChange("otherAllowances", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 控除設定 */}
          <Card>
            <CardHeader>
              <CardTitle>控除設定</CardTitle>
              <CardDescription>税金・保険料の控除率設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incomeTaxRate">所得税率 (%)</Label>
                  <Input
                    id="incomeTaxRate"
                    type="number"
                    step="0.01"
                    value={payrollData.incomeTaxRate}
                    onChange={(e) => handleInputChange("incomeTaxRate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residentTaxRate">住民税率 (%)</Label>
                  <Input
                    id="residentTaxRate"
                    type="number"
                    step="0.01"
                    value={payrollData.residentTaxRate}
                    onChange={(e) => handleInputChange("residentTaxRate", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="socialInsuranceRate">社会保険料率 (%)</Label>
                  <Input
                    id="socialInsuranceRate"
                    type="number"
                    step="0.01"
                    value={payrollData.socialInsuranceRate}
                    onChange={(e) => handleInputChange("socialInsuranceRate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentInsuranceRate">雇用保険料率 (%)</Label>
                  <Input
                    id="employmentInsuranceRate"
                    type="number"
                    step="0.01"
                    value={payrollData.employmentInsuranceRate}
                    onChange={(e) => handleInputChange("employmentInsuranceRate", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 計算結果 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                給与計算結果
              </CardTitle>
              <CardDescription>総支給額と手取り額の詳細</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 支給項目 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-green-600">支給項目</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>基本給</span>
                    <span className="font-mono">{formatCurrency(payrollData.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>残業代</span>
                    <span className="font-mono">{formatCurrency(calculations.overtimePay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>各種手当</span>
                    <span className="font-mono">{formatCurrency(calculations.totalAllowances)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>総支給額</span>
                  <span className="font-mono text-green-600">{formatCurrency(calculations.grossSalary)}</span>
                </div>
              </div>

              <Separator />

              {/* 控除項目 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-red-600">控除項目</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>所得税</span>
                    <span className="font-mono">{formatCurrency(calculations.incomeTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>住民税</span>
                    <span className="font-mono">{formatCurrency(calculations.residentTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>社会保険料</span>
                    <span className="font-mono">{formatCurrency(calculations.socialInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>雇用保険料</span>
                    <span className="font-mono">{formatCurrency(calculations.employmentInsurance)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>控除合計</span>
                  <span className="font-mono text-red-600">{formatCurrency(calculations.totalDeductions)}</span>
                </div>
              </div>

              <Separator />

              {/* 手取り額 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">手取り額</span>
                  <span className="text-2xl font-bold font-mono text-blue-600">
                    {formatCurrency(calculations.netSalary)}
                  </span>
                </div>
              </div>

              <Button className="w-full bg-transparent" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                給与明細をダウンロード
              </Button>
            </CardContent>
          </Card>

          {/* 計算詳細 */}
          <Card>
            <CardHeader>
              <CardTitle>計算詳細</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>時給換算 (基本給÷160時間)</span>
                <span className="font-mono">{formatCurrency(payrollData.baseSalary / 160)}</span>
              </div>
              <div className="flex justify-between">
                <span>残業時給 (時給×{payrollData.overtimeRate})</span>
                <span className="font-mono">
                  {formatCurrency((payrollData.baseSalary / 160) * payrollData.overtimeRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>控除率合計</span>
                <span className="font-mono">
                  {(
                    payrollData.incomeTaxRate +
                    payrollData.residentTaxRate +
                    payrollData.socialInsuranceRate +
                    payrollData.employmentInsuranceRate
                  ).toFixed(2)}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
