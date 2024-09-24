import React from "react";

export default function Modal({ isOpen, onClose, messages ,userData }) {
  if (!isOpen) return null;
  const userName = userData?.name || 'User';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="z-10 max-w-[600px] w-full flex flex-col space-y-6 bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600/30 p-4 backdrop-blur-md rounded-xl border border-slate-100/30 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold text-xl">History</h2>
          <button onClick={onClose} className="text-white">Close</button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className="mb-4">
              {message.question && (
                <div className="flex justify-end mb-2">
                  <div className="bg-blue-500 text-white p-2 rounded-lg max-w-3/4">
                    <div className="font-bold">{userName}:</div>
                    <div>{message.question}</div>
                  </div>
                </div>
              )}
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white p-2 rounded-lg max-w-3/4">
                  <div className="font-bold">Bot:</div>
                  <div>{message.response}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}