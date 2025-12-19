import React, { createContext, useContext, useState, ReactNode } from "react";
import { authService } from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const getUsers = () => {
    const usersJson = localStorage.getItem("users");
    return usersJson ? JSON.parse(usersJson) : [];
  };

  const saveUsers = (users: any[]) => {
    localStorage.setItem("users", JSON.stringify(users));
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authService.signUp(name.trim(), email.trim(), password);

      if (response) {
        // LocalStorage에도 저장 (기존 로직 유지)
        const users = getUsers();
        const id = email.trim().toLowerCase().split("@")[0] + "_" + Date.now().toString().slice(-6);
        const newUser = {
          id,
          name: response.name ?? name,
          email: response.email ?? email,
          password: response.password ?? password,
          createdAt: Date.now(),
        };
        users.push(newUser);
        saveUsers(users);

        return { success: true, message: "회원가입이 완료되었습니다." };
      }

      return { success: false, message: "회원가입에 실패했습니다." };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.error || "회원가입 중 오류가 발생했습니다.",
      };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.signIn(email.trim(), password);
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
      if (response?.jwtToken?.accessToken) {
        localStorage.setItem("accessToken", response.jwtToken.accessToken);
      }
      return true;
    } catch (error: any) {
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
