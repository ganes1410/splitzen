import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UserContextType {
  userId: string | null;
  userName: string | null;
  setUserId: (id: string | null) => void;
  login: (id: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserIdState(storedUserId);
    }
    setIsLoading(false);
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  const setUserId = (id: string | null) => {
    if (id) {
      localStorage.setItem("userId", id);
    } else {
      localStorage.removeItem("userId");
    }
    setUserIdState(id);
  };

  const login = (id: string) => {
    setUserId(id);
  };

  const logout = () => {
    setUserId(null);
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        userName: user?.name ?? null,
        setUserId,
        login,
        logout,
        isLoading: isLoading || (!!userId && user === undefined),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
