'use server';

import { Account, AppwriteException, Client, ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { parseStringify } from "../utils";

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

    // Set cookie
    // console.log('Setting session cookie...');
    cookies().set("appwrite-session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
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
    const user = await sessionAccount.get();
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
    const { account} = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(), 
      email, 
      password, 
      `${firstName} ${lastName}`
    );

    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUserAccount);
  } catch (error) {
    console.error('Error', error);
  }
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    // const user = await getUserInfo({ userId: result.$id})

    // return parseStringify(user);
    // console.log(result);
    return parseStringify(result);
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