import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Trash2, PieChart, Download, Search, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Expense {
  id: string
  amount: number
  category: string
  date: string
  note?: string
}

interface Budget {
  amount: number
  month: string
}

const CATEGORIES = [
  "食品",
  "交通",
  "住房",
  "娱乐",
  "购物",
  "医疗",
  "教育",
  "其他"
]

export default function BudgetManager() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses')
    return saved ? JSON.parse(saved) : []
  })
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [monthlyBudget, setMonthlyBudget] = useState<Budget>(() => {
    const saved = localStorage.getItem('monthlyBudget')
    return saved ? JSON.parse(saved) : { amount: 0, month: new Date().toISOString().slice(0, 7) }
  })

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget))
  }, [monthlyBudget])

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !category || !date) {
      setError('请填写所有必填字段')
      return
    }

    const newExpense = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      category,
      date,
      note: note.trim() || undefined
    }

    setExpenses(prev => [...prev, newExpense].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ))
    setAmount('')
    setCategory('')
    setDate('')
    setNote('')
    setError('')
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id))
  }

  const handleBudgetChange = (value: string) => {
    setMonthlyBudget(prev => ({
      ...prev,
      amount: parseFloat(value) || 0,
      month: selectedMonth
    }))
  }

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
    setMonthlyBudget(prev => ({
      ...prev,
      month: value
    }))
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.note?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMonth = expense.date.startsWith(selectedMonth)
    return matchesSearch && matchesMonth
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const currentMonthExpenses = filteredExpenses
    .filter(expense => expense.date.startsWith(monthlyBudget.month))
    .reduce((sum, expense) => sum + expense.amount, 0)

  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const isOverBudget = monthlyBudget.amount > 0 && currentMonthExpenses > monthlyBudget.amount

  const handleExportData = () => {
    const data = {
      expenses: filteredExpenses,
      budget: monthlyBudget,
      summary: {
        totalExpenses,
        categoryTotals
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-data-${selectedMonth}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = date.toISOString().slice(0, 7)
      const label = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
      options.push({ value, label })
    }
    return options
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择月份" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索支出..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">月度预算设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              type="number"
              value={monthlyBudget.amount}
              onChange={(e) => handleBudgetChange(e.target.value)}
              placeholder="设置月度预算"
              className="max-w-[200px]"
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                当月支出: ¥{currentMonthExpenses.toFixed(2)} / ¥{monthlyBudget.amount.toFixed(2)}
              </span>
              {isOverBudget && (
                <div className="flex items-center text-destructive">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">预算超支!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">添加支出</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">金额</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">备注</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="添加备注（可选）"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full md:w-auto">
              添加支出
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">支出汇总</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-6 h-6" />
                  <span className="text-lg font-semibold">总支出</span>
                </div>
                <span className="text-2xl font-bold">¥{totalExpenses.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(categoryTotals).map(([category, total]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span>{category}</span>
                    <span className="font-medium">¥{total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">分类统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([category, total]) => {
                const percentage = (total / totalExpenses) * 100
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{category}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">支出历史</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>您的支出记录</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.note || '-'}</TableCell>
                  <TableCell className="text-right">¥{expense.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}