import httpStatus from "http-status";
import { Admin } from "./adminAuth.modal";
import { TLoginAdmin } from "./adminAuth.interface";
import AppError from "../../app/errors/AppError";
import { createToken } from "./adminAuth.utils";
import config from "../../app/config";
import jwt, { JwtPayload } from "jsonwebtoken";

/* 🔹 Login Admin */
const login = async (payload: TLoginAdmin) => {
    const admin = await Admin.isAdminExistByEmail(payload.email);
    if (!admin) {
        throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
    }

    const isPasswordMatched = await Admin.isPasswordMatched(
        payload.password,
        admin.password
    );

    if (!isPasswordMatched) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Password is incorrect");
    }
    const jwtPayload = {
        adminId: admin._id!.toString(),
        email: admin.email,
        role: admin.role || 'admin',
    };

    const accessToken = createToken(jwtPayload, config.jwt_access_secret as string);
    const refreshToken = createToken(jwtPayload, config.jwt_refresh_secret as string);

    return {
        accessToken,
        refreshToken
    };
};

export const AdminAuthService = {
    login,
};
