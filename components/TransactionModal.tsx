import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { formatAmount, formatDateTime, removeSpecialCharacters } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Pagination } from "./Pagination";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  category: string;
}

const ITEMS_PER_PAGE = 10;

const TransactionModal = ({ isOpen, onClose, transactions, category }: TransactionModalProps) => {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {category} Transactions ({transactions.length})
          </DialogTitle>
        </DialogHeader>

        <Table>
          <TableHeader className="bg-[#f9fafb]">
            <TableRow>
              <TableHead className="px-2">Transaction</TableHead>
              <TableHead className="px-2">Amount</TableHead>
              <TableHead className="px-2">Date</TableHead>
              <TableHead className="px-2">Channel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransactions.map((t) => {
              const isDebit = t.type === 'debit' || t.amount < 0;
              return (
                <TableRow key={t.id} className={isDebit ? 'bg-[#FFFBFA]' : 'bg-[#F6FEF9]'}>
                  <TableCell className="max-w-[250px] pl-2 pr-10">
                    <div className="flex items-center gap-3">
                      <h1 className="text-14 truncate font-semibold text-[#344054]">
                        {removeSpecialCharacters(t.name)}
                      </h1>
                    </div>
                  </TableCell>
                  <TableCell className={`pl-2 pr-10 font-semibold ${
                    isDebit ? 'text-[#f04438]' : 'text-[#039855]'
                  }`}>
                    {isDebit ? `-${formatAmount(Math.abs(t.amount))}` : formatAmount(t.amount)}
                  </TableCell>
                  <TableCell className="pl-2 pr-10">
                    {formatDateTime(new Date(t.date)).dateTime}
                  </TableCell>
                  <TableCell className="pl-2 pr-10 capitalize">
                    {t.paymentChannel}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination 
              page={currentPage} 
              totalPages={totalPages}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;