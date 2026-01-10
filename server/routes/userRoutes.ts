import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createUserProject,
  getUserCredits,
  getUserProject,
  purchaseCredits,
  togglePublish,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/credits", protect, getUserCredits);
userRouter.post("/projects", protect, createUserProject);
userRouter.get("/project/:projectId", protect, getUserProject);
userRouter.get("/projects", protect, getUserProject);
userRouter.get("/publish-toggle/:projectId", protect, togglePublish);
userRouter.get("/purchase-credits", protect, purchaseCredits);

export default userRouter;
