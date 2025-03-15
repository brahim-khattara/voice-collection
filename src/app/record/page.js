"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { motion } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const VoiceVisualizer = ({ stream }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgb(200, 200, 200)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 10;
        ctx.fillStyle = `rgb(255, ${Math.min(barHeight + 100, 255)}, ${Math.min(
          barHeight + 100,
          255
        )})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width="200"
      height="60"
      className="rounded bg-gray-200"
    />
  );
};

export default function RecordPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [age, setAge] = useState("");
  const [recordings, setRecordings] = useState({});
  const [recordingBlobs, setRecordingBlobs] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState({
    number: null,
    variation: null,
  });
  const [stream, setStream] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
  const variations = ["أ", "ب", "ج"];

  const startRecording = async (number, variation) => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setStream(audioStream);
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordings((prev) => ({
          ...prev,
          [`${number}-${variation}`]: audioUrl,
        }));

        setRecordingBlobs((prev) => ({
          ...prev,
          [`${number}-${variation}`]: audioBlob,
        }));

        setIsRecording(false);
        setCurrentRecording({ number: null, variation: null });
        setStream(null);
        audioStream.getTracks().forEach((track) => track.stop());
      };

      setIsRecording(true);
      setCurrentRecording({ number, variation });
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 3000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Error accessing microphone. Please ensure you have granted microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setCurrentRecording({ number: null, variation: null });
    }
  };

  const handleSubmit = async () => {
    const requiredRecordings = numbers.length * variations.length;
    const currentRecordings = Object.keys(recordings).length;
  
    if (currentRecordings < requiredRecordings) {
      alert(
        `يرجى إكمال جميع التسجيلات (${currentRecordings}/${requiredRecordings} تم تسجيلها)`
      );
      return;
    }
  
    if (!age) {
      alert("يرجى إدخال العمر");
      return;
    }
  
    try {
      setIsUploading(true);
      setUploadProgress(0);
  
      // Insert participant data into the 'participants' table
      const { data: participantData, error: participantError } = await supabase
        .from("participants")
        .insert([
          {
            age: parseInt(age),
            created_at: new Date().toISOString(),
            upload_completed: false,
          },
        ])
        .select();
  
      if (participantError) {
        console.error("Error saving participant data:", participantError);
        throw new Error(`Error saving participant data: ${participantError.message}`);
      } else {
        console.log("Participant data saved successfully:", participantData);
        const participantId = participantData[0].id;
        console.log("Auto-generated ID:", participantId);
      }
  
      // Upload each recording to the appropriate folder
      const uploadPromises = [];
      let completedUploads = 0;
  
      for (const [key, blob] of Object.entries(recordingBlobs)) {
        const [number, variation] = key.split("-");
  
        // Convert Arabic variation characters to Latin letters
        let variationLatin;
        switch (variation) {
          case "أ":
            variationLatin = "1";
            break;
          case "ب":
            variationLatin = "2";
            break;
          case "ج":
            variationLatin = "3";
            break;
          default:
            variationLatin = variation;
        }
  
        // Create the file path following the desired structure using Latin characters
        const filePath = `number_${number}/person${participantData[0].id}_var${variationLatin}.wav`;
  
        console.log(`Uploading file: ${filePath}`);
  
        // Upload the file to Supabase Storage
        const uploadPromise = supabase.storage
          .from("recordings")
          .upload(filePath, blob, {
            cacheControl: "3600",
            upsert: false,
          })
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error uploading recording ${key}:`, error);
              throw new Error(
                `Error uploading recording ${key}: ${error.message}`
              );
            }
  
            // Update progress
            completedUploads++;
            setUploadProgress(
              Math.floor(
                (completedUploads / Object.keys(recordingBlobs).length) * 100
              )
            );
  
            return data;
          });
  
        uploadPromises.push(uploadPromise);
      }
  
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
  
      // Update the participant record to indicate upload completion
      const { error: updateError } = await supabase
        .from("participants")
        .update({ upload_completed: true })
        .eq("id", participantData[0].id);
  
      if (updateError) {
        console.error("Error updating participant record:", updateError);
        throw new Error(`Error updating participant record: ${updateError.message}`);
      }
  
      setIsUploading(false);
      setUploadProgress(100);
      setSubmissionComplete(true);
  
    } catch (error) {
      console.error("Error submitting recordings:", error);
      setIsUploading(false);
      alert(`حدث خطأ أثناء تحميل التسجيلات: ${error.message}`);
    }
  };

  if (submissionComplete) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-20 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-12 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">تم الإرسال بنجاح!</h1>
          <p className="text-xl mb-8">شكرًا جزيلاً على مشاركتك القيّمة في مشروعنا</p>
          <p className="text-gray-600 mb-12">مساهمتك ستساعد في تطوير تقنية التعرف على الأرقام المزابية</p>
          <Link href="/" className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-indigo-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            التعليمات
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              لكل رقم من <span className="font-bold text-indigo-600">1 إلى 9</span>، قم بتسجيل{" "}
              <span className="font-bold text-indigo-600">3 متغيرات مختلفة</span> لطريقة نطقك للرقم (
              <span className="font-bold">أ، ب، ج</span>).
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              إذا كان بإذا كان بالإمكان، اجعل كل تسجيل مختلفًا قليلًا عن الآخر (
              <span className="font-bold">همس، صراخ، غناء...</span>).
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              اضغط على زر <span className="font-bold text-blue-600">تسجيل</span> لبدء تسجيل الصوت لمتغير معين.
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              أدخل <span className="font-bold">عمرك</span> في الحقل المخصص أسفل الصفحة.
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              تأكد أن{" "}
              <span className="font-bold text-indigo-600">الوقت الإجمالي لكل تسجيل لا يتجاوز 3 ثوانٍ</span> (سيتوقف التسجيل تلقائيًا).
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              يمكنك <span className="font-bold">إعادة التسجيل</span> إذا لم تكن راضيًا عن النتيجة.
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              يُرجى <span className="font-bold">الاستماع إلى كل التسجيلات قبل إرسالها</span>.
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              تأكد من <span className="font-bold text-indigo-600">تسجيل جميع الأرقام والمتغيرات</span> (
              <span className="font-bold">الإجمالي: 27 تسجيلًا</span>).
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              بمجرد <span className="font-bold">إكمال جميع التسجيلات وإدخال بياناتك</span>، اضغط
              على زر <span className="font-bold text-green-600">إرسال جميع التسجيلات</span> لإرسال بياناتك.
            </li>
            <li className="p-2 hover:bg-gray-50 rounded transition-colors">
              تأكد من <span className="font-bold text-red-600">السماح للمتصفح بالوصول إلى الميكروفون</span>،
              وإلا فلن تتمكن من التسجيل.
            </li>
          </ol>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {numbers.map((number, index) => (
            <motion.div 
              key={number} 
              className="bg-white rounded-xl shadow-lg p-6 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (index * 0.1), duration: 0.5 }}
            >
              <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200 text-indigo-700">الرقم {number}</h2>
              <div className="space-y-4">
                {variations.map((variation) => {
                  const recordingKey = `${number}-${variation}`;
                  const hasRecording = recordings[recordingKey];
                  const isCurrentlyRecording =
                    isRecording &&
                    currentRecording.number === number &&
                    currentRecording.variation === variation;

                  return (
                    <div
                      key={variation}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium"> التسجيل {variation}</span>
                        <button
                          onClick={() =>
                            isCurrentlyRecording
                              ? stopRecording()
                              : startRecording(number, variation)
                          }
                          disabled={isUploading}
                          className={`px-4 py-2 rounded-lg min-w-24 transition-colors ${
                            isUploading ? "bg-gray-400 cursor-not-allowed" :
                            isCurrentlyRecording
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : hasRecording
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                        >
                          {isCurrentlyRecording
                            ? "إيقاف"
                            : hasRecording
                            ? "إعادة التسجيل"
                            : "تسجيل"}
                        </button>
                      </div>
                      
                      {isCurrentlyRecording && stream && (
                        <div className="mt-2">
                          <VoiceVisualizer stream={stream} />
                        </div>
                      )}
                      
                      {hasRecording && (
                        <audio
                          controls
                          src={recordings[recordingKey]}
                          className="w-full mt-2"
                        />
                      )}
                      
                      {!hasRecording && !isCurrentlyRecording && (
                        <div className="h-10 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300 rounded p-2">
                          لم يتم التسجيل بعد
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4 text-indigo-800">معلوماتك</h2>
          <div className="flex flex-wrap items-center bg-gray-50 px-6 py-4 rounded-lg gap-4">
            <label className="text-lg font-medium text-gray-700 flex items-center">
              العمر:
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mr-2 w-24 p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                min="0"
                max="120"
                placeholder="العمر"
                disabled={isUploading}
              />
            </label>
          </div>
        </motion.div>

        {isUploading && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-indigo-700">جاري رفع التسجيلات...</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-indigo-800 font-medium">{uploadProgress}% تم التحميل</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className={`
              text-xl font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-300
              ${
                isUploading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 text-white hover:shadow-xl transform hover:-translate-y-1"
              }
            `}
          >
            {isUploading ? "جاري الإرسال..." : "إرسال جميع التسجيلات"}
          </button>
          
          <div className="mt-4 text-sm text-gray-600">
            إجمالي التسجيلات المطلوبة: 27 | تم تسجيل: {Object.keys(recordings).length}
          </div>
        </div>
      </div>
    </div>
  );
}