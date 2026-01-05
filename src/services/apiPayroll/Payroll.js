import { createPayroll, deletePayroll, getPayrollBoard, getPayrollByFilter, getPayrollById, payrollEvaluationApi, updatePayroll } from "../../config/config";
import axiosInstance from "../axiosInstance";

export const getPayrollDashboard = () => {
    return axiosInstance.get(getPayrollBoard);
}

export const getPayrollManagerByID = (id) => {
    return axiosInstance.get(getPayrollById + `${id}`);
}

export const addPayrollManager = (productName, nationalDefense, economy, nationalDefenseEconomy, payrollType, note, managers) => {
    return axiosInstance.post(createPayroll, {
        productName,
        nationalDefense,
        economy,
        nationalDefenseEconomy,
        payrollType,
        note,
        managers
    });
}

export const updatePayrollManager = (id, productName, nationalDefense, economy, nationalDefenseEconomy, payrollType, note, managers) => {
    return axiosInstance.put(updatePayroll + `${id}`, {
        productName,
        nationalDefense,
        economy,
        nationalDefenseEconomy,
        payrollType,
        note,
        managers
    });
}

export const deletePayrollManager = (id) => {
    return axiosInstance.delete(deletePayroll + `${id}`);
}

export const getEvaluationPayroll = (id) => {
    return axiosInstance.get(payrollEvaluationApi.getByPayroll(id))
}

export const addEvaluationPayroll = (payrollId, year, month, score, amount, comment) => {
    return axiosInstance.post(payrollEvaluationApi.create(payrollId), {
        year,
        month,
        score,
        amount,
        comment
    });
}


export const filterPayrolls = (payrollType, productName, managerName, page, pageSize) => {
    return axiosInstance.post(getPayrollByFilter, {
        payrollType,
        productName,
        managerName,
        page,
        pageSize
    });
}

export const updateEvaluationPayroll = (id, payrollId, year, month, score, amount, comment) => {
    return axiosInstance.put(payrollEvaluationApi.update(payrollId, id), {
        year,
        month,
        score,
        amount,
        comment
    });
}

export const deleteEvaluationPayroll = (id, payrollId) => {
    return axiosInstance.delete(payrollEvaluationApi.delete(payrollId, id));
}
