import { catchAsync } from "../../app/utils/catchAsync";
import sendResponse from "../../app/utils/sendResponse";
import status from "http-status";
import { AdminService } from "./admin.service";

const getDashboardData = catchAsync(async (req, res) => {
    const result = await AdminService.getDashboardData();
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: result
    });
});

const getAllUsersData = catchAsync(async (req, res) => {
    const result = await AdminService.getAllUsers();
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'All users retrieved successfully',
        data: result
    });
});

const getAllReportsData = catchAsync(async (req, res) => {
    const result = await AdminService.getAllReports();
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'All reports retrieved successfully',
        data: result
    });
});

const getAdminProfileData = catchAsync(async (req, res) => {
    const result = await AdminService.getAdminProfile(req.params.id);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Admin Profile retrieved successfully',
        data: result
    });
});

export const AdminController = {
    getDashboardData,
    getAllUsersData,
    getAllReportsData,
    getAdminProfileData,
};