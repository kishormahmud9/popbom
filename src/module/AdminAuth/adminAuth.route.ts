import { Router } from "express";
import validateRequest from "../../app/middleware/validateRequest";
import { AdminAuthValidations } from "./adminAuthValidation";
import { AdminAuthController } from "./adminAuth.controller";

const router = Router();

router.post("/login", validateRequest(AdminAuthValidations.login), AdminAuthController.loginAdmin);

router.post("/forgot-password", validateRequest(AdminAuthValidations.forgotPassword), AdminAuthController.forgotPassword);

router.post("/verify-otp", validateRequest(AdminAuthValidations.verifyOTP), AdminAuthController.verifyOTP);



export const AdminAuthRoutes = router;