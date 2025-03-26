import Link from 'next/dist/client/link'
import Rect from 'react'

const RecentTransactions = ({
    accounts,
    transactions=[],
    appwriteItemId,
    page=1,
} : RecentTransactionsProps) => {
  return (
 <section className='recent-transactions'>
    <header className='flex items-center justify-between'> 
        <h2 className='recent-transactions-label'>
            ecent Transactions
        </h2>
        <Link href={`/transaction-history/?id=${appwriteItemId}`} className='view-all-btn'>
            View all
        </Link>
    </header>

    
</section> 
  )
}

export default RecentTransactions