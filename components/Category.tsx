import Image from "next/image";
import { useState } from "react";
import { topCategoryStyles } from "@/constants";
import { cn, formatAmount, formatDateTime } from "@/lib/utils";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";
import TransactionModal from "./TransactionModal";
import { Button } from "./ui/button";

const Category = ({ category, transactions }: CategoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    bg,
    circleBg,
    text: { main, count },
    progress: { bg: progressBg, indicator },
    icon,
  } = topCategoryStyles[category.name as keyof typeof topCategoryStyles] ||
  topCategoryStyles.default;

  const categoryTransactions = transactions?.filter(
    (t) => t.category === category.name
  );

  return (
    <>
      <div className={cn("flex flex-col rounded-xl", bg)}>
        <div 
          className={cn("gap-[18px] flex p-4 cursor-pointer")}
          onClick={() => setIsExpanded(!isExpanded)}
        >
        <figure className={cn("flex-center size-10 rounded-full", circleBg)}>
          <Image src={icon} width={20} height={20} alt={category.name} />
        </figure>
        <div className="flex w-full flex-1 flex-col gap-2">
          <div className="text-14 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className={cn("font-medium", main)}>{category.name}</h2>
              <span className={cn("text-sm", count)}>({category.count})</span>
            </div>
            <div className="flex gap-3">
              <span className="text-success-600 font-medium">
                +${category.creditAmount.toFixed(2)}
              </span>
              <span className="text-red-600 font-medium">
                -${category.debitAmount.toFixed(2)}
              </span>
            </div>
          </div>
          <Progress
            value={(category.count / category.totalCount) * 100}
            className={cn("h-2 w-full", progressBg)}
            indicatorClassName={cn("h-2 w-full", indicator)}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 space-y-4">
          <div className="rounded-lg bg-white/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-medium">{category.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net Amount:</span>
              <span className={cn(
                "font-medium",
                category.totalAmount >= 0 ? "text-success-600" : "text-red-600"
              )}>
                {formatAmount(category.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">% of Total:</span>
              <span className="font-medium">
                {((category.count / category.totalCount) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
            
          <div className="flex justify-end">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              variant="outline"
              className="text-sm"
            >
              View All Transactions
            </Button>
          </div>
        </div>
      )}
      </div>

      <TransactionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        transactions={categoryTransactions}
        category={category.name}
      />
    </>
  );
};

export default Category;