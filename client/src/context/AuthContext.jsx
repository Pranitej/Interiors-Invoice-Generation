// client/src/context/AuthContext.jsx
import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  token: null,
  company: null,
  subscriptionStatus: null,
  setUser: () => {},
  setToken: () => {},
  setCompany: () => {},
  setSubscriptionStatus: () => {},
  logout: () => {},
});
