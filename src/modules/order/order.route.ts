import { Router } from "express";
import { orderController } from "./order.controller.js";
import {
  authMiddleware,
  authorizeRoles,
} from "@middlewares/auth.middleware.js";
import { uploadImages, uploadZip } from "@middlewares/upload.middleware.js";

const router: Router = Router();

// customer routes
router.post(
  "/",
  authMiddleware,
  uploadImages.array("images", 50) as any, // max 50 images
  orderController.createOrder.bind(orderController) as any
);

router.get(
  "/",
  authMiddleware,
  orderController.getOrders.bind(orderController) as any
);
router.get(
  "/:id",
  authMiddleware,
  orderController.getOrderById.bind(orderController) as any
);

// admin only routes
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  orderController.updateOrderStatus.bind(orderController) as any
);

router.post(
  "/:id/submission",
  authMiddleware,
  authorizeRoles("admin"),
  uploadZip.single("zip_file") as any,
  orderController.uploadSubmission.bind(orderController) as any
);

export default router;
