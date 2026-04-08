import { useContext } from "react";
import { ChatContext } from '@/context/Context';
import { useRouter } from "next/navigation";

function Navbar({ openSidebar }) {
  const { isLoggedIn } = useContext(ChatContext);
  const router = useRouter();
  return (
    <nav className='flex bg-zinc-900 z-10'>
      <button
        type='button'
        className='p-2'
        onClick={
          (e) => {
            e.stopPropagation();
            openSidebar();
          }
        }
      >☰</button>
      <h2 className='my-auto flex-grow text-lg text-center font-semibold select-none cursor-pointer'>QueryFlow AI</h2>
      {!isLoggedIn && <button
        type="button"
        className="border-1 border-zinc-400 rounded-xl px-2 py-0 my-2"
        onClick={() => router.push("/login")}
      >Login</button>}
    </nav>
  )
}

export default Navbar;