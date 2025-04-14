import { Router } from "express";
import searchController from "../controller/Search/searchController";





const router = Router();

router.get("/:tab/:q", searchController.search);



export default router;