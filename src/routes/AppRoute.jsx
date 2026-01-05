import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../modules/auth/login/login.jsx";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "../components/MainLayout";
import NotFoundPage from "../components/Notfound";
import Payroll from "../modules/payrollManagements/Payroll.jsx";
import PayrollDetails from "../modules/payrollManagements/PayrollDetail.jsx";
import AccountInfo from "../modules/auth/account/Account.jsx";
import ForgotPassword from "../modules/auth/ForgotPassword/ForgotPassword.jsx";
import CheckOTP from "../modules/auth/ForgotPassword/CheckOTP.jsx";
import ChangePassword from "../modules/auth/ChangePassword/ChangePassword.jsx";

const AppRoute = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/check-otp" element={<CheckOTP />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route path="/fn/payroll-managent" element={<Payroll />} />
            <Route
              path="/payroll/assessment/:id"
              element={<PayrollDetails />}
            />
            <Route path="/profile" element={<AccountInfo />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default AppRoute;
