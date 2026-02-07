"use client";

interface SectionWrapperProps {
  children: React.ReactNode;
}

const SectionWrapper = ({ children }: SectionWrapperProps) => {
  return (
        <div
          className="flex flex-col w-full bg-white gap-3 box-border py-5 px-3 lg:px-6 py-10 
                     justify-center items-center shadow-md rounded-lg 
                     -translate-y-4 lg:-translate-y-12"
        >
          {children}
        </div>
  );
};

export default SectionWrapper;