import { Router } from 'express';
import userRoute from "./routes/userRoute";
import complementaryTaskCategoryRoute from "./routes/complementaryTaskCategoryRoute";

export default () => {
    const app = Router();

    // PESSOAL NÃO APAGAR ISTO!!! IMPORTANTE PARA O SERVIDOR!!!
    app.get('/test', (req, res) => {
        res.json({ result: "Server is alive and using the new arch!" });
    });

    userRoute(app);
    complementaryTaskCategoryRoute(app);
    return app;
}