import { Router } from "express";
import validateRequest from "../../app/middleware/validateRequest";
import { AdminAuthValidations } from "./adminAuthValidation";
import { AdminAuthController } from "./adminAuth.controller";

const router = Router();

router.post("/login", validateRequest(AdminAuthValidations.login), AdminAuthController.loginAdmin);


export const AdminAuthRoutes = router;