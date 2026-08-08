import React, { createContext, useState, useContext } from "react";
import { db } from "../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// FIREBASE_AUTH_DISABLED — restore these when re-enabling sign in/sign up:
// import { useEffect } from "react";
// import { auth } from "../config/firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";

// Create a context to manage user details
export const UserDetailContext = createContext();

/**
 * UserDetailProvider component that wraps the application to provide user authentication status
 * and user profile information throughout the component tree
 */
// FIREBASE_AUTH_DISABLED — stand-in user so the app runs without signing in.
const GUEST_USER = {
    uid: "guest-local",
    name: "Guest",
    email: "guest@example.com",
    member: false,
};

export const UserDetailProvider = ({ children }) => {
    // FIREBASE_AUTH_DISABLED — starts as the guest instead of null, and isLoading
    // starts false because there is no auth state to wait for.
    const [userDetail, setUserDetail] = useState(GUEST_USER);
    const [isLoading, setIsLoading] = useState(false);

    // FIREBASE_AUTH_DISABLED — the auth-state listener below hits Firebase Auth on
    // every app start. Uncomment this block (and the imports at the top of the file,
    // including useEffect) to turn sign in/sign up back on, and change the two
    // useState calls above back to useState(null) / useState(true).
    //
    // useEffect(() => {
    //     const unsubscribe = onAuthStateChanged(auth, async (user) => {
    //         setIsLoading(true);
    //         if (user) {
    //             // User is signed in
    //             try {
    //                 // Fetch additional user details from Firestore
    //                 const userDoc = await getDoc(doc(db, "users", user.uid));
    //                 if (userDoc.exists()) {
    //                     setUserDetail(userDoc.data());
    //                 } else {
    //                     // User exists in Auth but not in Firestore
    //                     setUserDetail({
    //                         uid: user.uid,
    //                         email: user.email,
    //                         name: user.displayName || "User",
    //                     });
    //                 }
    //             } catch (error) {
    //                 console.error("Error fetching user details:", error);
    //             }
    //         } else {
    //             // User is signed out
    //             setUserDetail(null);
    //         }
    //         setIsLoading(false);
    //     });
    //
    //     // Clean up the listener on unmount
    //     return () => unsubscribe();
    // }, []);

    // Fetch or update user detail from Firestore
    const getUserDetail = async (uid) => {
        try {
            const userRef = doc(db, "users", uid);
            const result = await getDoc(userRef);

            if (result.exists()) {
                const userData = result.data();
                setUserDetail(userData);
                return userData;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user details:", error);
            return null;
        }
    };

    return (
        <UserDetailContext.Provider
            value={{
                userDetail,
                setUserDetail,
                getUserDetail,
                isLoading
            }}
        >
            {children}
        </UserDetailContext.Provider>
    );
};

// Custom hook for using the user detail context
export const useUserDetail = () => {
    const context = useContext(UserDetailContext);
    if (context === undefined) {
        throw new Error("useUserDetail must be used within a UserDetailProvider");
    }
    return context;
};