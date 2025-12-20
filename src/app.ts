import express, { Application, Request, Response } from "express";
import cors from 'cors';
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import router from "./app/routes";

const app:Application = express()

// parsers
app.use(express.json());
app.use(cors({origin: ['http://localhost:5173',"http://172.252.13.97:5000"], credentials:true}))

// application routes
app.use('/api', router);

app.get('/', (req:Request, res:Response) =>{
    res.send('Pop Bom is running')
})

// error handler
app.use(globalErrorHandler)
app.use(notFound)

export default app;