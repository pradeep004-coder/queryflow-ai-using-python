import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import ConfirmLogout from "./ConfirmLogout";
import { SlLogin, SlLogout } from "react-icons/sl";
import { Backend_API, Get_Chats_API } from "@/constants/env";
import { ChatContext } from "@/context/Context";


function Sidebar({ denySidebar, elementsRef }) {
  const [isOpening, setIsOpening] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    isLoggedIn,
    canLoadMore,
    chat,
    setChat,
    setCanLoadMore,
    isLoadingAns,
    isLoadingChats,
    setIsLoadingChats
  } = useContext(ChatContext);

  const router = useRouter();

  /* ---------------- Sidebar Opening Animation ---------------- */

  useEffect(() => {
    setIsOpening(true);
  }, []);

  /* ---------------- Close Sidebar ---------------- */

  const handleCloseSidebar = () => {
    setIsOpening(false);
    setTimeout(denySidebar, 100);
  };

  /* ---------------- Load More Chats ---------------- */

  const handleLoadMore = async () => {
    if (!isLoggedIn || !canLoadMore || isLoadingChats) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    setIsLoadingChats(true);

    try {
      const res = await fetch( Get_Chats_API + `/${chat.length}`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load chats");
      }

      const data = await res.json();

      if (!data?.chats?.length) {
        setCanLoadMore(false);
        return;
      }

      setChat((prev) => [...data.chats, ...prev]);
      setCanLoadMore(data.canLoadMore);
    } catch (err) {
      console.error(err);
      toast.error("Could not load chats!");
    } finally {
      setIsLoadingChats(false);
    }
  };

  /* ---------------- Logout ---------------- */

  const handleLogout = () => {
    setShowConfirm(true);
  };

  return (
    <div
      className="bg-black/50 z-20 h-full w-full fixed left-0 top-0"
      onClick={handleCloseSidebar}
    >
      <div
        className={`bg-zinc-800 h-full p-3
        w-[80%] lg:w-[30%]
        shadow-lg flex flex-col
        transition-all duration-300 ease-in-out
        transform ${isOpening ? "translate-x-0" : "-translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            className="text-zinc-300 hover:text-white text-lg font-bold"
            onClick={handleCloseSidebar}
          >
            ✕
          </button>
        </div>

        <div className="border-b border-white text-center select-none">
          History
        </div>

        {/* Chat List */}
        <div className="flex-grow overflow-y-auto scrollbar">
          {[...chat].reverse().map((item, index) => (
            <div
              key={index}
              className={`p-1 truncate cursor-pointer hover:bg-zinc-700
                ${isLoadingAns && !item.answer ? "fade-text" : ""}`}
              onClick={() =>
                elementsRef.current[
                  chat.length - index - 1
                ]?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              {item.question}
            </div>
          ))}

          {/* Load More */}
          {isLoggedIn && canLoadMore && chat.length > 0 && (
            <div className="flex justify-center mt-2">
              <button
                className="bg-zinc-900 text-sm rounded-lg px-3 py-1"
                onClick={handleLoadMore}
                disabled={isLoadingChats}
              >
                {isLoadingChats ? (
                  <ClipLoader size={12} color="grey" />
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-2">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500 hover:bg-red-400 mx-auto flex gap-2 px-3 py-1 rounded-md"
            >
              <span>Log out</span>
              <SlLogout size={16}/>
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="bg-zinc-700 hover:bg-zinc-600 mx-auto flex gap-2 px-4 py-2 rounded-md"
            >
              <span>Login</span>
              <SlLogin size={18}/>
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmLogout
          setShow={setShowConfirm}
          handleCloseSidebar={handleCloseSidebar}
        />
      )}
    </div>
  );
}

export default Sidebar;
