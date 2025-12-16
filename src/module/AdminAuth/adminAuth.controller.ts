import { catchAsync } from "../../app/utils/catchAsync";
import sendResponse from "../../app/utils/sendResponse";
import status from "http-status";
import { AdminAuthService } from "./adminAuth.service";

const loginAdmin = catchAsync(async (req, res) => {
    
    const result = await AdminAuthService.login(req.body);
    
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Admin logged in successfully',
        data: result
    });
});

export const AdminAuthController = {
    loginAdmin,
 
};