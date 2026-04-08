'use client'
import { useState, useContext, useEffect, useRef } from "react";
import { ClipLoader } from "react-spinners";
import Question from "./Question";
import Answers from './Answers';
import { Collapsible } from "./Collapsible";
import { toast } from "react-toastify";
import DateBadge from "./DateBadge";
import { MdOutlineContentCopy } from "react-icons/md";
import { FaCheck } from "react-icons/fa6";
import { parseAnswer } from "@/utils/helper";
import { ChatContext } from "@/context/Context";
import { Backend_API, Get_Chats_API } from "@/constants/env";
import { FaArrowDown } from "react-icons/fa";


function ChatSection({ elementsRef }) {

    const {
        chat,
        setChat,
        isLoggedIn,
        canLoadMore,
        setCanLoadMore,
        isLoadingAns,
        isLoadingChats,
        setIsLoadingChats
    } = useContext(ChatContext);

    const [isCopied, setIsCopied] = useState(false);
    const [daySeparators, setDaySeparators] = useState([]);
    const [visibleDate, setVisibleDate] = useState("");
    const [isDateVisible, setIsDateVisible] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const hideBtnTimeoutRef = useRef(null);
    const chatContainerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const prevScrollHeightRef = useRef(0);

    const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;

    /* -------------------- Date helpers -------------------- */

    const toDayStamp = (millis) => Math.floor(millis / MILLIS_IN_DAY);

    const toDateString = (millis) => {
        const date = new Date(millis);
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const currentYear = new Date().getFullYear();

        if (millis >= todayStart) return "Today";
        if (millis >= todayStart - MILLIS_IN_DAY) return "Yesterday";

        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: date.getFullYear() !== currentYear ? "numeric" : undefined
        });
    };

    /* -------------------- Visible Date Observer -------------------- */

    useEffect(() => {
        if (!chatContainerRef.current || !elementsRef.current.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (!visible.length) return;

                const index = Number(visible[0].target.dataset.index);
                const item = chat[index];
                if (item) setVisibleDate(toDateString(item.timestamp));
            },
            { root: chatContainerRef.current, threshold: 0 }
        );

        elementsRef.current.forEach(el => el && observer.observe(el));
        return () => observer.disconnect();
    }, [chat]);

    /* -------------------- Day Separators -------------------- */

    useEffect(() => {
        const indices = [];

        for (let i = 0; i < chat.length; i++) {
            const curr = toDayStamp(new Date(chat[i].timestamp).getTime());
            const prev =
                i > 0 ? toDayStamp(new Date(chat[i - 1].timestamp).getTime()) : null;

            if (i === 0 || curr !== prev) indices.push(i);
        }

        setDaySeparators(indices);
    }, [chat]);

    /* -------------------- Load More -------------------- */

    const handleLoadMore = async () => {
        if (!isLoggedIn || !canLoadMore || isLoadingChats) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const container = chatContainerRef.current;
        if (!container) return;

        //  save current scroll height
        prevScrollHeightRef.current = container.scrollHeight;

        setIsLoadingChats(true);

        try {
            const res = await fetch(Get_Chats_API + `/${chat.length}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to load chats");

            const data = await res.json();
            if (!data?.chats?.length) return;
            setChat(prev => [...data.chats, ...prev]);
            setCanLoadMore(data.canLoadMore);

        } catch (err) {
            console.error("Unable to load chats:", err);
            toast.error("Could not load chats!");
            setCanLoadMore(false);
        } finally {
            setIsLoadingChats(false);
        }
    };

    /* -------------------- Restore Scroll Position -------------------- */

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        if (prevScrollHeightRef.current) {
            const newScrollHeight = container.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;

            container.scrollTop = diff;
            prevScrollHeightRef.current = 0;
        }
    }, [chat]);

    /* -------------------- Copy Answer -------------------- */

    const handleCopy = async (text) => {
        if (isLoadingAns)
            return toast.warning("Please wait for the answer to load!");

        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
        } catch (err) {
            toast.error("Failed to copy!");
        }
    };

    /* -------------------- Date Badge Visibility -------------------- */

    const handleShowDateBadge = () => {
        setIsDateVisible(true);

        if (scrollTimeoutRef.current)
            clearTimeout(scrollTimeoutRef.current);

        scrollTimeoutRef.current = setTimeout(
            () => setIsDateVisible(false),
            5000
        );
    };

    const handleScroll = (e) => {
        const atTop = e.target.scrollTop <= 10;
        if (atTop) setIsDateVisible(false);
        else handleShowDateBadge();

        const el = chatContainerRef.current;
        if (!el) return;

        const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;

        if (distanceFromBottom > 100) {
            setShowScrollBtn(true);

            if (hideBtnTimeoutRef.current) {
                clearTimeout(hideBtnTimeoutRef.current);
            }

            // auto hide after user stops scrolling
            hideBtnTimeoutRef.current = setTimeout(() => {
                setShowScrollBtn(false);
            }, 1500);
        }
    }

    const scrollToBottom = () => {
        if (!chatContainerRef.current) return;

        chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
        });
    };


    return (
        <div className="w-full z-0">
            <DateBadge visibleDate={visibleDate} isDateVisible={isDateVisible} />

            <div
                className="h-[75vh] max-w-full lg:px-12 flex flex-col p-3 overflow-y-auto overflow-x-hidden text-zinc-300 scrollbar"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                <div className="flex justify-center mb-2">
                    {isLoggedIn && canLoadMore && chat.length > 0 && (
                        <button
                            className="bg-zinc-900 rounded-xl shadow-lg px-2 py-1"
                            onClick={handleLoadMore}
                        >
                            {isLoadingChats ? (
                                <ClipLoader size={16} color="grey" />
                            ) : (
                                "Load More"
                            )}
                        </button>
                    )}
                </div>

                {[...chat].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((chatItem, i) => (
                    <div
                        key={i}
                        data-index={i}
                        ref={(el) => (elementsRef.current[i] = el)}
                        className = {`${(chatItem === chat[chat.length - 1] && !chatItem.answer) ? "h-[60vh]" : ""}
                        ${chatItem === chat[chat.length - 1] ? "min-h-[60vh]" : ""}`}
                    >
                        {daySeparators.includes(i) && (
                            <div className="mx-auto w-fit px-2 bg-zinc-700 rounded-lg">
                                {toDateString(chatItem.timestamp)}
                            </div>
                        )}

                        <Question
                            question={chatItem.question}
                            timestamp={chatItem.timestamp}
                        />

                        <Collapsible>
                            <ul className="max-w-full mt-2">
                                {!chatItem.answer && isLoadingAns && i === chat.length - 1 ? (
                                    <div className="text-zinc-400 animate-dots">
                                        Answering
                                        <span className="dot-1">.</span>
                                        <span className="dot-2">.</span>
                                        <span className="dot-3">.</span>
                                    </div>
                                ) : (
                                    chatItem?.answer &&
                                    parseAnswer(chatItem.answer).map((item, index) => (
                                        <li key={index}>
                                            <Answers
                                                ansType={item.type}
                                                ans={item.content}
                                                language={
                                                    item.type.trim() === 'code'
                                                        ? item.language
                                                        : ''
                                                }
                                            />
                                        </li>
                                    ))
                                )}
                            </ul>
                        </Collapsible>

                        {!isLoadingAns && chatItem.answer && (
                            <button
                                type="button"
                                className="p-2"
                                onClick={() => handleCopy(chatItem.answer)}
                            >
                                {isCopied ? <FaCheck /> : <MdOutlineContentCopy />}
                            </button>
                        )}
                        {showScrollBtn && (
                            <button
                                onClick={scrollToBottom}
                                className="
                                    fixed bottom-38 left-1/2 -translate-x-1/2
                                    bg-black/75 shadow-md hover:bg-zinc-700
                                    text-white p-3 rounded-full
                                    shadow-lg z-50
                                    transition-opacity duration-300
                                    "
                            >
                                <FaArrowDown size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ChatSection;
