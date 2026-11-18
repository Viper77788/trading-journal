import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  onOpened: () => void;
  reducedMotion: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({
  onOpened,
  reducedMotion,
}) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenClick = () => {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(
      () => {
        onOpened();
      },
      reducedMotion ? 260 : 640
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFBF2] flex items-center justify-center p-4 book-perspective-stage">
      <motion.button
        type="button"
        onClick={handleOpenClick}
        style={{ transformOrigin: 'left center' }}
        initial={{ rotateY: 0, opacity: 1, scale: 1 }}
        animate={
          isOpening
            ? reducedMotion
              ? { opacity: 0, scale: 0.96 }
              : { rotateY: -160, opacity: 0.15 }
            : { rotateY: 0, opacity: 1, scale: 1 }
        }
        transition={{
          duration: reducedMotion ? 0.25 : 0.62,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="relative w-full max-w-[440px] min-h-[540px] rounded-r-3xl rounded-l-xl bg-[#8B5E3C] border-4 border-[#5C3D2E] p-7 flex flex-col items-center justify-between text-center cursor-pointer shadow-2xl"
      >
        {/* Left Stitched Binding Strip on Cover */}
        <div className="absolute top-0 bottom-0 left-0 w-7 bg-[#5C3D2E] rounded-l-lg border-r-2 border-dashed border-[#FFFBF2]/40 flex flex-col items-center justify-evenly py-6">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFFBF2]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFFBF2]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFFBF2]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFFBF2]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFFBF2]/70" />
        </div>

        {/* Stacked Paper Edges on the Right Side */}
        <div className="absolute top-3 bottom-3 -right-2.5 w-2.5 bg-[#FFFDF7] border-y-2 border-r-2 border-[#5C3D2E] rounded-r-md" />

        <div className="pl-4 pt-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#F2D29B] border-2 border-[#5C3D2E] font-heading text-[15px] font-bold uppercase tracking-wider text-[#5C3D2E]">
            PRIVATE HABIT JOURNAL
          </span>
        </div>

        {/* Cream Notebook Label Plate on the Brown Cover */}
        <div className="ml-4 w-full max-w-[330px] p-6 rounded-2xl bg-[#FFFDF7] border-4 border-[#5C3D2E] shadow-md space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E]">
            <BookOpen className="w-7 h-7 stroke-[2.3]" />
          </div>
          <h1 className="font-heading text-[28px] sm:text-[32px] font-bold uppercase text-[#8B5E3C] leading-tight m-0">
            DAILY TRADING TRACKER
          </h1>
          <div className="border-t-2 border-dotted border-[#8B5E3C]/50 pt-2.5 text-[17px] font-bold text-[#5C3D2E]">
            Risk, Discipline &amp; Future Notebook
          </div>
        </div>

        {/* Tap to Open Prompt */}
        <div className="pl-4 pb-2">
          <span className="inline-flex items-center gap-2 px-6 py-3 min-h-[52px] rounded-full bg-[#BFE3C0] border-2 border-[#5C3D2E] font-heading text-[18px] font-bold uppercase text-[#2F6B3A] shadow-sm">
            {isOpening ? 'Opening book...' : 'Tap to open →'}
          </span>
        </div>
      </motion.button>
    </div>
  );
};
