"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 text-indigo-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            مشروع تسجيل الأرقام المزابية
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            المساهمة في بناء تقنية الذكاء الاصطناعي للتعرف على الأرقام المنطوقة باللغة المزابية
          </motion.p>
        </header>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white rounded-xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-4 text-indigo-700 text-right">مهمتنا</h2>
            <p className="mb-6 text-gray-700 leading-relaxed text-right">
              نهدف إلى جمع مجموعة متنوعة من تسجيلات الأرقام (1-9) المنطوقة باللغة المزابية من أجل تدريب نموذج ذكاء اصطناعي قادر على التعرف عليها بدقة عالية.
            </p>
            <p className="mb-6 text-gray-700 leading-relaxed text-right">
              هذا المشروع يساهم في الحفاظ على اللغة وتعزيز استخدام التكنولوجيا الحديثة للتفاعل معها، مما يساعد على نشرها وتوثيقها للأجيال القادمة.
            </p>
            <div className="flex items-center space-x-2 space-x-reverse text-indigo-600">
              <span>مدة المشاركة: ~5 دقائق فقط</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-indigo-700 text-white rounded-xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-4 text-right">كيف يمكنك المساعدة</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-indigo-500 rounded-full p-1 ml-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-right">تسجيل نطقك للأرقام من 1 إلى 9 باللغة المزابية</span>
              </li>
              <li className="flex items-start">
                <div className="bg-indigo-500 rounded-full p-1 ml-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-right">تقديم 3 متغيرات مختلفة لكل رقم (همس، نطق عادي، غناء...)</span>
              </li>
              <li className="flex items-start">
                <div className="bg-indigo-500 rounded-full p-1 ml-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-right">تسجيل كل رقم بوضوح وبطريقة طبيعية</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link href="/record" className="block text-center bg-white text-indigo-700 font-bold py-3 px-6 rounded-lg hover:bg-indigo-50 transition-colors duration-300">
                المشاركة الآن
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold mb-6 text-indigo-800 text-right">لماذا هذا المشروع مهم؟</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-700 text-right">الحفاظ على التراث</h3>
              <p className="text-gray-600 text-right">توثيق اللغة المزابية ومفرداتها للأجيال القادمة</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-700 text-right">تطوير التقنية</h3>
              <p className="text-gray-600 text-right">بناء تقنيات ذكاء اصطناعي تتعرف على اللغة المزابية</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-700 text-right">توسيع الوصول</h3>
              <p className="text-gray-600 text-right">تمكين المزيد من الأشخاص من التفاعل مع اللغة المزابية</p>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 text-center">
          <Link
            href="/record"
            className="inline-block bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl hover:bg-indigo-800 transition-colors duration-300 shadow-lg"
          >
            المشاركة في المشروع الآن
          </Link>
        </div>
      </div>
    </div>
  );
}