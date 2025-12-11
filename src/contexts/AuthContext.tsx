import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import { apiClient } from "../utils/apiClient";

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
      // 클라이언트 측 유효성 검사
      if (!name.trim()) {
        return { success: false, message: "이름을 입력해주세요." };
      }
      if (!email.trim()) {
        return { success: false, message: "이메일을 입력해주세요." };
      }
      if (!password.trim() || password.length < 4) {
        return { success: false, message: "비밀번호는 4자 이상이어야 합니다." };
      }

      // 서버로 회원가입 데이터 전송
      const requestData = {
        name: name.trim(),
        email: email.trim(),
        password: password,
      };

      console.log("서버로 전송하는 회원가입 데이터:", {
        ...requestData,
        password: "***", // 보안을 위해 비밀번호는 로그에 표시하지 않음
      });

      const response = await apiClient.post("/api/v1/auth/signup", requestData);

      console.log("서버 응답:", response.status, response.data);

      if (response.status === 201) {
        // LocalStorage에도 저장 (기존 로직 유지)
        const users = getUsers();
        const id = email.trim().toLowerCase().split("@")[0] + "_" + Date.now().toString().slice(-6);
        const newUser = {
          id,
          name: response.data.name,
          email: response.data.email,
          password: response.data.password,
          createdAt: Date.now(),
        };
        users.push(newUser);
        saveUsers(users);

        return { success: true, message: "회원가입이 완료되었습니다." };
      }

      return { success: false, message: "회원가입에 실패했습니다." };
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.error || "회원가입에 실패했습니다.",
        };
      }
      return { success: false, message: "회원가입 중 오류가 발생했습니다." };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // API 호출
      const response = await apiClient.post("/api/v1/auth/login", {
        email: email.trim(),
        password: password,
      });

      if (response.status === 200 && response.data["Access Token"] !== undefined) {
        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
        // Access Token 저장 (필요한 경우)
        if (response.data["Access Token"]) {
          localStorage.setItem("accessToken", response.data["Access Token"]);
        }
        return true;
      }

      return false;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        // 에러 응답 처리
        return false;
      }
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
