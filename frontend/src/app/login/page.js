'use client'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { ChatContext } from '@/context/Context';
import { Login_API } from '@/constants/env';
import { trimObjectValues } from '@/utils/helper';

export default function Login() {
    const [isLogging, setIsLogging] = useState(false);
    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });
    const router = useRouter();
    const emailRegex = /[a-zA-Z0-9+-_.%]+@[^\s@]+\.[a-z]{2,}$/;

    const { setIsLoggedIn } = useContext(ChatContext)


    const handleChange = (e) => {
        setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLogging) return;
        const trimmedData = trimObjectValues(loginData);

        if (!trimmedData.email) return toast.warning("Enter email!!");
        if (!emailRegex.test(trimmedData.email)) return toast.warning("Invalid email!!");
        if (!trimmedData.password) return toast.warning("Enter password!!");
        if (trimmedData.password.includes(" ")) return toast.warning("Password should not contain whitespaces!!");
        if (trimmedData.password.length < 6) return toast.warning("Password length must be atleast 6 characters long!!");

        setIsLogging(true);
        try {
            const res = await fetch(Login_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(trimmedData)
            });

            if (res.status === 404) {
                toast.warning("Email is not registered!!");
                setIsLogging(false);
                return;
            }

            if (res.status === 401) {
                toast.warning("Incorrect password!!");
                setIsLogging(false);
                return;
            }

            if (!res.ok) {
                toast.error("Something went wrong!!");
                setIsLogging(false);
                return;
            }

            const data = await res.json();

            if (data?.token) {
                localStorage.setItem("token", data.token);
                setIsLoggedIn(true);

                toast.success("Login successful!");
                setTimeout(() => router.push("/"), 500);
            }

        } catch (error) {
            console.error("Failed to login:", error);
            toast.error("Login failed!!");
        } finally {
            setIsLogging(false);
        }

    }

    return (
        <>
            <div className='h-screen w-full bg-zinc-200 fixed text-black'>
                <form className='p-2 w-[80%] md:w-[400px] mx-auto mt-[10%]' onSubmit={handleSubmit}>
                    <div className="flex flex-col mb-3">
                        <label>Email address*:</label>
                        <input type='email' placeholder=" enter email ..." value={loginData.email} name="email" className='border-1 p-1 px-2 rounded-md' onChange={handleChange} />
                    </div>
                    <div className="flex flex-col">
                        <label>Password*:</label>
                        <input type="password" placeholder=" enter password ..." value={loginData.password} name="password" className='border-1 p-1 px-2 rounded-md' onChange={handleChange} />
                    </div>
                    <div className='flex flex-col justify-center mt-5'>
                        <button type='submit' className={`px-2 py-1 text-zinc-100 font-bold rounded-lg ${isLogging ? "bg-zinc-400" : "bg-zinc-600 hover:bg-zinc-500"}`} disabled={isLogging}>
                            {isLogging ? <ClipLoader
                                color="grey"
                                loading={isLogging}
                                size={12}
                                aria-label="Loading Spinner"
                                data-testid="loader"
                            />
                                : "Login"}
                        </button>
                        <small className='text-center'>Don't have an account?<Link href="/signup" className='text-blue-800'>Create Account</Link></small>
                    </div>
                </form>
            </div>
        </>
    )
}