import z from "zod";

export const AdminAuthValidations = {
    login: z.object({
        body: z.object({
            email: z.string({ required_error: 'Email is required' }).email(),
            password: z.string({ required_error: 'Password is required' }),
        })
    }),
};