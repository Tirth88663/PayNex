import HeaderBox from '@/components/HeaderBox'
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.action';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { User } from 'lucide-react';
import React, { use } from 'react'

const Home = async({searchParams : {id,page}}) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();
  console.log("loggedIn : ",loggedIn);
  const accounts = await getAccounts({
    userId: loggedIn?.userId
  })
  console.log("accounts : ",accounts);

if(!loggedIn ) {
    return <div>No loggedIn found</div>;
  }
if(!accounts) {
    return <div>No accounts found</div>;
  } ;

const accounntsData = accounts?.data || [];
const appwriteItemId = (id as string) || accounntsData[0]?.appwriteItemId;

const account = await getAccount({appwriteItemId})

console.log(' accounntsData,account :',{
  accounntsData
  ,account});

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type = "greeting"
            title="Welcome"
            user = {`${loggedIn?.firstName} ${loggedIn?.lastName}`  || 'Guest'}
            subtext = "Access and manage your account and transactions efficently."
          />
          <TotalBalanceBox
            accounts={accounntsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>
        <RecentTransactions 
        accounts={accounntsData}
        transactions={accounts?.transactions}
        appwriteItemId={appwriteItemId}
        page={currentPage}
        />
      </div>
      <RightSidebar
        user={loggedIn}
        transactions={accounts?.transactions}
        banks={accounntsData?.slice(0,2)}
      />
    </section>
  )
}

export default Home