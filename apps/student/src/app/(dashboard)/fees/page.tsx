import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getStudentPayments } from "@/features/student/student.service";

export default async function FeesPage() {
  const feeHistory = await getStudentPayments();

  // In a real application, you'd calculate pending dues from a fee_schedule table or similar.
  // We'll mock the pending dues for now and use the feeHistory from student_payment.
  const pendingDues = 1500.00;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Status</h1>
        <p className="text-muted-foreground mt-2">
          Check your paid and pending fees, and download receipts.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-primary-foreground/80">Pending Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">${pendingDues.toFixed(2)}</div>
            <p className="text-sm text-primary-foreground/70 mt-1">Due by Next Month</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fee History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {feeHistory.length === 0 ? (
               <div className="py-6 text-center text-muted-foreground italic text-sm">
                 No fee payment history found.
               </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeHistory.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-mono text-sm">{fee.id.split('-')[0]}</TableCell>
                      <TableCell>${fee.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="default">Paid</Badge>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          on {new Date(fee.payment_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          <Download className="h-3 w-3" /> Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
