import { catchAsync } from "../../app/utils/catchAsync";
import sendResponse from "../../app/utils/sendResponse";
import status from "http-status";
import { AdminAuthService } from "./adminAuth.service";
import config from "../../app/config";

const loginAdmin = catchAsync(async (req, res) => {

    const result = await AdminAuthService.login(req.body);

    const { accessToken, refreshToken } = result;
    res.cookie('refreshToken', refreshToken, {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Admin logged in successfully',
        data: { accessToken, refreshToken },
    });
});

export const AdminAuthController = {
    loginAdmin,

};