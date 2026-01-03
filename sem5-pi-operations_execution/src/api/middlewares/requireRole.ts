import { Container } from "typedi";
import IUserRepo from "../../services/IRepos/IUserRepo";
import { Role } from "../../domain/user/role";
import { Request, Response, NextFunction } from "express";

export function requireRole(...allowed: Role[]) {

    return async (req: Request, res: Response, next: NextFunction) => {

        const email = req.headers["x-user-email"] as string;

        if (!email) {
            return res.status(403).json({
                message: "Missing user email header"
            });
        }

        const userRepo = Container.get("UserRepo") as IUserRepo;
        const user = await userRepo.findByEmail(email);

        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        if (!user.isActive || user.isEliminated) {
            return res.status(403).json({ message: "User not allowed" });
        }

        if (!allowed.includes(user.role)) {
            return res.status(403).json({
                message: `User lacks permission. Required: ${allowed.join(", ")}`
            });
        }

        next();
    };
}