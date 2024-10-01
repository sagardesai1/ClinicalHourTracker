"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { signInWithCustomToken } from "firebase/auth";
import { firebaseAuth } from "@/firebase";

const useFirebaseAuthToken = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const authenticateWithFirebase = async () => {
      try {
        const token = await getToken({ template: "integration_firebase" });
        if (token) {
          await signInWithCustomToken(firebaseAuth, token);
        }
      } catch (error) {
        console.error("Error authenticating with Firebase:", error);
      }
    };

    authenticateWithFirebase();
  }, [getToken]);
};

export default useFirebaseAuthToken;
