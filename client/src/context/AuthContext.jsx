// client/src/context/AuthContext.jsx
import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  company: null,
  subscriptionStatus: null,
  subscriptionLoaded: false,
  setUser: () => {},
  setCompany: () => {},
  setSubscriptionStatus: () => {},
  setSubscriptionLoaded: () => {},
  logout: () => {},
});
