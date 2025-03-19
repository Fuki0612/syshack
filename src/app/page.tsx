import { notojp, delagothicone, kiwimaru } from "../font"

export default function Home() {
  return (
    <div className="flex flex-col justify-evenly items-center h-screen py-10">
      <div className="flex space-x-20 items-center px-10 py-5 bg-blue-100">
        <p className={`${notojp.className} text-left font-bold text-5xl w-40`}>ピスラ</p>
        <p className={`${delagothicone.className} text-center text-4xl`}>OK</p>
      </div>
      <div className="flex space-x-20 items-center px-10 py-5">
        <p className={`text-left font-bold text-5xl w-40`}>鉄チン</p>
        <p className={`text-center text-4xl`}></p>
      </div>
      <div className="flex space-x-20 items-center px-10 py-5 shadow-xl bg-gradient-to-r from-cyan-200 to-purple-200">
        <p className={`${kiwimaru.className} text-left text-5xl w-40`}>チャイ</p>
        <p className={`${kiwimaru.className} text-center text-5xl`}>OK</p>
      </div>
    </div>
  );
}