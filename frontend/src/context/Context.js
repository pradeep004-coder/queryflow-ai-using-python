'use client'
import react, { useState, createContext } from "react";

const ChatContext = createContext();


const ChatProvider = ({ children }) => {
    const [chat, setChat] = useState([])
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [canLoadMore, setCanLoadMore] = useState(true);
    const [isLoadingAns, setIsLoadingAns] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(false);

    return <ChatContext.Provider value={{ chat, setChat, isLoggedIn, setIsLoggedIn, canLoadMore, setCanLoadMore, isLoadingAns, setIsLoadingAns, isLoadingChats, setIsLoadingChats }}>
        {children}
    </ChatContext.Provider>
}

export  { ChatProvider, ChatContext };