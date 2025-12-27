import express from "express";
import { errors } from "celebrate";
import complementaryTaskRoutes from "../../api/routes/complementaryTaskRoute";

const app = express();
app.use(express.json());

export function loadRoutes() {
    complementaryTaskRoutes(app);
}

app.use(errors());

export default app;