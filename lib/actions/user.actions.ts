'use server';

import { Account, AppwriteException, Client, ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;


export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [
        Query.equal('userId', [userId])
      ]
    )
    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log("getUserInfo \n");
    console.log(error);
  }
}

export const signIn = async ({email, password}:signInProps)=>{
  try {
    // console.log('Starting sign in process for email:', email);
    
    // Create client without API key for authentication
    const { account } = await createAdminClient();
    // console.log('Client created successfully');

    // Create session
    // console.log('Attempting to create email password session...');
    const session = await account.createEmailPasswordSession(email, password);
    // console.log('Session created successfully:', session.$id);
    // cookies().set("appwrite-session", session.secret, {
    //   path: "/",
    //   httpOnly: true,
    //   sameSite: "strict",
    //   secure: true,
    // });
    // Set cookie
    // console.log('Setting session cookie...');
    cookies().set("appwrite-session", session.secret, {
        path: "/",
        httpOnly: true,
        // sameSite: "lax",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    // console.log('Cookie set successfully');

    // Create a new client with the session
    const sessionClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setSession(session.secret);

    const sessionAccount = new Account(sessionClient);
    
    // Get user details
    // console.log('Fetching user details...');

    // const user = await sessionAccount.get();
    const user = await getUserInfo({ userId: session.userId});

    // console.log('User details retrieved successfully');

    return parseStringify(user);
} catch (error) {
    console.error('Sign in error:', error);
    throw error;
}
}

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;
  
  let newUserAccount;

  try {
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(), 
      email, 
      password, 
      `${firstName} ${lastName}`
    );

    if(!newUserAccount) throw new Error('Error creating user')

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: 'personal'
    })

    if(!dwollaCustomerUrl) throw new Error('Error creating Dwolla customer')

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl)

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      }
    )

    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUser);
  } catch (error) {
    console.error('Error', error);
  }
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id})

    // return parseStringify(user);
    // console.log(result);
    return parseStringify(user);
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    cookies().delete('appwrite-session');

    await account.deleteSession('current');
  } catch (error) {
    return null;
  }
}

export const createLinkToken = async (user: User) => {
  try {
    console.log("user for createLinkToken : ",user.userId);
    
    const tokenParams = {
      user: {
        client_user_id: user.$id
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth','transactions','identity'] as Products[], 
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    }

    const response = await plaidClient.linkTokenCreate
    (tokenParams);
      console.log("createLinkToken response : ",response);
    return parseStringify({linkToken: response.data.link_token})
  } catch (error) {
    console.log("createLinkToken error : ",error);
  }
}

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      }
    )

    return parseStringify(bankAccount);
  } catch (error) {
    console.log("An error occurred while creating bank Account :",error);
  }
}

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
      
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;


     
    const accountsRespones = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    

    const accountData = accountsRespones.data.accounts[0];

    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    

    const processorTokenResponse = await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

 

    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    

    if (!fundingSourceUrl) throw Error;
 

    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });
    revalidatePath("/");

    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.log("An error occurred while creating exchanging token:",error);
  }
}  

export const getBanks = async ({userId} : getBanksProps) => {
  try {
    const { database } = await createAdminClient();
console.log("Querying for userId: : ", userId);
    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      // [ Query.search('userId.$id', userId)]
    )
   
    console.log("banks from appwrite : ", banks);
    console.log("banks from appwrite userId : ", banks.documents[0].userId);
    const userBanks = banks.documents.filter(
      (bank) => {
        // Log for debugging
        console.log('Comparing:', 
          bank.userId?.userId, 
          'with', 
          userId
        );
        
        // Exact match
        return bank.userId?.userId === userId;
      }
    );
     console.log("userBanks : ", userBanks);
    return parseStringify(userBanks);
  } catch (error) {
    console.log("getBanks \n");
    console.log(error);
  }
}

export const getBank = async ({documentId} : getBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.getDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      documentId
      // [
      //   Query.equal('bankId', [documentId])
      // ]
    )
    return parseStringify(bank);
  } catch (error) {
    console.log("getBank error : \n");
    console.log(error);
  }
}