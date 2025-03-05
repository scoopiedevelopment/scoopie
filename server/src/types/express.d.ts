import { User } from "../controller/Authentication/types";  

declare module "express-serve-static-core" {  
    interface Request {  
        user?: User;  
    }  
}
