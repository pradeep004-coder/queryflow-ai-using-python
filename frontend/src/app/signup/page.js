'use client'
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { ChatContext } from '@/context/Context';
import { Backend_API, Signup_API } from '@/constants/env';
import { trimObjectValues } from '@/utils/helper';


export default function Singup() {
    const [isSigning, setIsSigning] = useState(false);
    const [signupData, setSignupData] = useState({
        email: "",
        name: "",
        password: ""
    });
    const { setIsLoggedIn } = useContext(ChatContext);
    const router = useRouter();
    const emailRegex = /[a-zA-Z0-9+-_.%]+@[^\s@]+\.[a-z]{2,}$/;
    const nameRegex = /[a-zA-Z\s']+$/;

    const capitalize = (str) => {
        const capitalizedName = str.split(' ').map((item => {
            return item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
        }))
        return capitalizedName.join(' ');
    }

    const handleChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSignupData({ ...trimObjectValues(signupData), name: capitalize(signupData.name) });

        if (!signupData.name) return toast.warning("Enter name!!");
        if (!nameRegex.test(signupData.name)) return toast.warning("Invalid name!!");
        if (signupData.name.length < 5) return toast.warning("Name must be atleast 5 characters long!!");
        if (!signupData.email) return toast.warning("Enter email!!");
        if (!emailRegex.test(signupData.email)) return toast.warning("Invalid email!!");
        if (signupData.email.includes(" ")) return toast.warning("Email should not contain whitespace!!");
        if (!signupData.password) return toast.warning("Enter password!!");
        if (signupData.password.includes(" ")) return toast.warning("Password should not contain whitespace!!");
        if (signupData.password.length < 6) return toast.warning("Password must be atleast 6 characters long!!");

        setIsSigning(true);

        try {
            const res = await fetch(Signup_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...signupData })
            });

            if (res.status === 409) {
                toast.warning("Email is already registered!!");
                setIsSigning(false);
                return;
            }

            const data = await res.json();

            if (data?.token) {
                localStorage.setItem("token", data.token);
                setIsLoggedIn(true);

                toast.success("Signup successful!");
                setTimeout(() => router.push("/"), 500);
            } else {
                throw new Error("Token is missing");
            }

        } catch (error) {
            console.error("Signup error: ", error);
            toast.error("Signup failed!!");
        } finally {
            setIsSigning(false);
        }

    }

    return (
        <>
            <div className='h-screen w-full bg-zinc-200 text-black fixed'>
                <form className='p-2 w-[80%] md:w-[400px] mx-auto mt-[10%]' onSubmit={handleSubmit}>
                    <div className="flex flex-col mb-3">
                        <label>Full Name*:</label>
                        <input className='border-1 p-1 px-2 rounded-md' placeholder=" enter your name ..." name='name' value={signupData.name} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col mb-3">
                        <label>Email address*:</label>
                        <input className='border-1 p-1 px-2 rounded-md' placeholder=" enter email ..." name='email' value={signupData.email} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col">
                        <label>Password*:</label>
                        <input type="password" placeholder=" create password" className='border-1 p-1 px-2 rounded-md' name='password' value={signupData.password} onChange={handleChange} />
                    </div>
                    <div className='flex flex-col justify-center mt-5'>
                        <button type='submit' className={`px-2 py-1 text-zinc-100 font-bold rounded-lg ${isSigning ? "bg-zinc-400" : "bg-zinc-600 hover:bg-zinc-500"}`} disabled={isSigning}>
                            {isSigning ? <ClipLoader
                                color="grey"
                                loading={isSigning}
                                size={12}
                                aria-label="Loading Spinner"
                                data-testid="loader"
                            />
                                : "Create Account"}
                        </button>
                        <small className='text-center'>Already have an account?<Link href='/login' className='text-blue-800'>Login</Link></small>
                    </div>
                </form>
            </div>
        </>
    )
}