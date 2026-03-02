'use client'

import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { downloadCSV, printPDF, type ExportData } from '@/lib/export'

type ExportButtonsProps = {
  data: ExportData
  filename: string
}

export function ExportButtons({ data, filename }: ExportButtonsProps) {
  const handleExportCSV = () => {
    downloadCSV(data, filename)
  }

  const handleExportPDF = () => {
    printPDF(data)
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleExportCSV}
        className="gap-1.5"
      >
        <Download size={16} />
        <span className="hidden sm:inline">CSV</span>
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleExportPDF}
        className="gap-1.5"
      >
        <Printer size={16} />
        <span className="hidden sm:inline">PDF</span>
      </Button>
    </div>
  )
}
