import express, { Application, Request, Response } from "express";
import cors from 'cors';
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import router from "./app/routes";
import cookieParser from "cookie-parser";

const app:Application = express()

// parsers
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: ['http://localhost:3001',"http://localhost:3000","http://localhost:3003"], credentials:true}))

// application routes
app.use('/api', router);

app.get('/', (req:Request, res:Response) =>{
    res.send('Pop Bom is running')
})

// error handler
app.use(globalErrorHandler)
app.use(notFound)

export default app;