
import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const faqData = [
  { question: 'How do I register?', answer: 'Use the sign-up flow, confirm your account, and you will be dropped into the panel ready to explore services and balance controls.' },
  { question: 'How can PayFollows help me make money?', answer: 'Resellers can use the panel to offer services to clients while keeping their own pricing and margins under control.' },
  { question: 'How do I add funds?', answer: 'Open the balance area inside the dashboard and select a supported payment route to top up your account safely.' },
  { question: 'Do you offer targeted services?', answer: 'Yes, many service categories include filters that help you guide campaigns to the right audience and reach target segments more efficiently.' },
  { question: 'How do I place an order?', answer: 'Choose a service, enter the destination details, set the quantity, and submit. The flow is built to be clear and fast.' },
  { question: 'Why choose PayFollows?', answer: 'Because the experience combines reliability, responsive support, and a premium interface without sacrificing practical controls.' },
];

const FaqItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void }> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(20,18,30,0.65)] backdrop-blur-xl">
      <button onClick={onClick} className="flex w-full items-center justify-between p-6 text-left">
        <span className="font-semibold text-white">{question}</span>
        <span className={`rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 p-2 text-fuchsia-200 transition ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus className="h-4 w-4" />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40' : 'max-h-0'}`}>
        <div className="px-6 pb-6 text-sm leading-7 text-slate-400">{answer}</div>
      </div>
    </div>
  );
};

const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const handleToggle = (index: number) => setOpenIndex(openIndex === index ? null : index);

  return (
    <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Questions every new reseller asks.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {faqData.map((item, index) => (
            <FaqItem key={index} question={item.question} answer={item.answer} isOpen={openIndex === index} onClick={() => handleToggle(index)} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
