// client/src/context/AuthContext.jsx
import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  company: null,
  subscriptionStatus: null,
  setUser: () => {},
  setCompany: () => {},
  setSubscriptionStatus: () => {},
  logout: () => {},
});
