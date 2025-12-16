import { Router } from "express";
import adminAuth from "../../app/middleware/adminAuth";
import { AdminController } from "./admin.controller";

const router = Router();

router.get("/dashboard", adminAuth, AdminController.getDashboardData);

router.get("/users", adminAuth, AdminController.getAllUsersData);

router.get("/reports", adminAuth, AdminController.getAllReportsData);

router.get("/profile/:id", adminAuth, AdminController.getAdminProfileData);

export const AdminRoutes = router;