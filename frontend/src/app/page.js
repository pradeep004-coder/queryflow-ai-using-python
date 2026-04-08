'use client';
import { useState, useEffect, useRef, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatSection from '../components/ChatSection';
import WelcomeContent from '../components/WelcomeContent';
import InputSection from '../components/InputSection';
import { toast } from 'react-toastify';
import { ChatContext } from '@/context/Context';
import { Generate_Reasponse_API, Get_Chats_API } from '@/constants/env';

export default function Home() {
  const [query, setQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollContainerRef = useRef(null);
  const elementsRef = useRef([]);
  const textareaRef = useRef(null);
  const { chat, setChat, isLoggedIn, setIsLoggedIn, setCanLoadMore, isLoadingChats, setIsLoadingChats, isLoadingAns, setIsLoadingAns } = useContext(ChatContext);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const loadChats = async () => {
      if (isLoadingChats) return;
      try {
        setIsLoadingChats(true);

        const response = await fetch(Get_Chats_API + `/${chat.length}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          setIsLoggedIn(false);
          localStorage.removeItem("token");
          return;
        }

        const data = await response.json();

        if (Array.isArray(data.chats)) {
          setChat(data.chats);
          setCanLoadMore(data.canLoadMore || false);
          setIsLoggedIn(true);
        }

      } catch (err) {
        console.error("Unable to load chats:", err);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, []);


  useEffect(() => {
    if (!chat.length) return;

    // wait for DOM paint
    requestAnimationFrame(() => {
      const lastElement =
        elementsRef.current[elementsRef.current.length - 1];

      lastElement?.scrollIntoView({
        block: "end",
        behavior: "smooth"
      });
    });
  }, [chat.length > 0]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query])

  const getCurrentTime = () => {
    return Date.now();
  }

  const askQuestion = async () => {

    if (isLoadingAns) return;
    if (chat.length >= 5 && !isLoggedIn) {
      toast.warn("Please login to continue!!");
      return
    }
    setIsLoadingAns(true);

    if (!isLoggedIn) return toast.warning("Please login or signup to enable service!!");
    
    const trimmed = query.trim();
    if (!trimmed) return;

    const newEntry = {
      question: trimmed,
      timestamp: getCurrentTime(),
    }

    setQuery('');
    setChat(prev => [...prev, newEntry]);
    
    // keep scroll at bottom
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.clientHeight;
    }
    
    
    //------- 
    setTimeout(() => {
      const elementArray = elementsRef.current;
      if (!elementArray.length) {
        return;
      }
      elementArray[elementArray.length - 1].scrollIntoView({block: "end", behavior: "smooth"});
      
    }, 50);
    
    try {

      const token = localStorage.getItem("token");

      const response = await fetch(Generate_Reasponse_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newEntry) // question, timestamp
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "AI request failed");
      }

      const data = await response.json();

      setChat(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            answer: data.answer
          };
        }

        return updated;
      });

    } catch (error) {
      console.error("failed to post:", error);
      toast.error(error.message || "Oops!! Something went wrong.");

      setChat(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            answer: "Could not get answer"
          };
        }

        return updated;
      });
    } finally {
      setIsLoadingAns(false);
    }
  }

  const handleInput = (e) => {
    setQuery(e.target.value);
  }

  return (
    <>
      <div className='h-full overflow-hidden flex flex-col'>
        <Navbar openSidebar={() => setShowSidebar(true)} />
        {showSidebar && (<Sidebar
          denySidebar={() => setShowSidebar(false)}
          elementsRef={elementsRef}
        />)
        }
        {!chat.length ?
          <WelcomeContent />
          : <ChatSection
            chat={chat}
            setChat={setChat}
            elementsRef={elementsRef}
          />
        }
        <InputSection
          textareaRef={textareaRef}
          askQuestion={askQuestion}
          query={query}
          handleInput={handleInput}
          setQuery={setQuery}
        />
      </div>
    </>
  )
}
